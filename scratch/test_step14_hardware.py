import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

from backend.main import health_check, get_latest_telemetry, get_decision_support_summary
from backend.models import DecisionSummary

async def run_tests():
    print("=" * 70)
    print("RUNNING STEP 14 HARDWARE DEMONSTRATION MODULE TEST SUITE")
    print("=" * 70)

    # 1. Test Health Check Endpoint
    print("\n--- TEST 1: HEALTH ENDPOINT & DATA SOURCE DISCLOSURE ---")
    health_data = await health_check()
    print(f"Health Response: {health_data}")
    assert health_data.get("data_source") == "SIMULATOR", f"Data source invalid: {health_data.get('data_source')}"
    assert health_data.get("device_id") == "ESP32-01", f"Device ID invalid: {health_data.get('device_id')}"
    assert health_data.get("telemetry_topic") == "sih26008/conveyor/ESP32-01/telemetry", "MQTT topic mismatch"
    print("[SUCCESS] HEALTH ENDPOINT & DATA SOURCE DISCLOSURE VERIFIED!")

    # 2. Test Decision Support Summary
    print("\n--- TEST 2: DECISION SUPPORT SUMMARY INTEGRITY ---")
    ds: DecisionSummary = await get_decision_support_summary()
    print(f"Decision Support Summary: level={ds.level}, agreement={ds.evidence_agreement}, active_alerts={ds.active_alert_count}")
    assert ds.device_id == "ESP32-01", "Device ID mismatch in decision summary"
    print("[SUCCESS] DECISION SUPPORT SUMMARY INTEGRITY VERIFIED!")

    print("\n" + "=" * 70)
    print("ALL STEP 14 HARDWARE DEMONSTRATION TESTS PASSED CLEANLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_tests())
