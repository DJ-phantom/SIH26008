from typing import Optional
from pydantic import BaseModel


class TelemetryData(BaseModel):
    """Pydantic model representing conveyor sensor telemetry readings."""

    device_id: str
    timestamp: str
    scenario: str = "NORMAL"
    temperature: float
    vibration: float
    current: float
    speed: float
    alignment: float
    load: float


class TelemetryRecord(TelemetryData):
    """Pydantic model representing a stored telemetry record with database ID and metadata."""

    id: Optional[int] = None
    created_at: Optional[str] = None


class AlertRecord(BaseModel):
    """Pydantic model representing a rule-engine condition alert record."""

    id: int
    device_id: str
    metric: str
    severity: str
    title: str
    message: str
    value: float
    unit: str
    started_at: str
    last_seen_at: str
    resolved_at: Optional[str] = None
    is_active: bool = True


class AlertCount(BaseModel):
    """Pydantic model representing active and total alert counts."""

    active: int
    total: int


class MetricRisk(BaseModel):
    """Pydantic model representing a single metric's risk contribution."""

    metric: str
    risk: float
    value: float
    unit: str


class OverallCondition(BaseModel):
    """Pydantic model representing overall conveyor belt condition assessment."""

    risk_index: float
    level: str
    contributors: list[MetricRisk]


class SpliceCondition(BaseModel):
    """Pydantic model representing prototype splice condition assessment."""

    risk_index: float
    level: str
    contributors: list[MetricRisk]
    message: str


class ConditionSummary(BaseModel):
    """Pydantic model representing full multi-sensor condition assessment output."""

    device_id: str
    timestamp: str
    sample_count: int
    warming_up: bool
    overall: OverallCondition
    splice: SpliceCondition


class DeviationMetric(BaseModel):
    """Pydantic model representing a sensor measurement's baseline deviation."""

    metric: str
    value: float
    deviation: float


class AnomalyAssessment(BaseModel):
    """Pydantic model representing Step 12 unsupervised multivariate anomaly detection output."""

    available: bool = True
    is_anomaly: bool = False
    stable_anomaly: bool = False
    decision_score: float = 0.0
    anomaly_index: float = 0.0
    status: str = "NORMAL_PATTERN"
    recent_anomaly_count: int = 0
    window_size: int = 5
    top_deviations: list[DeviationMetric] = []
    model_type: str = "IsolationForest"
    training_sample_count: int = 0


class DecisionEvidence(BaseModel):
    """Pydantic model representing a single evidence item for decision support."""

    source: str  # "RULE", "CONDITION", "ANOMALY"
    severity: str  # "CRITICAL", "WARNING", "ATTENTION"
    title: str
    detail: str


class DecisionAction(BaseModel):
    """Pydantic model representing a suggested operator inspection action."""

    priority: str  # "PRIORITY", "RECOMMENDED", "ROUTINE"
    action: str


class DecisionSummary(BaseModel):
    """Pydantic model representing Step 13 Unified Explainable Decision Support output."""

    device_id: str
    timestamp: str
    level: str  # "NORMAL", "ATTENTION", "WARNING", "CRITICAL"
    headline: str
    evidence_agreement: str  # "LOW", "MODERATE", "HIGH"
    active_alert_count: int
    condition_level: str
    splice_level: str
    ml_status: str
    evidence: list[DecisionEvidence] = []
    suggested_actions: list[DecisionAction] = []



