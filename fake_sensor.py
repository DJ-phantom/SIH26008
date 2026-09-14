import json
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


BROKER = "localhost"
PORT = 1883
TOPIC = "conveyor/BC01/telemetry"


client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)

client.connect(BROKER, PORT, 60)


while True:
    data = {
        "conveyor_id": "BC01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": round(random.uniform(30, 35), 2),
        "vibration": round(random.uniform(1.5, 2.5), 2),
        "speed": round(random.uniform(1.35, 1.45), 2),
        "current": round(random.uniform(1.4, 1.8), 2),
    }

    client.publish(TOPIC, json.dumps(data))

    print(data)

    time.sleep(1)