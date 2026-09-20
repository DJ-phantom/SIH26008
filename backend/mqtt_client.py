import json
import logging
import os
import threading
from typing import Optional

import paho.mqtt.client as mqtt
from pydantic import ValidationError

from backend.models import TelemetryData
from backend.telemetry_processor import get_latest_telemetry as get_shared_latest_telemetry, process_telemetry

logger = logging.getLogger("backend.mqtt")

BROKER_HOST = "localhost"
BROKER_PORT = 1883
TELEMETRY_TOPIC = "sih26008/conveyor/ESP32-01/telemetry"


class BackendMQTTSubscriber:
    """Subscribes to conveyor telemetry over MQTT, caches latest in memory, persists to PostgreSQL, and triggers engines via process_telemetry."""

    def __init__(
        self,
        broker_host: str = BROKER_HOST,
        broker_port: int = BROKER_PORT,
        topic: str = TELEMETRY_TOPIC,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic
        self._connected = False

        # Configure MQTT Client with unique process ID to prevent broker session collision
        client_name = f"sih26008-fastapi-backend-{os.getpid()}"
        if hasattr(mqtt, "CallbackAPIVersion"):
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=client_name,
            )
        else:
            self.client = mqtt.Client(client_id=client_name)

        self._setup_callbacks()

    def _setup_callbacks(self):
        def on_connect(client, userdata, flags, reason_code, properties=None):
            rc = reason_code.value if hasattr(reason_code, "value") else reason_code
            if rc == 0:
                self._connected = True
                print(f"[Backend MQTT] Connected to broker at {self.broker_host}:{self.broker_port}")
                client.subscribe(self.topic, qos=0)
                print(f"[Backend MQTT] Subscribed to topic: {self.topic}")
            else:
                self._connected = False
                print(f"[Backend MQTT] Connection failed with code {rc}")

        def on_disconnect(client, userdata, *args, **kwargs):
            self._connected = False
            print("[Backend MQTT] Disconnected from broker.")

        def on_message(client, userdata, message):
            try:
                payload_str = message.payload.decode("utf-8")
                raw_data = json.loads(payload_str)
                validated_data = TelemetryData.model_validate(raw_data)

                # Delegate processing to shared telemetry processor pipeline
                process_telemetry(validated_data)
            except UnicodeDecodeError as e:
                print(f"[Backend MQTT] Error decoding message payload: {e}")
            except json.JSONDecodeError as e:
                print(f"[Backend MQTT] Warning: Received invalid JSON on {message.topic}: {e}")
            except ValidationError as e:
                print(f"[Backend MQTT] Warning: Telemetry validation failed: {e}")
            except Exception as e:
                print(f"[Backend MQTT] Unexpected error processing message: {e}")

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect
        self.client.on_message = on_message

    def start(self):
        """Starts the MQTT network loop in a background thread."""
        try:
            print(f"[Backend MQTT] Connecting to {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
        except ConnectionRefusedError:
            print(f"[Backend MQTT] Warning: Connection refused by broker at {self.broker_host}:{self.broker_port}.")
        except Exception as e:
            print(f"[Backend MQTT] Warning: Could not connect to broker on startup: {e}")

    def stop(self):
        """Stops the MQTT client background loop and disconnects cleanly."""
        print("[Backend MQTT] Stopping MQTT client...")
        try:
            self.client.loop_stop()
            if self._connected:
                self.client.disconnect()
        except Exception as e:
            print(f"[Backend MQTT] Error during shutdown: {e}")
        finally:
            self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    def get_latest_telemetry(self) -> Optional[TelemetryData]:
        return get_shared_latest_telemetry()


# Global singleton instance for the FastAPI backend
mqtt_subscriber = BackendMQTTSubscriber()

