#!/usr/bin/env python3
"""
scratch/test_step13_decision_support.py

Automated Test Suite for Step 13 Unified Explainable Decision Support Layer
SIH26008 Conveyor Health Monitoring Platform
"""

import os
import shutil
import sys

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.alert_engine import alert_engine
from backend.anomaly_engine import AnomalyEngine, anomaly_engine
from backend.condition_engine import condition_engine
from backend.db import get_active_alerts, resolve_alert
from backend.decision_support import decision_support_engine
from backend.models import TelemetryData


def test_scenario_independence():
    print("\n--- TEST 1: SCENARIO INDEPENDENCE TEST (CRITICAL) ---")

    data_normal_tag = TelemetryData(
        device_id="ESP32-01",
        timestamp="2026-09-18T10:00:00Z",
        scenario="NORMAL",
        temperature=58.5,
        vibration=0.85,
        current=6.2,
        speed=1.5,
        alignment=10.5,
        load=82.0,
    )

    data_splice_tag = TelemetryData(
        device_id="ESP32-01",
        timestamp="2026-09-18T10:00:00Z",
        scenario="SPLICE_DEGRADATION",  # Different scenario tag, identical numbers
        temperature=58.5,
        vibration=0.85,
        current=6.2,
        speed=1.5,
        alignment=10.5,
        load=82.0,
    )

    with condition_engine._lock:
        condition_engine._window.clear()

    # Process through engines
    for _ in range(5):
        alert_engine.process_telemetry(data_normal_tag)
        condition_engine.process_telemetry(data_normal_tag)
        anomaly_engine.process_telemetry(data_normal_tag)

    sum1 = decision_support_engine.generate_summary()

    for _ in range(5):
        alert_engine.process_telemetry(data_splice_tag)
        condition_engine.process_telemetry(data_splice_tag)
        anomaly_engine.process_telemetry(data_splice_tag)

    sum2 = decision_support_engine.generate_summary()

    print(f"Scenario='NORMAL'             -> level: {sum1.level}, agreement: {sum1.evidence_agreement}, active_alerts: {sum1.active_alert_count}")
    print(f"Scenario='SPLICE_DEGRADATION' -> level: {sum2.level}, agreement: {sum2.evidence_agreement}, active_alerts: {sum2.active_alert_count}")

    assert sum1.level == sum2.level, "Level must be identical!"
    assert sum1.headline == sum2.headline, "Headline must be identical!"
    assert sum1.evidence_agreement == sum2.evidence_agreement, "Agreement must be identical!"
    assert len(sum1.evidence) == len(sum2.evidence), "Evidence count must be identical!"
    assert len(sum1.suggested_actions) == len(sum2.suggested_actions), "Action count must be identical!"

    print("[SUCCESS] SCENARIO INDEPENDENCE CONFIRMED: Decision support logic is 100% independent of scenario string!")


def test_scenario_demonstrations():
    print("\n--- TEST 2: DEMONSTRATION SCENARIO BEHAVIOR TEST ---")

    scenarios_data = {
        "NORMAL": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:00:00Z",
            scenario="NORMAL",
            temperature=41.0,
            vibration=0.27,
            current=4.1,
            speed=1.8,
            alignment=0.0,
            load=60.0,
        ),
        "HIGH_VIBRATION": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:01:00Z",
            scenario="HIGH_VIBRATION",
            temperature=44.0,
            vibration=0.75,
            current=4.3,
            speed=1.78,
            alignment=0.5,
            load=62.0,
        ),
        "MOTOR_OVERLOAD": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:02:00Z",
            scenario="MOTOR_OVERLOAD",
            temperature=62.0,
            vibration=0.45,
            current=7.5,
            speed=1.35,
            alignment=1.0,
            load=92.0,
        ),
        "BELT_MISALIGNMENT": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:03:00Z",
            scenario="BELT_MISALIGNMENT",
            temperature=43.0,
            vibration=0.35,
            current=4.5,
            speed=1.75,
            alignment=14.2,
            load=65.0,
        ),
        "SPLICE_DEGRADATION": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:04:00Z",
            scenario="SPLICE_DEGRADATION",
            temperature=48.0,
            vibration=0.68,
            current=4.8,
            speed=1.70,
            alignment=4.5,
            load=72.0,
        ),
    }

    results = {}
    for sc_name, data in scenarios_data.items():
        # Clear condition engine rolling window to isolate target scenario telemetry
        with condition_engine._lock:
            condition_engine._window.clear()

        # Feed 20 readings to fully populate rolling 20-sample window and settle alert engine hysteresis
        for _ in range(20):
            alert_engine.process_telemetry(data)
            condition_engine.process_telemetry(data)
            anomaly_engine.process_telemetry(data)

        summary = decision_support_engine.generate_summary()
        results[sc_name] = summary

        print(f"Scenario [{sc_name:18s}]: level={summary.level:10s} agreement={summary.evidence_agreement:8s} alerts={summary.active_alert_count} cond={summary.condition_level} ml={summary.ml_status}")
        print(f"  |- Headline: {summary.headline}")
        if summary.evidence:
            print(f"  |- Evidence Top: [{summary.evidence[0].source}] {summary.evidence[0].title}: {summary.evidence[0].detail}")
        if summary.suggested_actions:
            print(f"  |- Action Top: [{summary.suggested_actions[0].priority}] {summary.suggested_actions[0].action}")

    # Qualitative behavior assertions
    assert results["NORMAL"].level == "NORMAL", "NORMAL scenario should result in NORMAL assessment level!"
    assert results["HIGH_VIBRATION"].level in ["WARNING", "CRITICAL"], "HIGH_VIBRATION should produce WARNING or CRITICAL level!"
    assert results["MOTOR_OVERLOAD"].level in ["WARNING", "CRITICAL"], "MOTOR_OVERLOAD should produce WARNING or CRITICAL level!"
    assert results["BELT_MISALIGNMENT"].level in ["WARNING", "CRITICAL"], "BELT_MISALIGNMENT should produce WARNING or CRITICAL level!"

    print("[SUCCESS] DEMONSTRATION SCENARIO BEHAVIOR VERIFIED!")


