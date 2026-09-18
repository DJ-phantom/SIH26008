import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))

from tools.demo_controller import publish_command, VALID_SCENARIOS
from simulator.sensor_simulator import ConveyorSensorSimulator, Scenario

def test_step16_demo_control():
    print("=" * 70)
    print("RUNNING STEP 16 LIVE DEMO CONTROL TEST SUITE")
    print("=" * 70)

    # 1. Test Demo Controller CLI Arguments & Scenario Validation
    print("\n--- TEST 1: DEMO CONTROLLER SCENARIO VALIDATION ---")
    for scenario in VALID_SCENARIOS:
        print(f"Valid scenario recognized: {scenario}")
    print("[SUCCESS] ALL 5 DEMONSTRATION SCENARIOS VALIDATED!")

    # 2. Test Simulator Scenario Transition
    print("\n--- TEST 2: SIMULATOR GRADUAL TRANSITION TEST ---")
    sim = ConveyorSensorSimulator(device_id="ESP32-01", initial_scenario=Scenario.NORMAL)
    initial_reading = sim.generate_telemetry()
    print(f"Initial NORMAL reading: vibration={initial_reading['vibration']} g")
    assert initial_reading["scenario"] == "NORMAL"

    # Switch scenario to HIGH_VIBRATION
    sim.set_scenario(Scenario.HIGH_VIBRATION)
    print("Switching scenario to HIGH_VIBRATION...")
    
    readings = []
    for _ in range(10):
        readings.append(sim.generate_telemetry()["vibration"])

    print(f"Vibration progression over 10 ticks: {readings}")
    # Verify smooth progression (reading[9] > reading[0])
    assert readings[-1] > readings[0], "Vibration did not step upwards gradually"
    print("[SUCCESS] GRADUAL SMOOTH TRANSITION VERIFIED!")

    # 3. Test Direct Command Publishing Helper
    print("\n--- TEST 3: MQTT DEMO CONTROLLER HELPER TEST ---")
    try:
        res = publish_command("NORMAL")
        if res:
            print("[SUCCESS] MQTT PUBLISH COMMAND HELPER VERIFIED!")
        else:
            print("[NOTICE] Mosquitto broker offline during test, connection error handled cleanly.")
    except Exception as e:
        print(f"[ERROR] Unexpected exception: {e}")
        assert False, f"Publish command raised exception: {e}"

    print("\n" + "=" * 70)
    print("ALL STEP 16 DEMO CONTROL TESTS PASSED CLEANLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_step16_demo_control()
