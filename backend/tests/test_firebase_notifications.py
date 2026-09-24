import unittest
from unittest.mock import MagicMock, patch
import json

from fastapi.testclient import TestClient

from backend.main import app
from backend.models import TelemetryData
from backend.alert_engine import AlertEngine
from backend.firebase_notifications import (
    build_notification_content,
    is_firebase_configured,
    mask_token,
)


class TestFirebaseNotificationsAndAlerts(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_token_masking(self):
        token = "fcm_token_1234567890_abcdef"
        masked = mask_token(token)
        self.assertNotIn("1234567890", masked)
        self.assertTrue(masked.startswith("fcm_to"))
        self.assertTrue(masked.endswith("cdef"))

    def test_build_notification_content(self):
        title, body = build_notification_content(
            transition="ALERT_OPENED",
            metric="alignment",
            severity="WARNING",
            value=3.8,
            unit="mm",
            alert_id=42,
        )
        self.assertIn("WARNING", title)
        self.assertIn("BELT ALIGNMENT", title)
        self.assertIn("+3.8 mm", body)
        self.assertIn("BELT SECTION B / TRACKING", body)

        title_crit, body_crit = build_notification_content(
            transition="ALERT_ESCALATED",
            metric="alignment",
            severity="CRITICAL",
            value=5.4,
            unit="mm",
            alert_id=42,
        )
        self.assertIn("CRITICAL", title_crit)
        self.assertIn("+5.4 mm", body_crit)

        title_res, body_res = build_notification_content(
            transition="ALERT_RESOLVED",
            metric="alignment",
            severity="NORMAL",
            value=0.2,
            unit="mm",
            alert_id=42,
        )
        self.assertIn("RESOLVED", title_res)
        self.assertIn("Event #42 resolved", body_res)

    @patch("backend.main.register_push_device")
    def test_device_registration_endpoint(self, mock_register):
        mock_register.return_value = True
        payload = {
            "token": "test_fcm_token_12345",
            "platform": "android",
            "device_label": "Samsung SM M356B"
        }
        res = self.client.post("/api/notifications/register-device", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "registered")
        mock_register.assert_called_once_with(
            token="test_fcm_token_12345",
            platform="android",
            device_label="Samsung SM M356B"
        )

    @patch("backend.main.unregister_push_device")
    def test_device_unregister_endpoint(self, mock_unregister):
        mock_unregister.return_value = True
        payload = {"token": "test_fcm_token_12345"}
        res = self.client.post("/api/notifications/unregister-device", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "unregistered")
        mock_unregister.assert_called_once_with(token="test_fcm_token_12345")

    @patch("backend.main.is_firebase_configured", return_value=False)
    @patch("backend.main.get_active_device_count", return_value=2)
    def test_notification_status_endpoint(self, mock_count, mock_cfg):
        res = self.client.get("/api/notifications/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["firebase_configured"])
        self.assertEqual(data["active_device_count"], 2)
        self.assertEqual(data["dispatch_mode"], "DEMO_BROADCAST")

    @patch("backend.main.get_alert_by_id")
    def test_get_alert_by_id_success(self, mock_get_alert):
        mock_get_alert.return_value = {
            "id": 42,
            "device_id": "CONVEYOR_BELT_01",
            "metric": "alignment",
            "severity": "WARNING",
            "title": "WARNING — BELT MISALIGNMENT",
            "message": "Belt alignment +3.8mm exceeds warning threshold",
            "value": 3.8,
            "unit": "mm",
            "started_at": "2026-09-24T12:00:00Z",
            "last_seen_at": "2026-09-24T12:01:00Z",
            "resolved_at": None,
            "is_active": True,
        }
        res = self.client.get("/api/alerts/42")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], 42)
        self.assertEqual(data["metric"], "alignment")

    @patch("backend.main.get_alert_by_id", return_value=None)
    def test_get_alert_by_id_404(self, mock_get_alert):
        res = self.client.get("/api/alerts/9999")
        self.assertEqual(res.status_code, 404)
        data = res.json()
        self.assertIn("not found", data["detail"])

    @patch("backend.alert_engine.dispatch_alert_transition_async")
    @patch("backend.alert_engine.create_alert")
    @patch("backend.alert_engine.update_alert")
    @patch("backend.alert_engine.resolve_alert")
    def test_alert_engine_transitions_and_anti_spam(
        self, mock_resolve, mock_update, mock_create, mock_dispatch
    ):
        engine = AlertEngine()
        engine._synced = True  # bypass db sync in unit test

        mock_create.return_value = 101

        # 1. Sustained warning reading for alignment only (other metrics normal)
        t_warn = TelemetryData(
            device_id="DEV1", timestamp="1", temperature=30.0, vibration=0.05,
            current=2.0, speed=2.0, alignment=3.5, load=20.0
        )
        engine.process_telemetry(t_warn)
        engine.process_telemetry(t_warn)
        engine.process_telemetry(t_warn)

        # Should create alert #101 and dispatch ALERT_OPENED ONCE
        mock_create.assert_called_once()
        mock_dispatch.assert_called_once_with(
            alert_id=101,
            transition="ALERT_OPENED",
            metric="alignment",
            severity="WARNING",
            value=3.5,
            unit="mm",
            device_id="DEV1",
        )

        mock_dispatch.reset_mock()

        # 2. Continued WARNING readings (unchanged severity) -> Update alert, NO PUSH
        engine.process_telemetry(t_warn)
        engine.process_telemetry(t_warn)
        mock_dispatch.assert_not_called()

        # 3. Sudden jump to CRITICAL for alignment -> Severity escalates to CRITICAL -> dispatch ALERT_ESCALATED ONCE
        t_crit = TelemetryData(
            device_id="DEV1", timestamp="2", temperature=30.0, vibration=0.05,
            current=2.0, speed=2.0, alignment=5.5, load=20.0
        )
        engine.process_telemetry(t_crit)
        mock_dispatch.assert_called_once_with(
            alert_id=101,
            transition="ALERT_ESCALATED",
            metric="alignment",
            severity="CRITICAL",
            value=5.5,
            unit="mm",
            device_id="DEV1",
        )

        mock_dispatch.reset_mock()

        # 4. Continued CRITICAL readings (unchanged severity) -> Update alert, NO PUSH
        engine.process_telemetry(t_crit)
        engine.process_telemetry(t_crit)
        mock_dispatch.assert_not_called()

        # 5. Normal readings (3 sustained required to resolve)
        t_norm = TelemetryData(
            device_id="DEV1", timestamp="3", temperature=30.0, vibration=0.05,
            current=2.0, speed=2.0, alignment=0.1, load=20.0
        )
        engine.process_telemetry(t_norm)
        engine.process_telemetry(t_norm)
        mock_dispatch.assert_not_called()

        engine.process_telemetry(t_norm)
        mock_resolve.assert_called_once_with(101)
        mock_dispatch.assert_called_once_with(
            alert_id=101,
            transition="ALERT_RESOLVED",
            metric="alignment",
            severity="NORMAL",
            value=0.1,
            unit="mm",
            device_id="DEV1",
        )



    @patch("backend.firebase_notifications.has_notification_been_dispatched", return_value=True)
    @patch("backend.firebase_notifications.messaging.send_each_for_multicast")
    def test_idempotency_prevents_duplicate_dispatch(self, mock_send, mock_has):
        from backend.firebase_notifications import _dispatch_fcm_multicast_sync
        with patch("backend.firebase_notifications.is_firebase_configured", return_value=True):
            _dispatch_fcm_multicast_sync(
                alert_id=42, transition="ALERT_OPENED", metric="alignment",
                severity="WARNING", value=3.5, unit="mm", device_id="DEV1"
            )
            mock_send.assert_not_called()

    @patch("backend.firebase_notifications.is_firebase_configured", return_value=True)
    @patch("backend.firebase_notifications.has_notification_been_dispatched", return_value=False)
    @patch("backend.firebase_notifications.get_active_fcm_tokens", return_value=["token_invalid"])
    @patch("backend.firebase_notifications.deactivate_push_device")
    @patch("backend.firebase_notifications.record_notification_dispatch")
    @patch("backend.firebase_notifications.messaging.send_each_for_multicast")
    def test_invalid_token_deactivates_device(
        self, mock_send, mock_record, mock_deactivate, mock_tokens, mock_has, mock_cfg
    ):
        from backend.firebase_notifications import _dispatch_fcm_multicast_sync
        from firebase_admin import messaging

        mock_resp = MagicMock()
        mock_resp.success = False
        mock_resp.exception = messaging.UnregisteredError("token unregistered")
        
        mock_multicast_resp = MagicMock()
        mock_multicast_resp.success_count = 0
        mock_multicast_resp.failure_count = 1
        mock_multicast_resp.responses = [mock_resp]
        mock_send.return_value = mock_multicast_resp

        _dispatch_fcm_multicast_sync(
            alert_id=42, transition="ALERT_OPENED", metric="alignment",
            severity="WARNING", value=3.5, unit="mm", device_id="DEV1"
        )
        mock_deactivate.assert_called_once_with("token_invalid")

    @patch("backend.firebase_notifications.is_firebase_configured", return_value=True)
    @patch("backend.firebase_notifications.has_notification_been_dispatched", return_value=False)
    @patch("backend.firebase_notifications.get_active_fcm_tokens", return_value=["valid_token"])
    @patch("backend.firebase_notifications.deactivate_push_device")
    @patch("backend.firebase_notifications.record_notification_dispatch")
    @patch("backend.firebase_notifications.messaging.send_each_for_multicast")
    def test_temporary_network_failure_does_not_deactivate_device(
        self, mock_send, mock_record, mock_deactivate, mock_tokens, mock_has, mock_cfg
    ):
        from backend.firebase_notifications import _dispatch_fcm_multicast_sync

        mock_send.side_effect = ConnectionError("FCM network timeout")

        _dispatch_fcm_multicast_sync(
            alert_id=42, transition="ALERT_OPENED", metric="alignment",
            severity="WARNING", value=3.5, unit="mm", device_id="DEV1"
        )
        mock_deactivate.assert_not_called()
        mock_record.assert_called_once()


    @patch("backend.main.CLOUD_DEMO", False)
    def test_demo_scenario_forbidden_in_non_cloud_mode(self):
        res = self.client.post("/api/demo/scenario?scenario=BELT_MISALIGNMENT")
        self.assertEqual(res.status_code, 403)
        self.assertIn("disabled when CLOUD_DEMO is False", res.json()["detail"])

    @patch("backend.main.CLOUD_DEMO", True)
    def test_demo_scenario_invalid_name_400(self):
        res = self.client.post("/api/demo/scenario?scenario=INVALID_HACK")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Allowed choices", res.json()["detail"])

    @patch("backend.main.CLOUD_DEMO", True)
    @patch("backend.main.cloud_demo_generator.set_scenario")
    def test_demo_scenario_success(self, mock_set):
        res = self.client.post("/api/demo/scenario?scenario=BELT_MISALIGNMENT")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["active_scenario"], "BELT_MISALIGNMENT")

if __name__ == "__main__":
    unittest.main()
