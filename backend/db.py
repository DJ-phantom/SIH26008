import logging
import os
from typing import Any, Dict, List, Optional

import psycopg
from dotenv import load_dotenv

from backend.models import TelemetryData

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger("backend.db")

DATABASE_URL = os.getenv("DATABASE_URL")
PGHOST = os.getenv("PGHOST", "127.0.0.1")
PGPORT = int(os.getenv("PGPORT", "5433"))
PGDATABASE = os.getenv("PGDATABASE", "sih26008")
PGUSER = os.getenv("PGUSER", "postgres")
PGPASSWORD = os.getenv("PGPASSWORD", "postgres")


def get_connection_params() -> dict:
    """Returns database connection parameters dictionary."""
    return {
        "host": PGHOST,
        "port": PGPORT,
        "dbname": PGDATABASE,
        "user": PGUSER,
        "password": PGPASSWORD,
        "connect_timeout": 3,
    }


def connect_db(autocommit: bool = False):
    """Returns a psycopg connection using DATABASE_URL if provided, otherwise using explicit connection parameters."""
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.strip():
        return psycopg.connect(db_url.strip(), connect_timeout=3, autocommit=autocommit)
    return psycopg.connect(**get_connection_params(), autocommit=autocommit)


def init_db():
    """Initializes the database schema by ensuring telemetry and alerts tables exist and are migrated."""
    create_table_query = """
    CREATE TABLE IF NOT EXISTS telemetry (
        id BIGSERIAL PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        scenario VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
        temperature DOUBLE PRECISION NOT NULL,
        vibration DOUBLE PRECISION NOT NULL,
        current DOUBLE PRECISION NOT NULL,
        speed DOUBLE PRECISION NOT NULL,
        alignment DOUBLE PRECISION NOT NULL,
        load DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS scenario VARCHAR(32) NOT NULL DEFAULT 'NORMAL';

    CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry (device_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry (created_at DESC);

    CREATE TABLE IF NOT EXISTS alerts (
        id BIGSERIAL PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        metric VARCHAR(32) NOT NULL,
        severity VARCHAR(16) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        unit VARCHAR(16) NOT NULL,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ NULL,
        is_active BOOLEAN DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_active_device_metric ON alerts (is_active, device_id, metric);
    CREATE INDEX IF NOT EXISTS idx_alerts_started_at ON alerts (started_at DESC);

    CREATE TABLE IF NOT EXISTS push_devices (
        id BIGSERIAL PRIMARY KEY,
        fcm_token TEXT UNIQUE NOT NULL,
        platform VARCHAR(32) NOT NULL DEFAULT 'android',
        device_label VARCHAR(128) NOT NULL DEFAULT 'SRIJAN Android Device',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_registered_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_push_devices_active ON push_devices (is_active);

    CREATE TABLE IF NOT EXISTS notification_dispatches (
        id BIGSERIAL PRIMARY KEY,
        alert_id BIGINT NOT NULL,
        transition VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        recipient_count INT NOT NULL DEFAULT 0,
        success_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        metadata JSONB,
        CONSTRAINT unique_alert_transition UNIQUE (alert_id, transition)
    );
    CREATE INDEX IF NOT EXISTS idx_dispatches_alert_transition ON notification_dispatches (alert_id, transition);
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
        db_target = "DATABASE_URL" if os.getenv("DATABASE_URL") else f"{PGHOST}:{PGPORT}/{PGDATABASE}"
        print(f"[Backend DB] Database [{db_target}] schema verified (telemetry & alerts).")
    except Exception as e:
        print(f"[Backend DB] Warning: Failed to initialize database: {e}")
        raise e


def check_db_connection() -> bool:
    """Checks whether the PostgreSQL database is reachable."""
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                return True
    except Exception:
        return False


def insert_telemetry(data: TelemetryData) -> Optional[int]:
    """Inserts a validated telemetry record into the PostgreSQL telemetry table.
    
    Uses parameterized queries to prevent SQL injection.
    """
    insert_query = """
    INSERT INTO telemetry (
        device_id, timestamp, scenario, temperature, vibration, current, speed, alignment, load
    ) VALUES (
        %(device_id)s, %(timestamp)s, %(scenario)s, %(temperature)s, %(vibration)s, %(current)s, %(speed)s, %(alignment)s, %(load)s
    ) RETURNING id;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    insert_query,
                    {
                        "device_id": data.device_id,
                        "timestamp": data.timestamp,
                        "scenario": data.scenario or "NORMAL",
                        "temperature": data.temperature,
                        "vibration": data.vibration,
                        "current": data.current,
                        "speed": data.speed,
                        "alignment": data.alignment,
                        "load": data.load,
                    },
                )
                row = cur.fetchone()
                return row[0] if row else None
    except Exception as e:
        print(f"[Backend DB] Error inserting telemetry record: {e}")
        return None


