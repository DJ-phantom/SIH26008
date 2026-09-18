import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("[ERROR] 'paho-mqtt' is not installed. Please run: pip install paho-mqtt")
    sys.exit(1)

BROKER_HOST = "localhost"
BROKER_PORT = 1883
CONTROL_TOPIC = "sih26008/control/scenario"

SCENARIOS_MAP = {
    "1": "NORMAL",
    "2": "HIGH_VIBRATION",
    "3": "MOTOR_OVERLOAD",
    "4": "BELT_MISALIGNMENT",
    "5": "SPLICE_DEGRADATION",
    "R": "NORMAL",
}

VALID_SCENARIOS = ["NORMAL", "HIGH_VIBRATION", "MOTOR_OVERLOAD", "BELT_MISALIGNMENT", "SPLICE_DEGRADATION"]


def publish_command(scenario_name: str, host: str = BROKER_HOST, port: int = BROKER_PORT, topic: str = CONTROL_TOPIC) -> bool:
    """Publishes a scenario control command to the Mosquitto broker."""
    client_id = f"demo-controller-{os.getpid()}"
    if hasattr(mqtt, "CallbackAPIVersion"):
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
    else:
        client = mqtt.Client(client_id=client_id)

    try:
        client.connect(host, port, keepalive=10)
    except ConnectionRefusedError:
        print(f"\n[ERROR] Unable to connect to MQTT broker at {host}:{port}.")
        print("Please ensure the Mosquitto broker service is running and accessible.\n")
        return False
    except Exception as e:
        print(f"\n[ERROR] Failed to connect to MQTT broker: {e}\n")
        return False

    client.loop_start()
    info = client.publish(topic, payload=scenario_name.encode("utf-8"), qos=0)
    info.wait_for_publish(timeout=2.0)
    client.loop_stop()
    client.disconnect()
    
    print(f"Scenario command sent: {scenario_name}")
    return True


def interactive_menu():
    print("\n" + "=" * 50)
    print("SRIJAN — SIH26008 DEMO CONTROLLER")
    print("=" * 50)
    print(f"Control Target: {CONTROL_TOPIC}")
    print(f"Broker Target: {BROKER_HOST}:{BROKER_PORT}")
    print("-" * 50)
    print("1. NORMAL")
    print("2. HIGH_VIBRATION")
    print("3. MOTOR_OVERLOAD")
    print("4. BELT_MISALIGNMENT")
    print("5. SPLICE_DEGRADATION")
    print("-" * 50)
    print("R. Reset to NORMAL")
    print("Q. Quit")
    print("=" * 50 + "\n")

    while True:
        try:
            choice = input("Select scenario [1-5, R, Q]: ").strip().upper()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting controller.")
            break

        if choice == "Q":
            print("Exiting controller cleanly.")
            break

        if choice in SCENARIOS_MAP:
            target_scenario = SCENARIOS_MAP[choice]
            publish_command(target_scenario)
        elif choice in VALID_SCENARIOS:
            publish_command(choice)
        else:
            print(f"Invalid option '{choice}'. Please select 1-5, R, or Q.")


def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip().upper()
        if arg in SCENARIOS_MAP:
            scenario = SCENARIOS_MAP[arg]
        elif arg in VALID_SCENARIOS:
            scenario = arg
        else:
            print(f"[ERROR] Invalid scenario command '{arg}'.")
            print(f"Valid choices: {', '.join(VALID_SCENARIOS)}")
            sys.exit(1)
        
        success = publish_command(scenario)
        sys.exit(0 if success else 1)
    else:
        interactive_menu()


if __name__ == "__main__":
    main()
