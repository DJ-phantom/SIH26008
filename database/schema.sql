-- SIH26008 Conveyor Belt Telemetry Schema

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

-- Index on timestamp and device_id for fast historical time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry (created_at DESC);

-- Alerts table for rule-based condition and alert engine
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

