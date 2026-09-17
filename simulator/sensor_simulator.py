import json
import random
import time
from datetime import datetime
from enum import Enum
from typing import Dict, Any


class Scenario(str, Enum):
    NORMAL = "NORMAL"
    HIGH_VIBRATION = "HIGH_VIBRATION"
    MOTOR_OVERLOAD = "MOTOR_OVERLOAD"
    BELT_MISALIGNMENT = "BELT_MISALIGNMENT"
    SPLICE_DEGRADATION = "SPLICE_DEGRADATION"


# Target parameter centers and bounds for each demonstration scenario
# Note: These values are synthetic prototype demo profiles for software verification and SIH demonstration.
# They are not experimentally validated industrial fault thresholds.
SCENARIO_PROFILES = {
    Scenario.NORMAL: {
        "temperature": {"target": 41.0, "min": 38.0, "max": 44.0, "noise": 0.2, "round": 1},
        "vibration": {"target": 0.27, "min": 0.20, "max": 0.35, "noise": 0.01, "round": 2},
        "current": {"target": 4.15, "min": 3.80, "max": 4.50, "noise": 0.05, "round": 2},
        "speed": {"target": 1.80, "min": 1.70, "max": 1.90, "noise": 0.02, "round": 2},
        "alignment": {"target": 0.0, "min": -2.0, "max": 2.0, "noise": 0.1, "round": 1},
        "load": {"target": 60.0, "min": 50.0, "max": 70.0, "noise": 0.8, "round": 1},
    },
    Scenario.HIGH_VIBRATION: {
        "temperature": {"target": 42.5, "min": 39.0, "max": 45.0, "noise": 0.2, "round": 1},
        "vibration": {"target": 0.68, "min": 0.50, "max": 0.78, "noise": 0.02, "round": 2},
        "current": {"target": 4.25, "min": 3.90, "max": 4.60, "noise": 0.05, "round": 2},
        "speed": {"target": 1.79, "min": 1.72, "max": 1.86, "noise": 0.02, "round": 2},
        "alignment": {"target": 0.2, "min": -1.5, "max": 1.5, "noise": 0.1, "round": 1},
        "load": {"target": 61.0, "min": 52.0, "max": 68.0, "noise": 0.8, "round": 1},
    },
    Scenario.MOTOR_OVERLOAD: {
        "temperature": {"target": 47.5, "min": 44.0, "max": 51.0, "noise": 0.3, "round": 1},
        "vibration": {"target": 0.36, "min": 0.28, "max": 0.44, "noise": 0.02, "round": 2},
        "current": {"target": 5.60, "min": 5.00, "max": 6.20, "noise": 0.08, "round": 2},
        "speed": {"target": 1.65, "min": 1.55, "max": 1.75, "noise": 0.02, "round": 2},
        "alignment": {"target": 0.1, "min": -1.5, "max": 1.5, "noise": 0.1, "round": 1},
        "load": {"target": 82.0, "min": 75.0, "max": 90.0, "noise": 1.0, "round": 1},
    },
    Scenario.BELT_MISALIGNMENT: {
        "temperature": {"target": 42.0, "min": 39.0, "max": 44.5, "noise": 0.2, "round": 1},
        "vibration": {"target": 0.38, "min": 0.30, "max": 0.46, "noise": 0.02, "round": 2},
        "current": {"target": 4.45, "min": 4.10, "max": 4.80, "noise": 0.06, "round": 2},
        "speed": {"target": 1.78, "min": 1.70, "max": 1.86, "noise": 0.02, "round": 2},
        "alignment": {"target": 5.5, "min": 3.5, "max": 6.8, "noise": 0.2, "round": 1},
        "load": {"target": 62.0, "min": 52.0, "max": 68.0, "noise": 0.8, "round": 1},
    },
    Scenario.SPLICE_DEGRADATION: {
        "temperature": {"target": 42.5, "min": 40.0, "max": 45.0, "noise": 0.2, "round": 1},
        "vibration": {"target": 0.42, "min": 0.32, "max": 0.72, "noise": 0.02, "round": 2},
        "current": {"target": 4.35, "min": 4.00, "max": 4.70, "noise": 0.05, "round": 2},
        "speed": {"target": 1.78, "min": 1.70, "max": 1.86, "noise": 0.02, "round": 2},
        "alignment": {"target": 1.2, "min": -2.0, "max": 3.0, "noise": 0.2, "round": 1},
        "load": {"target": 61.0, "min": 52.0, "max": 68.0, "noise": 0.8, "round": 1},
    },
}