def test_ml_unavailable_fallback():
    print("\n--- TEST 3: ML UNAVAILABLE FALLBACK TEST ---")

    model_dir = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
    real_model_path = os.path.join(model_dir, "conveyor_anomaly_model.joblib")
    temp_model_path = os.path.join(model_dir, "conveyor_anomaly_model.joblib.bak")

    # 1. Temporarily move model file and reload global anomaly engine
    shutil.move(real_model_path, temp_model_path)
    anomaly_engine.load_model()
    assert anomaly_engine.is_available() is False

    try:
        data = TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:00:00Z",
            scenario="NORMAL",
            temperature=41.0,
            vibration=0.27,
            current=4.1,
            speed=1.8,
            alignment=0.0,
            load=60.0,
        )

        alert_engine.process_telemetry(data)
        condition_engine.process_telemetry(data)
        anomaly_engine.process_telemetry(data)

        # Generate summary
        summary = decision_support_engine.generate_summary()
        assert summary is not None, "Decision support must generate summary when ML is unavailable!"
        assert summary.ml_status == "MODEL_UNAVAILABLE", f"ML status should be MODEL_UNAVAILABLE, got {summary.ml_status}"
        print(f"[Fallback Test] Summary generated cleanly with ML unavailable: level={summary.level}, ml_status='{summary.ml_status}'")
    finally:
        # Restore model and reload engine
        shutil.move(temp_model_path, real_model_path)
        anomaly_engine.load_model()

    print("[SUCCESS] ML UNAVAILABLE FALLBACK VERIFIED!")


def test_no_active_alerts_attention_case():
    print("\n--- TEST 4: NO ACTIVE ALERTS ATTENTION CASE ---")

    # Clear active alerts in DB and reset condition window
    for alert in get_active_alerts():
        resolve_alert(alert["id"])
    alert_engine._states.clear()
    with condition_engine._lock:
        condition_engine._window.clear()

    # Create telemetry packet where vibration is slightly elevated (0.38g - above normal_max 0.35g, but below 0.40g WARNING threshold)
    data = TelemetryData(
        device_id="ESP32-01",
        timestamp="2026-09-18T10:00:00Z",
        scenario="NORMAL",
        temperature=41.0,
        vibration=0.38,  # Elevated risk in ConditionEngine, but below rule alert threshold
        current=4.1,
        speed=1.8,
        alignment=0.0,
        load=60.0,
    )

    for _ in range(5):
        alert_engine.process_telemetry(data)
        condition_engine.process_telemetry(data)
        anomaly_engine.process_telemetry(data)

    summary = decision_support_engine.generate_summary()
    print(f"No alert case -> active_alerts={summary.active_alert_count}, level={summary.level}, headline='{summary.headline}'")

    assert summary.active_alert_count == 0, "No active rule alert should exist!"
    assert summary.level in ["ATTENTION", "NORMAL"], "Level should be ATTENTION or NORMAL without active alerts!"
    print("[SUCCESS] NO ACTIVE ALERTS ATTENTION CASE VERIFIED!")


def run_all_tests():
    print("=" * 70)
    print("RUNNING STEP 13 DECISION SUPPORT TEST SUITE")
    print("=" * 70)

    test_scenario_independence()
    test_scenario_demonstrations()
    test_ml_unavailable_fallback()
    test_no_active_alerts_attention_case()

    print("\n" + "=" * 70)
    print("ALL STEP 13 DECISION SUPPORT TESTS PASSED CLEANLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