def get_telemetry_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves the latest N telemetry records ordered newest first."""
    select_query = """
    SELECT
        id,
        device_id,
        to_char(timestamp, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS timestamp,
        scenario,
        temperature,
        vibration,
        current,
        speed,
        alignment,
        load,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
    FROM telemetry
    ORDER BY timestamp DESC, id DESC
    LIMIT %(limit)s;
    """
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(select_query, {"limit": limit})
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"[Backend DB] Error fetching telemetry history: {e}")
        return []


def get_telemetry_count() -> int:
    """Returns the total number of telemetry records stored in PostgreSQL."""
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM telemetry;")
                row = cur.fetchone()
                return row[0] if row else 0
    except Exception as e:
        print(f"[Backend DB] Error fetching telemetry count: {e}")
        return 0


# --- Alert Engine Database Persistence Functions ---

def create_alert(
    device_id: str,
    metric: str,
    severity: str,
    title: str,
    message: str,
    value: float,
    unit: str,
) -> Optional[int]:
    """Inserts a new active alert into PostgreSQL and returns its generated ID."""
    insert_query = """
    INSERT INTO alerts (
        device_id, metric, severity, title, message, value, unit, started_at, last_seen_at, is_active
    ) VALUES (
        %(device_id)s, %(metric)s, %(severity)s, %(title)s, %(message)s, %(value)s, %(unit)s, NOW(), NOW(), TRUE
    ) RETURNING id;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    insert_query,
                    {
                        "device_id": device_id,
                        "metric": metric,
                        "severity": severity,
                        "title": title,
                        "message": message,
                        "value": value,
                        "unit": unit,
                    },
                )
                row = cur.fetchone()
                return row[0] if row else None
    except Exception as e:
        print(f"[Backend DB] Error creating alert record: {e}")
        return None


def update_alert(
    alert_id: int,
    severity: str,
    message: str,
    value: float,
) -> bool:
    """Updates an existing active alert record's severity, message, value, and last_seen_at timestamp."""
    update_query = """
    UPDATE alerts
    SET severity = %(severity)s,
        message = %(message)s,
        value = %(value)s,
        last_seen_at = NOW()
    WHERE id = %(alert_id)s AND is_active = TRUE;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    update_query,
                    {
                        "alert_id": alert_id,
                        "severity": severity,
                        "message": message,
                        "value": value,
                    },
                )
                return cur.rowcount > 0
    except Exception as e:
        print(f"[Backend DB] Error updating alert record #{alert_id}: {e}")
        return False


def resolve_alert(alert_id: int) -> bool:
    """Marks an active alert as resolved setting is_active=FALSE and resolved_at=NOW()."""
    resolve_query = """
    UPDATE alerts
    SET is_active = FALSE,
        resolved_at = NOW(),
        last_seen_at = NOW()
    WHERE id = %(alert_id)s AND is_active = TRUE;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(resolve_query, {"alert_id": alert_id})
                return cur.rowcount > 0
    except Exception as e:
        print(f"[Backend DB] Error resolving alert record #{alert_id}: {e}")
        return False


def get_active_alerts(device_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all currently active alerts ordered by started_at DESC."""
    query = """
    SELECT
        id,
        device_id,
        metric,
        severity,
        title,
        message,
        value,
        unit,
        to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS started_at,
        to_char(last_seen_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_seen_at,
        to_char(resolved_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS resolved_at,
        is_active
    FROM alerts
    WHERE is_active = TRUE
    """
    params: Dict[str, Any] = {}
    if device_id and isinstance(device_id, str):
        query += " AND device_id = %(device_id)s"
        params["device_id"] = device_id
    query += " ORDER BY started_at DESC;"

    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"[Backend DB] Error fetching active alerts: {e}")
        return []


def get_alert_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent alerts (active and resolved) ordered newest first."""
    query = """
    SELECT
        id,
        device_id,
        metric,
        severity,
        title,
        message,
        value,
        unit,
        to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS started_at,
        to_char(last_seen_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_seen_at,
        to_char(resolved_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS resolved_at,
        is_active
    FROM alerts
    ORDER BY started_at DESC, id DESC
    LIMIT %(limit)s;
    """
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"limit": limit})
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"[Backend DB] Error fetching alert history: {e}")
        return []


