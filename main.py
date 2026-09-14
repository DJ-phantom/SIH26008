import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from threading import Lock

import paho.mqtt.client as mqtt
from fastapi import FastAPI, Query

from db import save_telemetry, get_recent_telemetry


BROKER = "localhost"
PORT = 1883
TOPIC = "conveyor/BC01/telemetry"


latest_telemetry = {}
data_lock = Lock()

mqtt_connected = False


def on_connect(client, userdata, flags, reason_code, properties=None):
    global mqtt_connected

    if reason_code == 0:
        mqtt_connected = True

        print("Connected to MQTT broker")

        client.subscribe(TOPIC)

        print(f"Subscribed to {TOPIC}")

    else:
        print("MQTT connection failed:", reason_code)


def on_disconnect(
    client,
    userdata,
    disconnect_flags,
    reason_code,
    properties=None
):
    global mqtt_connected

    mqtt_connected = False

    print("Disconnected from MQTT broker")


def on_message(client, userdata, message):
    try:
        payload = message.payload.decode()
        data = json.loads(payload)

        if "conveyor_id" not in data:
            data["conveyor_id"] = "BC01"

        if "timestamp" not in data:
            data["timestamp"] = datetime.now(
                timezone.utc
            ).isoformat()

        with data_lock:
            latest_telemetry.clear()
            latest_telemetry.update(data)

        # THIS SAVES TO POSTGRESQL
        save_telemetry(data)

        print("Saved telemetry:", data)

    except Exception as error:
        print("Error processing MQTT message:", error)


mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)

mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect
mqtt_client.on_message = on_message


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting MQTT client...")

    mqtt_client.connect(BROKER, PORT, 60)
    mqtt_client.loop_start()

    yield

    print("Stopping MQTT client...")

    mqtt_client.loop_stop()
    mqtt_client.disconnect()


app = FastAPI(
    title="SIH26008 Conveyor Monitoring API",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {
        "message": "SIH26008 Conveyor Monitoring Backend"
    }


@app.get("/health")
def health():
    return {
        "api": "ok",
        "mqtt_connected": mqtt_connected,
    }


@app.get("/telemetry/latest")
def get_latest():
    with data_lock:
        return latest_telemetry.copy()


@app.get("/telemetry/history")
def get_history(
    limit: int = Query(default=50, ge=1, le=500)
):
    return get_recent_telemetry(limit)