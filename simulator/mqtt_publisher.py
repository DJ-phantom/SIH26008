import json
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulator.sensor_simulator import ConveyorSensorSimulator

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Error: 'paho-mqtt' is not installed. Please install it using: pip install -r requirements.txt")
    sys.exit(1)

# MQTT Broker Configuration
BROKER_HOST = "localhost"
BROKER_PORT = 1883
DEVICE_ID = "ESP32-01"
MQTT_TOPIC = f"sih26008/conveyor/{DEVICE_ID}/telemetry"
PUBLISH_INTERVAL = 1.0  # seconds


class ConveyorMQTTPublisher:
    """Publishes synthetic conveyor sensor telemetry over MQTT to a Mosquitto broker."""

    def __init__(
        self,
        broker_host: str = BROKER_HOST,
        broker_port: int = BROKER_PORT,
        device_id: str = DEVICE_ID,
        topic: str = MQTT_TOPIC,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.device_id = device_id
        self.topic = topic
        self.simulator = ConveyorSensorSimulator(device_id=device_id)
        self.connected = False

        # Initialize MQTT Client with paho-mqtt 2.x compatibility
        if hasattr(mqtt, "CallbackAPIVersion"):
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"sensor-simulator-{device_id}",
            )
        else:
            self.client = mqtt.Client(client_id=f"sensor-simulator-{device_id}")

        self._setup_callbacks()

    def _setup_callbacks(self):
        def on_connect(client, userdata, flags, reason_code, properties=None):
            # Check connection result
            rc = reason_code.value if hasattr(reason_code, "value") else reason_code
            if rc == 0:
                self.connected = True
                print(f"[MQTT] Connected successfully to broker at {self.broker_host}:{self.broker_port}")
                print(f"[MQTT] Publishing to topic: {self.topic}\n")
            else:
                print(f"[MQTT] Connection failed with code {rc}")

        def on_disconnect(client, userdata, *args, **kwargs):
            self.connected = False
            print("[MQTT] Disconnected from broker.")

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect

    def start(self):
        """Connects to the broker and continuously publishes telemetry."""
        print(f"Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
        except ConnectionRefusedError:
            print(f"\n[ERROR] Connection refused by broker at {self.broker_host}:{self.broker_port}.")
            print("Please ensure the Mosquitto broker service is running and accessible.")
            sys.exit(1)
        except Exception as e:
            print(f"\n[ERROR] Failed to connect to MQTT broker: {e}")
            sys.exit(1)

        self.client.loop_start()

        # Wait briefly for connection establishment
        time.sleep(0.5)

        print("Press Ctrl+C to stop publishing.\n")

        try:
            while True:
                telemetry = self.simulator.generate_normal_telemetry()
                payload = json.dumps(telemetry, separators=(",", ":"))
                self.client.publish(self.topic, payload=payload, qos=0)
                print(f"Published -> {self.topic} | {payload}")
                time.sleep(PUBLISH_INTERVAL)
        except KeyboardInterrupt:
            print("\nStopping MQTT publisher...")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            print("Publisher stopped cleanly.")


def main():
    publisher = ConveyorMQTTPublisher()
    publisher.start()


if __name__ == "__main__":
    main()