# Maximum transition step per reading towards the target profile
# This enforces smooth gradual progression over approximately 15–25 readings
TRANSITION_RATES = {
    "temperature": 0.35,    # °C per second
    "vibration": 0.02,      # g per second
    "current": 0.08,        # A per second
    "speed": 0.015,         # m/s per second
    "alignment": 0.25,      # mm per second
    "load": 1.2,            # % per second
}


class ConveyorSensorSimulator:
    """Simulates realistic scenario-based telemetry data from conveyor belt sensors (ESP32).
    
    Supports smooth bounded transitions between operational and fault demonstration scenarios.
    """

    def __init__(self, device_id: str = "ESP32-01", initial_scenario: Scenario = Scenario.NORMAL):
        self.device_id = device_id
        self.scenario = initial_scenario
        self.tick_count = 0

        # Initialize internal state to normal baseline values
        normal_profile = SCENARIO_PROFILES[Scenario.NORMAL]
        self.state: Dict[str, float] = {
            metric: normal_profile[metric]["target"]
            for metric in normal_profile
        }

    def set_scenario(self, scenario: Scenario):
        """Switches the active simulation scenario profile."""
        if scenario != self.scenario:
            self.scenario = scenario
            self.tick_count = 0

    def _step_metric(self, metric: str) -> float:
        """Gradually transitions a single metric towards its active scenario target."""
        profile = SCENARIO_PROFILES[self.scenario][metric]
        curr = self.state[metric]
        target = profile["target"]
        max_rate = TRANSITION_RATES[metric]
        noise_amp = profile["noise"]

        # 1. Smoothly step towards target
        diff = target - curr
        if abs(diff) > max_rate:
            step = max_rate if diff > 0 else -max_rate
        else:
            step = diff

        # 2. Add natural bounded jitter / noise
        jitter = random.uniform(-noise_amp, noise_amp)
        new_val = curr + step + jitter

        # 3. Handle intermittent splice pulse for SPLICE_DEGRADATION
        if self.scenario == Scenario.SPLICE_DEGRADATION:
            # Simulate a joint pass impulse spike every 5 ticks
            if self.tick_count % 5 == 0:
                if metric == "vibration":
                    new_val += random.uniform(0.15, 0.28)
                elif metric == "alignment":
                    new_val += random.uniform(1.0, 2.2)

        # 4. Enforce strict scenario safety bounds
        clamped_val = max(profile["min"], min(profile["max"], new_val))
        self.state[metric] = clamped_val

        # 5. Round to target decimals
        rounded = round(clamped_val, profile["round"])
        return 0.0 if rounded == 0.0 else rounded

    def generate_telemetry(self) -> Dict[str, Any]:
        """Generates a single telemetry reading based on current scenario and state."""
        self.tick_count += 1

        return {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "scenario": self.scenario.value,
            "temperature": self._step_metric("temperature"),
            "vibration": self._step_metric("vibration"),
            "current": self._step_metric("current"),
            "speed": self._step_metric("speed"),
            "alignment": self._step_metric("alignment"),
            "load": self._step_metric("load"),
        }

    def generate_normal_telemetry(self) -> Dict[str, Any]:
        """Backward compatibility helper for normal telemetry."""
        self.set_scenario(Scenario.NORMAL)
        return self.generate_telemetry()


def main():
    simulator = ConveyorSensorSimulator(device_id="ESP32-01", initial_scenario=Scenario.NORMAL)
    print(f"Starting Sensor Simulator for [{simulator.device_id}] (Scenario: {simulator.scenario.value})...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            telemetry = simulator.generate_telemetry()
            print(json.dumps(telemetry, indent=2))
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nSimulator stopped cleanly by user.")


if __name__ == "__main__":
    main()