def get_alert_count() -> Dict[str, int]:
    """Returns total active alerts count and overall total alerts count."""
    query = """
    SELECT
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
        COUNT(*) AS total
    FROM alerts;
    """
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                row = cur.fetchone()
                if row:
                    return {"active": int(row[0]), "total": int(row[1])}
                return {"active": 0, "total": 0}
    except Exception as e:
        print(f"[Backend DB] Error fetching alert counts: {e}")
        return {"active": 0, "total": 0}




# --- Notification & Alert Detail Helper Functions ---

def get_alert_by_id(alert_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single alert event by ID."""
    query = """
    SELECT
        id,
        device_id,
        metric,
        severity,
        title,
        message,
        value,
        unit,
        to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS started_at,
        to_char(last_seen_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_seen_at,
        to_char(resolved_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS resolved_at,
        is_active
    FROM alerts
    WHERE id = %(alert_id)s;
    """
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"alert_id": alert_id})
                row = cur.fetchone()
                if not row:
                    return None
                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))
    except Exception as e:
        print(f"[Backend DB] Error fetching alert #{alert_id}: {e}")
        return None


def register_push_device(token: str, platform: str = "android", device_label: str = "SRIJAN Android Device") -> bool:
    """Upserts an FCM push device registration setting is_active=TRUE."""
    query = """
    INSERT INTO push_devices (fcm_token, platform, device_label, is_active, created_at, updated_at, last_registered_at)
    VALUES (%(token)s, %(platform)s, %(device_label)s, TRUE, NOW(), NOW(), NOW())
    ON CONFLICT (fcm_token) DO UPDATE
    SET is_active = TRUE,
        platform = EXCLUDED.platform,
        device_label = EXCLUDED.device_label,
        last_registered_at = NOW(),
        updated_at = NOW();
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"token": token, "platform": platform, "device_label": device_label})
                return True
    except Exception as e:
        print(f"[Backend DB] Error registering push device: {e}")
        return False


def unregister_push_device(token: str) -> bool:
    """Marks an FCM push device as inactive."""
    query = """
    UPDATE push_devices
    SET is_active = FALSE, updated_at = NOW()
    WHERE fcm_token = %(token)s;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"token": token})
                return cur.rowcount > 0
    except Exception as e:
        print(f"[Backend DB] Error unregistering push device: {e}")
        return False


def deactivate_push_device(token: str) -> bool:
    """Deactivates invalid/expired FCM token."""
    return unregister_push_device(token)


def get_active_fcm_tokens() -> List[str]:
    """Retrieves all active registered FCM tokens for demo broadcast mode."""
    query = "SELECT fcm_token FROM push_devices WHERE is_active = TRUE ORDER BY id ASC;"
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                rows = cur.fetchall()
                return [r[0] for r in rows if r[0]]
    except Exception as e:
        print(f"[Backend DB] Error fetching active FCM tokens: {e}")
        return []


def get_active_device_count() -> int:
    """Returns total count of active registered FCM devices."""
    query = "SELECT COUNT(*) FROM push_devices WHERE is_active = TRUE;"
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                row = cur.fetchone()
                return row[0] if row else 0
    except Exception as e:
        print(f"[Backend DB] Error fetching active device count: {e}")
        return 0


def has_notification_been_dispatched(alert_id: int, transition: str) -> bool:
    """Checks if a push notification transition has already been dispatched for this alert."""
    query = "SELECT 1 FROM notification_dispatches WHERE alert_id = %(alert_id)s AND transition = %(transition)s;"
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"alert_id": alert_id, "transition": transition})
                return cur.fetchone() is not None
    except Exception as e:
        print(f"[Backend DB] Error checking dispatch status for alert #{alert_id} {transition}: {e}")
        return False


import json

def record_notification_dispatch(
    alert_id: int,
    transition: str,
    recipient_count: int,
    success_count: int,
    failure_count: int,
    metadata: Optional[dict] = None,
) -> bool:
    """Records a push notification dispatch event in PostgreSQL for idempotency tracking."""
    query = """
    INSERT INTO notification_dispatches (
        alert_id, transition, created_at, recipient_count, success_count, failure_count, metadata
    ) VALUES (
        %(alert_id)s, %(transition)s, NOW(), %(recipient_count)s, %(success_count)s, %(failure_count)s, %(metadata)s
    ) ON CONFLICT (alert_id, transition) DO NOTHING;
    """
    try:
        with connect_db(autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    {
                        "alert_id": alert_id,
                        "transition": transition,
                        "recipient_count": recipient_count,
                        "success_count": success_count,
                        "failure_count": failure_count,
                        "metadata": json.dumps(metadata) if metadata else None,
                    },
                )
                return True
    except Exception as e:
        print(f"[Backend DB] Error recording notification dispatch for alert #{alert_id} {transition}: {e}")
        return False
