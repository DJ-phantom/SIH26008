import os

# Explicit Data Source configuration (SIMULATOR vs ESP32)
DATA_SOURCE = os.getenv("DATA_SOURCE", "SIMULATOR").upper()
DEVICE_ID = os.getenv("DEVICE_ID", "ESP32-01")
TELEMETRY_TOPIC = os.getenv("TELEMETRY_TOPIC", f"sih26008/conveyor/{DEVICE_ID}/telemetry")

def get_data_source_mode() -> str:
    if DATA_SOURCE == "ESP32":
        return "Hardware Mode / ESP32 Telemetry"
    return "Synthetic Telemetry Mode"
