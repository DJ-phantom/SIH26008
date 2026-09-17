from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from backend.alert_engine import alert_engine
from backend.anomaly_engine import anomaly_engine
from backend.condition_engine import condition_engine
from backend.decision_support import decision_support_engine
from backend.db import (
    check_db_connection,
    get_active_alerts,
    get_alert_count,
    get_alert_history,
    get_telemetry_count,
    get_telemetry_history,
    init_db,
)
from backend.models import (
    AlertCount,
    AlertRecord,
    AnomalyAssessment,
    ConditionSummary,
    DecisionSummary,
    TelemetryData,
    TelemetryRecord,
)
from backend.mqtt_client import mqtt_subscriber


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize PostgreSQL schema, sync alerts, and load anomaly detection model
    try:
        init_db()
        alert_engine.sync_from_db()
    except Exception as e:
        print(f"[Backend Lifespan] Database startup warning: {e}")

    try:
        anomaly_engine.load_model()
    except Exception as e:
        print(f"[Backend Lifespan] Anomaly model startup warning: {e}")

    mqtt_subscriber.start()
    yield
    # Shutdown: Stop and disconnect the MQTT client cleanly
    mqtt_subscriber.stop()


app = FastAPI(
    title="SIH26008 Conveyor Health Backend",
    description="Real-time intelligent conveyor belt health monitoring API with PostgreSQL persistence & Multi-Sensor Condition Engine",
    version="0.4.0",
    lifespan=lifespan,
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.config import DATA_SOURCE, DEVICE_ID, TELEMETRY_TOPIC, get_data_source_mode


@app.get("/", tags=["General"])
async def root():
    """Root service status endpoint."""
    return {
        "service": "SRIJAN SIH26008 Conveyor Health Backend",
        "status": "running",
    }


@app.get("/health", tags=["General"])
async def health_check():
    """Health check endpoint reporting service, MQTT, PostgreSQL connection status, and data source disclosure."""
    db_ok = check_db_connection()
    mqtt_ok = mqtt_subscriber.is_connected()
    overall_status = "ok" if (db_ok and mqtt_ok) else "degraded"
    return {
        "status": overall_status,
        "mqtt_connected": mqtt_ok,
        "database_connected": db_ok,
        "data_source": DATA_SOURCE,
        "data_source_mode": get_data_source_mode(),
        "device_id": DEVICE_ID,
        "telemetry_topic": TELEMETRY_TOPIC,
    }


@app.get(
    "/api/telemetry/latest",
    response_model=TelemetryData,
    tags=["Telemetry"],
    responses={
        200: {"description": "Latest telemetry reading retrieved successfully"},
        503: {"description": "Telemetry not yet available"},
    },
)
async def get_latest_telemetry():
    """Returns the most recent validated telemetry reading from the in-memory cache."""
    telemetry = mqtt_subscriber.get_latest_telemetry()
    if telemetry is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No telemetry received yet from conveyor sensors. Please ensure the publisher is active.",
        )
    return telemetry


@app.get(
    "/api/telemetry/history",
    response_model=List[TelemetryRecord],
    tags=["Telemetry"],
    responses={
        200: {"description": "Historical telemetry retrieved successfully"},
    },
)
async def get_history(
    limit: int = Query(default=20, ge=1, le=500, description="Number of newest records to return"),
):
    """Returns historical telemetry records from PostgreSQL ordered newest first."""
    return get_telemetry_history(limit=limit)


@app.get(
    "/api/telemetry/count",
    tags=["Telemetry"],
    responses={
        200: {"description": "Total count of telemetry records in database"},
    },
)
async def get_count():
    """Returns the total number of telemetry records stored in PostgreSQL."""
    return {"count": get_telemetry_count()}


# --- Alert REST Endpoints ---

@app.get(
    "/api/alerts/active",
    response_model=List[AlertRecord],
    tags=["Alerts"],
    responses={
        200: {"description": "Currently active condition alerts retrieved successfully"},
    },
)
async def get_active_alert_list(
    device_id: Optional[str] = Query(default=None, description="Optional filter by device ID"),
):
    """Returns currently active condition alerts."""
    return get_active_alerts(device_id=device_id)


@app.get(
    "/api/alerts/history",
    response_model=List[AlertRecord],
    tags=["Alerts"],
    responses={
        200: {"description": "Recent alert history (active and resolved) retrieved successfully"},
    },
)
async def get_alert_history_list(
    limit: int = Query(default=50, ge=1, le=500, description="Number of newest alert events to return"),
):
    """Returns recent alert events ordered newest first."""
    return get_alert_history(limit=limit)


@app.get(
    "/api/alerts/count",
    response_model=AlertCount,
    tags=["Alerts"],
    responses={
        200: {"description": "Counts of active and total alerts"},
    },
)
async def get_alert_counts():
    """Returns total active alerts count and overall total alerts count."""
    return get_alert_count()


# --- Condition Assessment REST Endpoints ---

@app.get(
    "/api/condition/summary",
    response_model=ConditionSummary,
    tags=["Condition Assessment"],
    responses={
        200: {"description": "Multi-sensor condition assessment summary retrieved successfully"},
        503: {"description": "Condition assessment engine awaiting telemetry"},
    },
)
async def get_condition_summary():
    """Returns transparent multi-sensor condition assessment summary for overall conveyor belt and prototype splice risk."""
    summary = condition_engine.get_latest_summary()
    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Condition assessment engine awaiting initial telemetry stream.",
        )
    return summary


# --- AI Anomaly Detection REST Endpoints ---

@app.get(
    "/api/anomaly/status",
    response_model=AnomalyAssessment,
    tags=["AI Anomaly Detection"],
    responses={
        200: {"description": "Step 12 Isolation Forest anomaly assessment retrieved successfully"},
    },
)
async def get_anomaly_status():
    """Returns Step 12 Unsupervised Multivariate Anomaly Detection assessment.
    If model is missing or unavailable, returns structured response with available=False.
    """
    if not anomaly_engine.is_available():
        return AnomalyAssessment(
            available=False,
            is_anomaly=False,
            stable_anomaly=False,
            decision_score=0.0,
            anomaly_index=0.0,
            status="MODEL_UNAVAILABLE",
            recent_anomaly_count=0,
            window_size=5,
            top_deviations=[],
            model_type="IsolationForest",
            training_sample_count=0,
        )

    assessment = anomaly_engine.get_latest_assessment()
    if assessment is None:
        return AnomalyAssessment(
            available=True,
            is_anomaly=False,
            stable_anomaly=False,
            decision_score=0.0,
            anomaly_index=0.0,
            status="AWAITING_TELEMETRY",
            recent_anomaly_count=0,
            window_size=5,
            top_deviations=[],
            model_type="IsolationForest",
            training_sample_count=anomaly_engine._metadata.get("training_sample_count", 0) if anomaly_engine._metadata else 0,
        )
    return assessment


# --- Step 13 Decision Support REST Endpoints ---

@app.get(
    "/api/decision-support/summary",
    response_model=DecisionSummary,
    tags=["Decision Support"],
    responses={
        200: {"description": "Step 13 unified decision support summary retrieved successfully"},
    },
)
async def get_decision_support_summary():
    """Returns Step 13 Unified Explainable Decision Support diagnostic summary.
    Aggregates active rule alerts, multi-sensor condition assessment, and ML anomaly detection.
    """
    return decision_support_engine.generate_summary()


