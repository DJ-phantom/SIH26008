import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, messaging

from backend.db import (
    deactivate_push_device,
    get_active_fcm_tokens,
    has_notification_been_dispatched,
    record_notification_dispatch,
)

logger = logging.getLogger("backend.firebase")

_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="fcm_dispatcher")
_firebase_initialized = False


def mask_token(token: str) -> str:
    """Masks FCM token for logging privacy."""
    if not token or len(token) <= 10:
        return "***"
    return f"{token[:6]}...{token[-4:]}"


def init_firebase_admin() -> bool:
    """Initializes Firebase Admin SDK from FIREBASE_SERVICE_ACCOUNT_JSON env var.
    
    Safe & idempotent: Returns True if configured, False if missing/failed.
    Never crashes backend startup.
    """
    global _firebase_initialized

    if _firebase_initialized:
        return True

    if firebase_admin._apps:
        _firebase_initialized = True
        return True

    raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not raw_json or not raw_json.strip():
        logger.warning(
            "[FirebaseNotifications] FIREBASE_SERVICE_ACCOUNT_JSON env var not configured. Push notifications disabled."
        )
        print("[FirebaseNotifications] STATUS: NOT CONFIGURED (FIREBASE_SERVICE_ACCOUNT_JSON missing)")
        return False

    try:
        cred_dict = json.loads(raw_json.strip())
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("[FirebaseNotifications] STATUS: READY (Firebase Admin SDK initialized successfully)")
        logger.info("[FirebaseNotifications] Firebase Admin SDK initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"[FirebaseNotifications] Error initializing Firebase Admin: {e}")
        print(f"[FirebaseNotifications] STATUS: ERROR initializing Firebase Admin: {e}")
        return False


def is_firebase_configured() -> bool:
    """Returns True if Firebase Admin SDK is ready to send notifications."""
    global _firebase_initialized
    if _firebase_initialized:
        return True
    return bool(firebase_admin._apps)


COMPONENT_MAP = {
    "temperature": "DRIVE HEAD / MOTOR BEARING",
    "vibration": "DRIVE HEAD / MAIN PULLEY / GEARBOX FRAME",
    "current": "DRIVE HEAD / MOTOR DRIVE",
    "speed": "BELT SECTION A / MAIN DRIVE",
    "alignment": "BELT SECTION B / TRACKING",
    "load": "TAIL / LOADING CHUTE",
}


def build_notification_content(
    transition: str,
    metric: str,
    severity: str,
    value: float,
    unit: str,
    alert_id: int,
) -> tuple[str, str]:
    """Generates precise title and body text for FCM alert transitions."""
    metric_upper = metric.upper()
    component = COMPONENT_MAP.get(metric.lower(), "CONVEYOR NODE")

    val_str = f"{value:+.1f}" if metric.lower() == "alignment" else f"{value:.1f}"

    if transition == "ALERT_OPENED":
        if severity.upper() == "CRITICAL":
            title = f"CRITICAL — BELT {metric_upper}"
            body = f"{metric.capitalize()} {val_str} {unit}\nImmediate inspection required.\nTap to inspect event."
        else:
            title = f"WARNING — BELT {metric_upper}"
            body = f"{metric.capitalize()} {val_str} {unit}\n{component}\nTap to inspect event."
    elif transition == "ALERT_ESCALATED":
        title = f"CRITICAL — BELT {metric_upper}"
        body = f"{metric.capitalize()} escalated to {val_str} {unit}\n{component}\nTap to inspect event."
    elif transition == "ALERT_RESOLVED":
        title = f"RESOLVED — BELT {metric_upper}"
        body = f"{metric.capitalize()} returned to normal range.\nEvent #{alert_id} resolved."
    else:
        title = f"ALERT — BELT {metric_upper}"
        body = f"Condition update on Event #{alert_id}."

    return title, body


def _dispatch_fcm_multicast_sync(
    alert_id: int,
    transition: str,
    metric: str,
    severity: str,
    value: float,
    unit: str,
    device_id: str,
):
    """Synchronous FCM dispatch logic run in background thread."""
    if not is_firebase_configured():
        logger.debug("[FirebaseNotifications] Skipping dispatch: Firebase not configured.")
        return

    # Check database idempotency lock
    if has_notification_been_dispatched(alert_id, transition):
        logger.info(f"[FirebaseNotifications] Alert #{alert_id} {transition} already dispatched. Skipping duplicate.")
        return

    tokens = get_active_fcm_tokens()
    if not tokens:
        logger.info(f"[FirebaseNotifications] No active push devices registered for alert #{alert_id} {transition}.")
        record_notification_dispatch(
            alert_id=alert_id,
            transition=transition,
            recipient_count=0,
            success_count=0,
            failure_count=0,
            metadata={"status": "NO_REGISTERED_DEVICES"},
        )
        return

    title, body = build_notification_content(
        transition=transition,
        metric=metric,
        severity=severity,
        value=value,
        unit=unit,
        alert_id=alert_id,
    )

    data_payload = {
        "type": "ALERT",
        "event_type": transition,
        "alert_id": str(alert_id),
        "metric": str(metric),
        "severity": str(severity),
        "title": str(title),
        "body": str(body),
        "route": f"/alerts/{alert_id}",
        "device_id": str(device_id),
    }

    android_config = messaging.AndroidConfig(
        priority="high",
        notification=messaging.AndroidNotification(
            channel_id="srijan_critical_alerts",
            title=title,
            body=body,
        ),
    )

    multicast_msg = messaging.MulticastMessage(
        tokens=tokens,
        data=data_payload,
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        android=android_config,
    )

    success_count = 0
    failure_count = 0

    try:
        response = messaging.send_each_for_multicast(multicast_msg)
        success_count = response.success_count
        failure_count = response.failure_count

        print(
            f"[FirebaseNotifications] Dispatched alert #{alert_id} ({transition}): "
            f"{success_count} succeeded, {failure_count} failed out of {len(tokens)} devices."
        )

        # Process individual token failure responses
        for idx, resp in enumerate(response.responses):
            token = tokens[idx]
            if not resp.success:
                exc = resp.exception
                logger.warning(f"[FirebaseNotifications] Push to device {mask_token(token)} failed: {exc}")
                # Deactivate invalid/unregistered tokens
                if isinstance(exc, (messaging.UnregisteredError, messaging.SenderIdMismatchError)):
                    print(f"[FirebaseNotifications] Deactivating invalid FCM token: {mask_token(token)}")
                    deactivate_push_device(token)
                elif exc and "registration-token-not-registered" in str(exc).lower():
                    print(f"[FirebaseNotifications] Deactivating unregistered token: {mask_token(token)}")
                    deactivate_push_device(token)

        record_notification_dispatch(
            alert_id=alert_id,
            transition=transition,
            recipient_count=len(tokens),
            success_count=success_count,
            failure_count=failure_count,
            metadata={
                "title": title,
                "metric": metric,
                "severity": severity,
            },
        )
    except Exception as err:
        logger.error(f"[FirebaseNotifications] Error sending FCM multicast: {err}")
        print(f"[FirebaseNotifications] FCM multicast dispatch error: {err}")
        record_notification_dispatch(
            alert_id=alert_id,
            transition=transition,
            recipient_count=len(tokens),
            success_count=0,
            failure_count=len(tokens),
            metadata={"error": str(err)},
        )


def dispatch_alert_transition_async(
    alert_id: int,
    transition: str,
    metric: str,
    severity: str,
    value: float,
    unit: str,
    device_id: str,
):
    """Non-blocking async dispatch call queued into thread pool."""
    if not is_firebase_configured():
        return

    _executor.submit(
        _dispatch_fcm_multicast_sync,
        alert_id=alert_id,
        transition=transition,
        metric=metric,
        severity=severity,
        value=value,
        unit=unit,
        device_id=device_id,
    )
