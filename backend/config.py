import os

# Cloud Demo & Data Source configuration
CLOUD_DEMO = os.getenv("CLOUD_DEMO", "false").lower() in ("true", "1", "yes")

_raw_data_source = os.getenv("DATA_SOURCE")
if _raw_data_source:
    DATA_SOURCE = _raw_data_source.upper()
elif CLOUD_DEMO:
    DATA_SOURCE = "CLOUD_DEMO"
else:
    DATA_SOURCE = "SIMULATOR"

DEVICE_ID = os.getenv("DEVICE_ID", "ESP32-01")
TELEMETRY_TOPIC = os.getenv("TELEMETRY_TOPIC", f"sih26008/conveyor/{DEVICE_ID}/telemetry")

# CORS Origins configuration
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

_raw_origins = os.getenv("FRONTEND_ORIGINS")
if _raw_origins:
    FRONTEND_ORIGINS = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]
else:
    FRONTEND_ORIGINS = DEFAULT_ORIGINS


def get_data_source_mode() -> str:
    if CLOUD_DEMO:
        return "Cloud Synthetic Telemetry"
    if DATA_SOURCE == "ESP32":
        return "Hardware Mode / ESP32 Telemetry"
    return "Synthetic Telemetry Mode"

DEMO_CONTROL_SECRET = os.getenv("DEMO_CONTROL_SECRET", "srijan-demo-secret-2026")
