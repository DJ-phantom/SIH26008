import asyncio
import os
import sys
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath("."))

from backend.main import (
    health_check,
    get_condition_summary,
    get_anomaly_status,
    get_decision_support_summary,
    get_active_alert_list,
    get_history,
    get_count,
)

async def test_all_endpoints():
    print("=" * 70)
    print("RUNNING STEP 17 RELIABILITY & ENDPOINT INTEGRITY SUITE")
    print("=" * 70)

    # 1. Health Endpoint
    health = await health_check()
    print(f"Health Endpoint: status={health['status']}, data_source={health['data_source']}")
    assert health["data_source"] == "SIMULATOR"

    # 2. Condition Summary (Handles 503 if awaiting stream)
    try:
        cond = await get_condition_summary()
        print(f"Condition Summary: overall_level={cond.overall.level}, splice_level={cond.splice.level}")
        assert cond.overall.level in ["NORMAL", "ATTENTION", "WARNING", "CRITICAL"]
    except HTTPException as e:
        print(f"Condition Summary: {e.detail} (HTTP {e.status_code})")

    # 3. Anomaly Status
    anomaly = await get_anomaly_status()
    print(f"Anomaly Status: status={anomaly.status}, index={anomaly.anomaly_index}")
    assert anomaly.available is True

    # 4. Decision Support Summary
    ds = await get_decision_support_summary()
    print(f"Decision Support: level={ds.level}, agreement={ds.evidence_agreement}")
    assert ds.level in ["NORMAL", "ATTENTION", "WARNING", "CRITICAL"]

    # 5. Alert Engine
    alerts = await get_active_alert_list()
    print(f"Active Alerts Count: {len(alerts)}")
    assert isinstance(alerts, list)

    # 6. Database Telemetry History & Count
    history = await get_history(limit=5)
    total_count = await get_count()
    print(f"Telemetry History: returned {len(history)} records, Total DB Count={total_count['count']}")
    assert isinstance(history, list)
    assert total_count["count"] >= 0

    print("\n" + "=" * 70)
    print("ALL STEP 17 RELIABILITY & ENDPOINT INTEGRITY TESTS PASSED CLEANLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
