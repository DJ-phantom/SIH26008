import json
import os
import sys
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def get_json(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "SIH26008-SmokeTest/1.0"})
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 60)
    print("SRIJAN SIH26008 SYSTEM SMOKE CHECK")
    print("=" * 60)

    results = {}

    # 1. Root Endpoint Test
    try:
        status, data = get_json("/")
        results["FastAPI Backend Application"] = (status == 200 and data.get("status") == "running")
    except Exception as e:
        results["FastAPI Backend Application"] = False
        print(f"[FAIL] FastAPI Root endpoint unreachable: {e}")

    # 2. Health Endpoint Test (MQTT & Database Connectivity)
    try:
        status, health = get_json("/health")
        results["Mosquitto MQTT Broker"] = health.get("mqtt_connected", False)
        results["PostgreSQL Database Storage"] = health.get("database_connected", False)
    except Exception as e:
        results["Mosquitto MQTT Broker"] = False
        results["PostgreSQL Database Storage"] = False
        print(f"[FAIL] Health endpoint check failed: {e}")

    # 3. Telemetry Stream Test
    try:
        status, telem = get_json("/api/telemetry/latest")
        results["Live Telemetry Stream Ingestion"] = (status == 200 and "device_id" in telem)
    except urllib.error.HTTPError as e:
        if e.code == 503:
            results["Live Telemetry Stream Ingestion"] = False
            print("[NOTICE] Telemetry stream awaiting active publisher (HTTP 503).")
        else:
            results["Live Telemetry Stream Ingestion"] = False
    except Exception as e:
        results["Live Telemetry Stream Ingestion"] = False

    # 4. Telemetry History & Count Endpoints
    try:
        status, hist = get_json("/api/telemetry/history?limit=5")
        status_cnt, cnt = get_json("/api/telemetry/count")
        history_ok = (status == 200 and isinstance(hist, list))
    except Exception:
        history_ok = False

    # 5. Alert Engine & Active Alerts Test
    try:
        status, active_alerts = get_json("/api/alerts/active")
        status_hist, alert_hist = get_json("/api/alerts/history?limit=10")
        results["Alert Engine & Persistence"] = (status == 200 and isinstance(active_alerts, list))
    except Exception as e:
        results["Alert Engine & Persistence"] = False

    # 6. Condition Engine Test
    try:
        status, cond = get_json("/api/condition/summary")
        results["Condition Assessment Engine"] = (status == 200 and "overall" in cond and "splice" in cond)
    except urllib.error.HTTPError as e:
        results["Condition Assessment Engine"] = False
    except Exception as e:
        results["Condition Assessment Engine"] = False

    # 7. Anomaly Detection Engine Test
    try:
        status, anomaly = get_json("/api/anomaly/status")
        results["Isolation Forest Anomaly Model"] = (status == 200 and anomaly.get("available") is True)
    except Exception as e:
        results["Isolation Forest Anomaly Model"] = False

    # 8. Decision Support Engine Test
    try:
        status, ds = get_json("/api/decision-support/summary")
        results["Unified Decision Support Engine"] = (status == 200 and "level" in ds and "evidence" in ds)
    except Exception as e:
        results["Unified Decision Support Engine"] = False

    # Print Summary Results Table
    print("\n" + "-" * 60)
    print("SUBSYSTEM VERIFICATION SUMMARY")
    print("-" * 60)

    all_passed = True
    for component, passed in results.items():
        status_str = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_str:<8} {component}")

    print("-" * 60)
    if all_passed:
        print("\nSYSTEM READY FOR DEMO\n")
        sys.exit(0)
    else:
        print("\n[WARNING] SYSTEM CHECK DEGRADED — Please verify failed services above.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
