from backend.firebase_notifications import init_firebase_admin, is_firebase_configured
from backend.models import (
    DeviceRegistrationRequest,
    DeviceUnregisterRequest,
    NotificationStatusResponse,
)
from backend.db import (
    get_active_device_count,
    get_alert_by_id,
    register_push_device,
    unregister_push_device,
)
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from backend.alert_engine import alert_engine
from backend.anomaly_engine import anomaly_engine
from backend.cloud_demo import cloud_demo_generator
from backend.condition_engine import condition_engine
from backend.config import (
    CLOUD_DEMO,
    DATA_SOURCE,
    DEVICE_ID,
    FRONTEND_ORIGINS,
    TELEMETRY_TOPIC,
    get_data_source_mode,
)
from backend.db import (
    check_db_connection,
    get_active_alerts,
    get_alert_count,
    get_alert_history,
    get_telemetry_count,
    get_telemetry_history,
    init_db,
)

from backend.decision_support import decision_support_engine
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
from backend.telemetry_processor import get_latest_telemetry as fetch_latest_in_memory_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize PostgreSQL schema, sync alerts, and load anomaly detection model
    try:
        init_db()
        alert_engine.sync_from_db()
    except Exception as e:
        print(f"[Backend Lifespan] Database startup warning: {e}")

    try:
        init_firebase_admin()
    except Exception as e:
        print(f"[Backend Lifespan] Firebase Admin startup warning: {e}")

    try:
        anomaly_engine.load_model()
    except Exception as e:
        print(f"[Backend Lifespan] Anomaly model startup warning: {e}")

    if CLOUD_DEMO:
        print("[Backend Lifespan] Mode: PUBLIC CLOUD DEMO MODE. Starting Cloud Telemetry Generator...")
        cloud_demo_generator.start()
    else:
        print("[Backend Lifespan] Mode: LOCAL HARDWARE / MQTT MODE. Starting Backend MQTT Subscriber...")
        mqtt_subscriber.start()

    yield

    # Shutdown: Stop generators or MQTT subscribers cleanly
    if CLOUD_DEMO:
        await cloud_demo_generator.stop()
    else:
        mqtt_subscriber.stop()


app = FastAPI(
    title="SIH26008 Conveyor Health Backend",
    description="Real-time intelligent conveyor belt health monitoring API with PostgreSQL persistence & Multi-Sensor Condition Engine",
    version="0.5.0",
    lifespan=lifespan,
)

# CORS configuration for development and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    """Root service status endpoint."""
    return {
        "service": "SRIJAN SIH26008 Conveyor Health Backend",
        "status": "running",
        "cloud_demo": CLOUD_DEMO,
    }


@app.get("/health", tags=["General"])
async def health_check():
    """Health check endpoint reporting service, MQTT, PostgreSQL connection status, and data source disclosure."""
    db_ok = check_db_connection()
    mqtt_ok = mqtt_subscriber.is_connected()

    if CLOUD_DEMO:
        mqtt_required = False
        overall_status = "ok" if db_ok else "degraded"
        effective_data_source = "CLOUD_DEMO" if DATA_SOURCE != "ESP32" else DATA_SOURCE
    else:
        mqtt_required = True
        overall_status = "ok" if (db_ok and mqtt_ok) else "degraded"
        effective_data_source = DATA_SOURCE

    return {
        "status": overall_status,
        "mqtt_connected": mqtt_ok,
        "mqtt_required": mqtt_required,
        "database_connected": db_ok,
        "cloud_demo": CLOUD_DEMO,
        "data_source": effective_data_source,
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
    telemetry = fetch_latest_in_memory_telemetry()
    if telemetry is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No telemetry received yet from conveyor sensors. Please ensure the publisher or cloud generator is active.",
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




# --- Notification REST Endpoints ---

@app.post(
    "/api/notifications/register-device",
    tags=["Notifications"],
    responses={
        200: {"description": "Device token registered successfully"},
        400: {"description": "Invalid device token"},
    },
)
async def register_device(req: DeviceRegistrationRequest):
    """Registers or refreshes an FCM device token for push alert notifications."""
    if not req.token or not req.token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FCM token cannot be empty.",
        )
    ok = register_push_device(
        token=req.token.strip(),
        platform=req.platform,
        device_label=req.device_label,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register FCM device token.",
        )
    return {
        "status": "registered",
        "device_label": req.device_label,
        "platform": req.platform,
        "is_active": True,
    }


@app.post(
    "/api/notifications/unregister-device",
    tags=["Notifications"],
    responses={
        200: {"description": "Device token unregistered successfully"},
    },
)
async def unregister_device(req: DeviceUnregisterRequest):
    """Marks an FCM device token as inactive."""
    if not req.token or not req.token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FCM token cannot be empty.",
        )
    unregister_push_device(token=req.token.strip())
    return {"status": "unregistered", "is_active": False}


@app.get(
    "/api/notifications/status",
    response_model=NotificationStatusResponse,
    tags=["Notifications"],
    responses={
        200: {"description": "Notification subsystem status retrieved successfully"},
    },
)
async def get_notification_status():
    """Returns safe diagnostic information regarding Firebase Admin configuration and active devices."""
    configured = is_firebase_configured()
    active_count = get_active_device_count()
    return NotificationStatusResponse(
        firebase_configured=configured,
        active_device_count=active_count,
        dispatch_mode="DEMO_BROADCAST",
    )


# --- Alert By ID REST Endpoint ---

@app.get(
    "/api/alerts/{alert_id}",
    response_model=AlertRecord,
    tags=["Alerts"],
    responses={
        200: {"description": "Exact alert event retrieved successfully"},
        404: {"description": "Alert event not found"},
    },
)
async def get_alert_by_id_endpoint(alert_id: int):
    """Returns a specific alert event record by its unique database ID."""
    record = get_alert_by_id(alert_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert #{alert_id} not found.",
        )
    return record


# --- Demo Scenario Control REST Endpoint ---

from simulator.sensor_simulator import Scenario

@app.post(
    "/api/demo/scenario",
    tags=["Demo Simulation"],
    responses={
        200: {"description": "Demo telemetry scenario updated successfully"},
        400: {"description": "Invalid scenario name"},
        403: {"description": "Scenario control disabled in non-demo mode"},
    },
)
async def set_demo_scenario(
    scenario: str = Query(..., description="Scenario name: NORMAL, HIGH_VIBRATION, MOTOR_OVERLOAD, BELT_MISALIGNMENT, SPLICE_DEGRADATION")
):
    """Updates active synthetic telemetry scenario for CloudDemoGenerator in CLOUD_DEMO mode."""
    if not CLOUD_DEMO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo scenario control is disabled when CLOUD_DEMO is False (Physical Hardware / MQTT Mode).",
        )

    scen_str = scenario.strip().upper()
    valid_scenarios = [s.value for s in Scenario]
    if scen_str not in valid_scenarios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario '{scenario}'. Allowed choices: {', '.join(valid_scenarios)}",
        )

    scen_enum = Scenario(scen_str)
    cloud_demo_generator.set_scenario(scen_enum)
    return {
        "status": "updated",
        "active_scenario": scen_enum.value,
        "device_id": DEVICE_ID,
        "cloud_demo": True,
    }
