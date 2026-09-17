"""Rule-Based Condition & Alert Engine for Conveyor Telemetry.

SCIENTIFIC DISCLAIMER:
The thresholds configured in this module are PROTOTYPE DEMONSTRATION THRESHOLDS.
They are selected to test software functionality against synthetic operating profiles.
They are NOT validated NMDC operating limits, OEM safety limits, or experimentally calibrated industrial failure limits.

ABSOLUTE RULE:
This alert engine DOES NOT inspect or depend on `telemetry.scenario`.
Alert logic evaluates numerical sensor measurements independently.
"""

import logging
import threading
from typing import Dict, Any, Optional, Tuple
from backend.models import TelemetryData
from backend.db import create_alert, update_alert, resolve_alert, get_active_alerts
from backend.monitoring_config import PROTOTYPE_DEMO_THRESHOLDS

logger = logging.getLogger("backend.alert_engine")

REQUIRED_WARNING_COUNT = 3  # Debounce: require 3 consecutive readings for WARNING
REQUIRED_RECOVERY_COUNT = 3  # Recovery hysteresis: require 3 consecutive safe readings to resolve


class AlertState:
    """Tracks state for a single (device_id, metric) channel in memory."""

    def __init__(self):
        self.consecutive_warning_count: int = 0
        self.consecutive_normal_count: int = 0
        self.active_alert_id: Optional[int] = None
        self.current_severity: Optional[str] = None


class AlertEngine:
    """Stateful rule-based condition and alert processing engine."""

    def __init__(self):
        self._states: Dict[Tuple[str, str], AlertState] = {}
        self._lock = threading.Lock()
        self._synced = False

    def sync_from_db(self):
        """Populates in-memory active alert state from PostgreSQL on backend startup."""
        with self._lock:
            try:
                active_records = get_active_alerts()
                for rec in active_records:
                    key = (rec["device_id"], rec["metric"])
                    state = self._states.setdefault(key, AlertState())
                    state.active_alert_id = rec["id"]
                    state.current_severity = rec["severity"]
                self._synced = True
                print(f"[AlertEngine] Initialized and synced {len(active_records)} active alerts from database.")
            except Exception as e:
                print(f"[AlertEngine] Warning: Could not sync active alerts from database: {e}")

    def evaluate_raw_severity(self, metric: str, value: float) -> str:
        """Determines single-sample raw condition severity for a numerical value.
        
        Explicitly independent of simulation scenario label.
        """
        cfg = PROTOTYPE_DEMO_THRESHOLDS.get(metric)
        if not cfg:
            return "NORMAL"

        mtype = cfg["type"]
        warn_val = cfg["warning"]
        crit_val = cfg["critical"]

        if mtype == "high":
            if value >= crit_val:
                return "CRITICAL"
            elif value >= warn_val:
                return "WARNING"
            return "NORMAL"

        elif mtype == "low":
            if value <= crit_val:
                return "CRITICAL"
            elif value <= warn_val:
                return "WARNING"
            return "NORMAL"

        elif mtype == "abs_high":
            abs_v = abs(value)
            if abs_v >= crit_val:
                return "CRITICAL"
            elif abs_v >= warn_val:
                return "WARNING"
            return "NORMAL"

        return "NORMAL"

    def process_telemetry(self, telemetry: TelemetryData):
        """Processes incoming telemetry packet and evaluates numerical sensor rules.
        
        CRITICAL ARCHITECTURAL GUARANTEE:
        This method extracts numerical measurement attributes ONLY.
        It does NOT inspect `telemetry.scenario`.
        """
        if not self._synced:
            self.sync_from_db()

        device_id = telemetry.device_id

        # Numerical sensor measurements map
        measurements = {
            "temperature": telemetry.temperature,
            "vibration": telemetry.vibration,
            "current": telemetry.current,
            "speed": telemetry.speed,
            "alignment": telemetry.alignment,
            "load": telemetry.load,
        }

        with self._lock:
            for metric, value in measurements.items():
                if metric not in PROTOTYPE_DEMO_THRESHOLDS:
                    continue

                cfg = PROTOTYPE_DEMO_THRESHOLDS[metric]
                raw_severity = self.evaluate_raw_severity(metric, value)
                key = (device_id, metric)
                state = self._states.setdefault(key, AlertState())

                # 1. Raw severity is CRITICAL: Immediate activation / escalation
                if raw_severity == "CRITICAL":
                    state.consecutive_normal_count = 0
                    state.consecutive_warning_count += 1

                    if state.active_alert_id is None:
                        # Create new CRITICAL alert
                        new_id = create_alert(
                            device_id=device_id,
                            metric=metric,
                            severity="CRITICAL",
                            title=cfg["title_critical"],
                            message=cfg["msg_critical"],
                            value=value,
                            unit=cfg["unit"],
                        )
                        if new_id:
                            state.active_alert_id = new_id
                            state.current_severity = "CRITICAL"
                            print(f"[AlertEngine] CRITICAL alert created #{new_id} for {device_id} {metric} = {value}{cfg['unit']}")
                    else:
                        # Update existing active alert
                        if state.current_severity != "CRITICAL":
                            state.current_severity = "CRITICAL"
                            update_alert(
                                alert_id=state.active_alert_id,
                                severity="CRITICAL",
                                message=cfg["msg_critical"],
                                value=value,
                            )
                            print(f"[AlertEngine] Escalated alert #{state.active_alert_id} to CRITICAL for {device_id} {metric} = {value}{cfg['unit']}")
                        else:
                            update_alert(
                                alert_id=state.active_alert_id,
                                severity="CRITICAL",
                                message=cfg["msg_critical"],
                                value=value,
                            )

                # 2. Raw severity is WARNING: Require 3 consecutive readings before activation
                elif raw_severity == "WARNING":
                    state.consecutive_normal_count = 0
                    state.consecutive_warning_count += 1

                    if state.active_alert_id is None:
                        # Debounce WARNING activation
                        if state.consecutive_warning_count >= REQUIRED_WARNING_COUNT:
                            new_id = create_alert(
                                device_id=device_id,
                                metric=metric,
                                severity="WARNING",
                                title=cfg["title_warning"],
                                message=cfg["msg_warning"],
                                value=value,
                                unit=cfg["unit"],
                            )
                            if new_id:
                                state.active_alert_id = new_id
                                state.current_severity = "WARNING"
                                print(f"[AlertEngine] WARNING alert created #{new_id} for {device_id} {metric} = {value}{cfg['unit']} (after {REQUIRED_WARNING_COUNT} sustained readings)")
                    else:
                        # Active alert exists; refresh value & last_seen_at
                        update_alert(
                            alert_id=state.active_alert_id,
                            severity=state.current_severity or "WARNING",
                            message=cfg["msg_critical"] if state.current_severity == "CRITICAL" else cfg["msg_warning"],
                            value=value,
                        )

                # 3. Raw severity is NORMAL: Hysteresis recovery logic
                elif raw_severity == "NORMAL":
                    state.consecutive_warning_count = 0
                    state.consecutive_normal_count += 1

                    if state.active_alert_id is not None:
                        if state.consecutive_normal_count >= REQUIRED_RECOVERY_COUNT:
                            # 3 consecutive normal readings -> Resolve alert!
                            resolve_alert(state.active_alert_id)
                            print(f"[AlertEngine] Resolved alert #{state.active_alert_id} for {device_id} {metric} after {REQUIRED_RECOVERY_COUNT} consecutive safe readings.")
                            state.active_alert_id = None
                            state.current_severity = None


# Global singleton instance for backend
alert_engine = AlertEngine()
