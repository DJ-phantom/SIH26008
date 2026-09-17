export interface HealthResponse {
  status: string;
  mqtt_connected: boolean;
  database_connected: boolean;
  data_source?: string;
  data_source_mode?: string;
  device_id?: string;
  telemetry_topic?: string;
}

export interface TelemetryData {
  device_id: string;
  timestamp: string;
  scenario?: string;
  temperature: number;
  vibration: number;
  current: number;
  speed: number;
  alignment: number;
  load: number;
}

export interface TelemetryRecord extends TelemetryData {
  id?: number;
  created_at?: string;
}

export interface TelemetryCountResponse {
  count: number;
}

export interface AlertRecord {
  id: number;
  device_id: string;
  metric: string;
  severity: "WARNING" | "CRITICAL" | "NORMAL";
  title: string;
  message: string;
  value: number;
  unit: string;
  started_at: string;
  last_seen_at: string;
  resolved_at?: string | null;
  is_active: boolean;
}

export interface AlertCountResponse {
  active: number;
  total: number;
}

export interface MetricRisk {
  metric: string;
  risk: number;
  value: number;
  unit: string;
}

export interface OverallCondition {
  risk_index: number;
  level: "NORMAL" | "ATTENTION" | "WARNING" | "CRITICAL";
  contributors: MetricRisk[];
}

export interface SpliceCondition {
  risk_index: number;
  level: "NORMAL" | "WATCH" | "ELEVATED" | "HIGH";
  contributors: MetricRisk[];
  message: string;
}

export interface ConditionSummary {
  device_id: string;
  timestamp: string;
  sample_count: number;
  warming_up: boolean;
  overall: OverallCondition;
  splice: SpliceCondition;
}

export interface DeviationMetric {
  metric: string;
  value: number;
  deviation: number;
}

export interface AnomalyAssessment {
  available: boolean;
  is_anomaly: boolean;
  stable_anomaly: boolean;
  decision_score: number;
  anomaly_index: number;
  status: string;
  recent_anomaly_count: number;
  window_size: number;
  top_deviations: DeviationMetric[];
  model_type: string;
  training_sample_count: number;
}

export interface DecisionEvidence {
  source: "RULE" | "CONDITION" | "ANOMALY";
  severity: "CRITICAL" | "WARNING" | "ATTENTION";
  title: string;
  detail: string;
}

export interface DecisionAction {
  priority: "PRIORITY" | "RECOMMENDED" | "ROUTINE";
  action: string;
}

export interface DecisionSummary {
  device_id: string;
  timestamp: string;
  level: "NORMAL" | "ATTENTION" | "WARNING" | "CRITICAL";
  headline: string;
  evidence_agreement: "LOW" | "MODERATE" | "HIGH";
  active_alert_count: number;
  condition_level: string;
  splice_level: string;
  ml_status: string;
  evidence: DecisionEvidence[];
  suggested_actions: DecisionAction[];
}

export interface FetchResult<T> {
  data: T | null;
  error: string | null;
  isUnavailable?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Fetches backend health status including MQTT and PostgreSQL connection states.
 */
export async function fetchHealth(): Promise<FetchResult<HealthResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: HealthResponse = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to reach backend" };
  }
}

/**
 * Fetches latest validated telemetry from the FastAPI in-memory cache.
 */
export async function fetchLatestTelemetry(): Promise<FetchResult<TelemetryData>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/latest`, {
      cache: "no-store",
    });

    if (res.status === 503) {
      return {
        data: null,
        error: "Waiting for telemetry stream from conveyor sensors...",
        isUnavailable: true,
      };
    }

    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data: TelemetryData = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Backend offline" };
  }
}

/**
 * Fetches historical telemetry records from PostgreSQL ordered newest first.
 */
export async function fetchTelemetryHistory(
  limit: number = 120
): Promise<FetchResult<TelemetryRecord[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/history?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: TelemetryRecord[] = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Historical telemetry unavailable" };
  }
}

/**
 * Fetches total count of stored telemetry records from PostgreSQL.
 */
export async function fetchTelemetryCount(): Promise<FetchResult<TelemetryCountResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/count`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: TelemetryCountResponse = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to reach backend" };
  }
}

/**
 * Fetches currently active condition alerts from FastAPI rule engine.
 */
export async function fetchActiveAlerts(
  deviceId?: string
): Promise<FetchResult<AlertRecord[]>> {
  try {
    const url = deviceId
      ? `${API_BASE_URL}/api/alerts/active?device_id=${encodeURIComponent(deviceId)}`
      : `${API_BASE_URL}/api/alerts/active`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: AlertRecord[] = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Active alerts unavailable" };
  }
}

/**
 * Fetches recent alert events (active and resolved) ordered newest first.
 */
export async function fetchAlertHistory(
  limit: number = 50
): Promise<FetchResult<AlertRecord[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts/history?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: AlertRecord[] = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Alert history unavailable" };
  }
}

/**
 * Fetches active and total alert counts from PostgreSQL.
 */
export async function fetchAlertCount(): Promise<FetchResult<AlertCountResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts/count`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data: AlertCountResponse = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Alert count unavailable" };
  }
}

/**
 * Fetches multi-sensor condition assessment summary from FastAPI Condition Engine.
 */
export async function fetchConditionSummary(): Promise<FetchResult<ConditionSummary>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/condition/summary`, {
      cache: "no-store",
    });

    if (res.status === 503) {
      return {
        data: null,
        error: "Condition engine warming up / awaiting telemetry...",
        isUnavailable: true,
      };
    }

    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data: ConditionSummary = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Condition summary unavailable" };
  }
}

/**
 * Fetches Step 12 Unsupervised Multivariate Anomaly Detection status from FastAPI backend.
 */
export async function fetchAnomalyStatus(): Promise<FetchResult<AnomalyAssessment>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/anomaly/status`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data: AnomalyAssessment = await res.json();
    return { data, error: null, isUnavailable: !data.available };
  } catch (err: any) {
    return { data: null, error: err.message || "AI Anomaly detection status unavailable" };
  }
}

/**
 * Fetches Step 13 Unified Explainable Decision Support summary from FastAPI backend.
 */
export async function fetchDecisionSupportSummary(): Promise<FetchResult<DecisionSummary>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/decision-support/summary`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data: DecisionSummary = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Decision support summary unavailable" };
  }
}
