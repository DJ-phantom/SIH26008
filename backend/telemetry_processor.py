import logging
import threading
from typing import Optional

from backend.alert_engine import alert_engine
from backend.anomaly_engine import anomaly_engine
from backend.condition_engine import condition_engine
from backend.db import insert_telemetry
from backend.models import TelemetryData

logger = logging.getLogger("backend.processor")

_latest_telemetry: Optional[TelemetryData] = None
_telemetry_lock = threading.Lock()


def process_telemetry(telemetry: TelemetryData) -> Optional[int]:
    """Shared, reusable backend telemetry processing pipeline.
    
    Responsibilities:
    1. Update latest in-memory telemetry cache
    2. Persist telemetry reading to PostgreSQL
    3. Evaluate Rule-Based Alert Engine
    4. Evaluate Multi-Sensor Condition Engine
    5. Evaluate Isolation Forest Anomaly Engine
    
    Used identically by both BackendMQTTSubscriber (Local Mode) and CloudDemoGenerator (Cloud Mode).
    """
    global _latest_telemetry

    # 1. Update in-memory cache
    with _telemetry_lock:
        _latest_telemetry = telemetry

    # 2. Persist to PostgreSQL (non-fatal on failure)
    row_id = None
    try:
        row_id = insert_telemetry(telemetry)
        db_status = f"DB ID: {row_id}" if row_id else "DB: pending/skipped"
    except Exception as db_err:
        db_status = f"DB error: {db_err}"
        print(f"[TelemetryProcessor] DB insertion error: {db_err}")

    # 3. Rule-Based Alert Engine Evaluation (non-fatal on failure)
    try:
        alert_engine.process_telemetry(telemetry)
    except Exception as alert_err:
        print(f"[TelemetryProcessor] Alert engine evaluation error: {alert_err}")

    # 4. Multi-Sensor Condition Engine Evaluation (non-fatal on failure)
    try:
        condition_engine.process_telemetry(telemetry)
    except Exception as cond_err:
        print(f"[TelemetryProcessor] Condition engine processing error: {cond_err}")

    # 5. Step 12 Isolation Forest Anomaly Engine Evaluation (non-fatal on failure)
    try:
        anomaly_engine.process_telemetry(telemetry)
    except Exception as anomaly_err:
        print(f"[TelemetryProcessor] Anomaly engine processing error: {anomaly_err}")

    print(
        f"[Telemetry] {telemetry.device_id} | Scenario: {telemetry.scenario or 'NORMAL'} | "
        f"Temp: {telemetry.temperature:.1f}°C | Vib: {telemetry.vibration:.2f}g | "
        f"Speed: {telemetry.speed:.2f}m/s | {db_status}"
    )

    return row_id


def get_latest_telemetry() -> Optional[TelemetryData]:
    """Returns the most recent validated telemetry reading from the shared cache."""
    with _telemetry_lock:
        return _latest_telemetry


def set_latest_telemetry(telemetry: Optional[TelemetryData]):
    """Sets the in-memory latest telemetry cache."""
    global _latest_telemetry
    with _telemetry_lock:
        _latest_telemetry = telemetry
