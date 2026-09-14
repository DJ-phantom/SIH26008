from datetime import datetime, timezone

from db import save_telemetry


data = {
    "conveyor_id": "BC01",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "temperature": 45.0,
    "vibration": 3.5,
    "speed": 1.3,
    "current": 2.2,
}

save_telemetry(data)

print("SUCCESS: Python saved row to PostgreSQL")