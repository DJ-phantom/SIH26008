import json
import random
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

# -------------------------------------------------------------------------
# SIMULATED TRAINING DATA CONFIGURATION
# NOTE: The numeric ranges below are SIMULATED DATA for building and testing
# the software and data pipeline. They are NOT real NMDC conveyor thresholds
# or experimentally validated values.
# -------------------------------------------------------------------------

BROKER = "localhost"
PORT = 1883
TOPIC = "conveyor/BC01/telemetry"

CONDITIONS = {
    "1": "NORMAL",
    "2": "OVERLOAD",
    "3": "MISALIGNMENT",
    "4": "ROLLER_FAULT",
    "5": "FRICTION",
}

# Simulated sensor ranges for each condition
CONDITION_PROFILES = {
    "NORMAL": {
        "temperature": (30.0, 35.0),
        "vibration": (1.5, 2.5),
        "speed": (1.35, 1.45),
        "current": (1.4, 1.8),
    },
    "OVERLOAD": {
        "temperature": (36.0, 43.0),
        "vibration": (2.0, 3.5),
        "speed": (1.25, 1.38),
        "current": (2.5, 3.6),
    },
    "MISALIGNMENT": {
        "temperature": (38.0, 48.0),
        "vibration": (4.5, 7.5),
        "speed": (1.30, 1.42),
        "current": (1.8, 2.4),
    },
    "ROLLER_FAULT": {
        "temperature": (40.0, 52.0),
        "vibration": (5.0, 8.5),
        "speed": (1.32, 1.43),
        "current": (1.9, 2.6),
    },
    "FRICTION": {
        "temperature": (55.0, 75.0),
        "vibration": (3.0, 5.2),
        "speed": (1.28, 1.40),
        "current": (2.2, 3.2),
    },
}


def select_condition() -> str:
    # Check if condition provided as command line argument (e.g. python fake_sensor.py 1)
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip().upper()
        if arg in CONDITIONS:
            selected = CONDITIONS[arg]
        elif arg in CONDITION_PROFILES:
            selected = arg
        else:
            selected = "NORMAL"
        print(f"Condition selected via argument: {selected}\n")
        return selected

    print("\nSelect Operating Condition to Simulate:")
    print("1 - NORMAL")
    print("2 - OVERLOAD")
    print("3 - MISALIGNMENT")
    print("4 - ROLLER_FAULT")
    print("5 - FRICTION")

    try:
        choice = input("\nEnter choice (1-5, default 1): ").strip()
        selected = CONDITIONS.get(choice, "NORMAL")
    except (EOFError, KeyboardInterrupt):
        selected = "NORMAL"

    print(f"Selected Condition: {selected}\n")
    return selected


def main():
    condition = select_condition()
    profile = CONDITION_PROFILES[condition]

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    try:
        print(f"Connecting to MQTT broker at {BROKER}:{PORT}...")
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        print(f"Publishing simulated telemetry to topic '{TOPIC}' every 1s...")
        print("Press Ctrl+C to stop.\n")

        while True:
            data = {
                "conveyor_id": "BC01",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "temperature": round(random.uniform(*profile["temperature"]), 2),
                "vibration": round(random.uniform(*profile["vibration"]), 2),
                "speed": round(random.uniform(*profile["speed"]), 2),
                "current": round(random.uniform(*profile["current"]), 2),
                "condition": condition,
            }

            client.publish(TOPIC, json.dumps(data))
            print(f"Published: {data}", flush=True)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping fake sensor simulator...", flush=True)
    except Exception as e:
        print(f"\nError: {e}", flush=True)
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected from MQTT broker cleanly.", flush=True)


if __name__ == "__main__":
    main()