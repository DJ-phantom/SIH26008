import argparse
import json
import os
import sys
import threading
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulator.sensor_simulator import ConveyorSensorSimulator, Scenario

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
CONTROL_TOPIC = "sih26008/control/scenario"
PUBLISH_INTERVAL = 1.0  # seconds

VALID_SCENARIOS = [s.value for s in Scenario]


class ConveyorMQTTPublisher:
    """Publishes synthetic conveyor sensor telemetry over MQTT to a Mosquitto broker.
    
    Subscribes to a local MQTT demo control topic to allow live scenario switching
    without restarting the telemetry publisher process.
    """

    def __init__(
        self,
        broker_host: str = BROKER_HOST,
        broker_port: int = BROKER_PORT,
        device_id: str = DEVICE_ID,
        topic: str = MQTT_TOPIC,
        control_topic: str = CONTROL_TOPIC,
        scenario: str = Scenario.NORMAL.value,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.device_id = device_id
        self.topic = topic
        self.control_topic = control_topic
        self.lock = threading.Lock()

        try:
            scenario_enum = Scenario(scenario.upper())
        except ValueError:
            print(f"[ERROR] Invalid scenario '{scenario}'. Valid choices: {', '.join(VALID_SCENARIOS)}")
            sys.exit(1)

        self.simulator = ConveyorSensorSimulator(device_id=device_id, initial_scenario=scenario_enum)
        self.connected = False

        # Initialize MQTT Client with unique client ID
        client_name = f"sensor-simulator-{device_id}-{os.getpid()}"
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
                self.connected = True
                print(f"[MQTT] Connected successfully to broker at {self.broker_host}:{self.broker_port}")
                print(f"[MQTT] Active Scenario: [{self.simulator.scenario.value}]")
                print(f"[MQTT] Publishing to topic: {self.topic}")
                print(f"[MQTT] Subscribed to control topic: {self.control_topic}\n")
                # Subscribe to control topic for live scenario switching
                client.subscribe(self.control_topic)
            else:
                print(f"[MQTT] Connection failed with code {rc}")

        def on_disconnect(client, userdata, *args, **kwargs):
            self.connected = False
            print("[MQTT] Disconnected from broker.")

        def on_message(client, userdata, msg):
            if msg.topic == self.control_topic:
                try:
                    command = msg.payload.decode("utf-8").strip().upper()
                except Exception as e:
                    print(f"[Demo Control] Failed to decode control payload: {e}")
                    return

                if command in VALID_SCENARIOS:
                    with self.lock:
                        old_scenario = self.simulator.scenario.value
                        new_scenario = Scenario(command)
                        if old_scenario != command:
                            self.simulator.set_scenario(new_scenario)
                            print(f"\n[Demo Control] Scenario change requested: {old_scenario} -> {command}\n")
                        else:
                            print(f"\n[Demo Control] Already running scenario: {command}\n")
                else:
                    print(
                        f"\n[Demo Control] Invalid scenario command: '{command}'\n"
                        f"Valid scenarios: {', '.join(VALID_SCENARIOS)}\n"
                    )

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect
        self.client.on_message = on_message

    def start(self):
        """Connects to the broker and continuously publishes telemetry."""
        print(f"Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
        print(f"Simulation Mode: {self.simulator.scenario.value}")
        print("Note: Scenario profiles are synthetic demonstration data and not experimentally validated fault signatures.")

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
                with self.lock:
                    telemetry = self.simulator.generate_telemetry()
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


def parse_args():
    parser = argparse.ArgumentParser(
        description="SIH26008 Conveyor Sensor Telemetry MQTT Publisher",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "--scenario",
        "-s",
        type=str,
        default="NORMAL",
        choices=VALID_SCENARIOS,
        help=(
            "Operational/fault demonstration scenario to simulate.\n"
            "Choices:\n"
            "  NORMAL             : Standard normal conveyor baseline\n"
            "  HIGH_VIBRATION     : Developing abnormal vibration profile\n"
            "  MOTOR_OVERLOAD     : High motor current, temperature & load\n"
            "  BELT_MISALIGNMENT  : Progressive lateral tracking offset\n"
            "  SPLICE_DEGRADATION : Progressive vibration with intermittent impulse spikes\n"
            "Default: NORMAL"
        ),
    )
    parser.add_argument(
        "--host",
        type=str,
        default=BROKER_HOST,
        help=f"MQTT broker hostname (default: {BROKER_HOST})",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=BROKER_PORT,
        help=f"MQTT broker port (default: {BROKER_PORT})",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    publisher = ConveyorMQTTPublisher(
        broker_host=args.host,
        broker_port=args.port,
        scenario=args.scenario,
    )
    publisher.start()


if __name__ == "__main__":
    main()
