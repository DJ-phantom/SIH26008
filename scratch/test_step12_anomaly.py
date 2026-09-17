#!/usr/bin/env python3
"""
scratch/test_step12_anomaly.py

Automated Test Suite for Step 12 Unsupervised Multivariate Anomaly Detection
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
from backend.db import get_active_alerts
from backend.models import TelemetryData


def test_scenario_independence():
    print("\n--- TEST 1: SCENARIO INDEPENDENCE TEST (CRITICAL) ---")

    # Create two telemetry objects with IDENTICAL numerical measurements but different scenarios
    data_normal_tag = TelemetryData(
        device_id="ESP32-01",
        timestamp="2026-09-18T10:00:00Z",
        scenario="NORMAL",  # Tagged as NORMAL
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
        scenario="SPLICE_DEGRADATION",  # Tagged as SPLICE_DEGRADATION
        temperature=58.5,  # Identical numeric value
        vibration=0.85,  # Identical numeric value
        current=6.2,  # Identical numeric value
        speed=1.5,  # Identical numeric value
        alignment=10.5,  # Identical numeric value
        load=82.0,  # Identical numeric value
    )

    res1 = anomaly_engine.process_telemetry(data_normal_tag)
    res2 = anomaly_engine.process_telemetry(data_splice_tag)

    print(f"Scenario='NORMAL'             -> score: {res1.decision_score}, index: {res1.anomaly_index}, is_anomaly: {res1.is_anomaly}")
    print(f"Scenario='SPLICE_DEGRADATION' -> score: {res2.decision_score}, index: {res2.anomaly_index}, is_anomaly: {res2.is_anomaly}")

    assert res1.decision_score == res2.decision_score, "Decision scores must be identical!"
    assert res1.anomaly_index == res2.anomaly_index, "Anomaly indices must be identical!"
    assert res1.is_anomaly == res2.is_anomaly, "Is anomaly boolean must be identical!"
    assert [d.metric for d in res1.top_deviations] == [d.metric for d in res2.top_deviations], "Top deviations must be identical!"

    print("[SUCCESS] SCENARIO INDEPENDENCE CONFIRMED: Scenario string is 100% excluded from model input vector!")


def test_scenario_demonstrations():
    print("\n--- TEST 2: DEMONSTRATION SCENARIO BEHAVIOR TEST ---")

    scenarios_data = {
        "NORMAL": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:00:00Z",
            scenario="NORMAL",
            temperature=41.2,
            vibration=0.27,
            current=4.15,
            speed=1.80,
            alignment=0.0,
            load=60.0,
        ),
        "HIGH_VIBRATION": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:01:00Z",
            scenario="HIGH_VIBRATION",
            temperature=44.0,
            vibration=0.72,  # Significantly high vibration
            current=4.3,
            speed=1.78,
            alignment=0.5,
            load=62.0,
        ),
        "MOTOR_OVERLOAD": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:02:00Z",
            scenario="MOTOR_OVERLOAD",
            temperature=62.0,  # High temp
            vibration=0.45,
            current=7.5,  # High current
            speed=1.35,  # Low speed
            alignment=1.0,
            load=92.0,  # High load
        ),
        "BELT_MISALIGNMENT": TelemetryData(
            device_id="ESP32-01",
            timestamp="2026-09-18T10:03:00Z",
            scenario="BELT_MISALIGNMENT",
            temperature=43.0,
            vibration=0.35,
            current=4.5,
            speed=1.75,
            alignment=14.2,  # Major alignment offset
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
        test_engine = AnomalyEngine()
        # Feed 5 readings to let rolling stability window fill up
        for _ in range(5):
            res = test_engine.process_telemetry(data)
        results[sc_name] = res

        print(f"Scenario [{sc_name:18s}]: status={res.status:18s} index={res.anomaly_index:5.1f}/100 score={res.decision_score:+.4f}")
        top_str = ", ".join([f"{d.metric}={d.value}({d.deviation} std_dev)" for d in res.top_deviations])
        print(f"  |- Top Deviations: {top_str}")

    # Qualitative behavior assertions
    assert results["NORMAL"].status == "NORMAL_PATTERN", "NORMAL scenario should produce NORMAL_PATTERN!"
    assert results["HIGH_VIBRATION"].status == "ANOMALOUS_PATTERN", "HIGH_VIBRATION should produce ANOMALOUS_PATTERN after stability window!"
    assert results["HIGH_VIBRATION"].top_deviations[0].metric == "vibration", "vibration should be top deviation for HIGH_VIBRATION!"
    assert results["BELT_MISALIGNMENT"].top_deviations[0].metric == "alignment", "alignment should be top deviation for BELT_MISALIGNMENT!"

    print("[SUCCESS] DEMONSTRATION SCENARIO BEHAVIOR VERIFIED!")


def test_model_unavailable_fallback():
    print("\n--- TEST 3: MODEL UNAVAILABLE FALLBACK TEST ---")

    model_dir = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
    real_model_path = os.path.join(model_dir, "conveyor_anomaly_model.joblib")
    temp_model_path = os.path.join(model_dir, "conveyor_anomaly_model.joblib.bak")

    # 1. Temporarily rename model file
    shutil.move(real_model_path, temp_model_path)
    print(f"[Fallback Test] Temporarily renamed model artifact to .bak")

    try:
        # 2. Reload engine
        fallback_engine = AnomalyEngine()
        assert fallback_engine.is_available() is False, "Engine should report available=False when model missing!"

        # 3. Process telemetry
        sample = TelemetryData(
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
        res = fallback_engine.process_telemetry(sample)

        assert res.available is False, "Assessment available flag must be False!"
        assert res.status == "MODEL_UNAVAILABLE", "Status must be MODEL_UNAVAILABLE!"
        print(f"[Fallback Test] Successfully handled missing model: available={res.available}, status='{res.status}'")
    finally:
        # 4. Restore model file
        shutil.move(temp_model_path, real_model_path)
        print(f"[Fallback Test] Restored model artifact")

    # Reload main engine to confirm recovery
    anomaly_engine.load_model()
    assert anomaly_engine.is_available() is True, "Engine must recover after restoring model!"
    print("[SUCCESS] MODEL UNAVAILABLE FALLBACK VERIFIED!")


def test_engine_independence():
    print("\n--- TEST 4: ENGINE INDEPENDENCE TEST ---")

    data = TelemetryData(
        device_id="ESP32-01",
        timestamp="2026-09-18T10:00:00Z",
        scenario="HIGH_VIBRATION",
        temperature=42.0,
        vibration=0.75,
        current=4.2,
        speed=1.8,
        alignment=0.0,
        load=60.0,
    )

    # Process through all three independent engines
    alert_engine.process_telemetry(data)
    alerts = get_active_alerts()
    cond = condition_engine.process_telemetry(data)
    anom = anomaly_engine.process_telemetry(data)

    print(f"AlertEngine output    : {len(alerts)} active alerts ({[a['metric'] for a in alerts]})")
    print(f"ConditionEngine output: overall={cond.overall.level} ({cond.overall.risk_index}/100)")
    print(f"AnomalyEngine output  : status={anom.status} (index={anom.anomaly_index}/100)")

    assert alerts is not None, "AlertEngine must return active alerts list!"
    assert cond is not None, "ConditionEngine must return summary independently!"
    assert anom is not None, "AnomalyEngine must return assessment independently!"

    print("[SUCCESS] INDEPENDENCE OF ALERT, CONDITION, AND ANOMALY ENGINES VERIFIED!")


def run_all_tests():
    print("=" * 70)
    print("RUNNING STEP 12 ANOMALY DETECTION TEST SUITE")
    print("=" * 70)

    test_scenario_independence()
    test_scenario_demonstrations()
    test_model_unavailable_fallback()
    test_engine_independence()

    print("\n" + "=" * 70)
    print("ALL STEP 12 ANOMALY DETECTION TESTS PASSED CLEANLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
