import json
import logging
import os
import threading
from typing import Optional

import paho.mqtt.client as mqtt
from pydantic import ValidationError

from backend.alert_engine import alert_engine
from backend.anomaly_engine import anomaly_engine
from backend.condition_engine import condition_engine
from backend.db import insert_telemetry
from backend.models import TelemetryData

logger = logging.getLogger("backend.mqtt")

BROKER_HOST = "localhost"
BROKER_PORT = 1883
TELEMETRY_TOPIC = "sih26008/conveyor/ESP32-01/telemetry"


class BackendMQTTSubscriber:
    """Subscribes to conveyor telemetry over MQTT, caches latest in memory, persists to PostgreSQL, and triggers engines."""

    def __init__(
        self,
        broker_host: str = BROKER_HOST,
        broker_port: int = BROKER_PORT,
        topic: str = TELEMETRY_TOPIC,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic

        self._latest_telemetry: Optional[TelemetryData] = None
        self._lock = threading.Lock()
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

                # 1. Update in-memory cache
                with self._lock:
                    self._latest_telemetry = validated_data

                # 2. Persist to PostgreSQL (non-fatal on failure)
                row_id = insert_telemetry(validated_data)
                db_status = f"DB ID: {row_id}" if row_id else "DB: pending/skipped"

                # 3. Rule-Based Condition & Alert Engine Evaluation (non-fatal on failure)
                try:
                    alert_engine.process_telemetry(validated_data)
                except Exception as alert_err:
                    print(f"[Backend MQTT] Alert engine evaluation error: {alert_err}")

                # 4. Multi-Sensor Condition Assessment Engine Evaluation (non-fatal on failure)
                try:
                    condition_engine.process_telemetry(validated_data)
                except Exception as cond_err:
                    print(f"[Backend MQTT] Condition engine processing error: {cond_err}")

                # 5. Step 12 Isolation Forest Anomaly Detection Engine Evaluation (non-fatal on failure)
                try:
                    anomaly_engine.process_telemetry(validated_data)
                except Exception as anomaly_err:
                    print(f"[Backend MQTT] Anomaly engine processing error: {anomaly_err}")

                print(
                    f"MQTT received | {validated_data.device_id} | "
                    f"Temp: {validated_data.temperature:.1f} | "
                    f"Vib: {validated_data.vibration:.2f} | "
                    f"Speed: {validated_data.speed:.2f} | {db_status}"
                )
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
        with self._lock:
            return self._latest_telemetry


# Global singleton instance for the FastAPI backend
mqtt_subscriber = BackendMQTTSubscriber()
