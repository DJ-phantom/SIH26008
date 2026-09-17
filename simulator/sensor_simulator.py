import json
import random
import time
from datetime import datetime

# Target operating ranges and max variation steps for normal operation
NORMAL_RANGES = {
    "temperature": {"min": 38.0, "max": 44.0, "step": 0.2, "round": 1},
    "vibration": {"min": 0.20, "max": 0.35, "step": 0.01, "round": 2},
    "current": {"min": 3.80, "max": 4.50, "step": 0.05, "round": 2},
    "speed": {"min": 1.70, "max": 1.90, "step": 0.02, "round": 2},
    "alignment": {"min": -2.0, "max": 2.0, "step": 0.1, "round": 1},
    "load": {"min": 50.0, "max": 70.0, "step": 0.8, "round": 1},
}


class ConveyorSensorSimulator:
    """Simulates realistic telemetry data from conveyor belt sensors (ESP32)."""

    def __init__(self, device_id: str = "ESP32-01"):
        self.device_id = device_id
        # Initialize internal state to midpoints of normal ranges
        self.state = {
            metric: (cfg["min"] + cfg["max"]) / 2.0
            for metric, cfg in NORMAL_RANGES.items()
        }

    def _drift_value(self, metric: str) -> float:
        """Applies a smooth random walk with gentle mean-reversion towards the midpoint."""
        cfg = NORMAL_RANGES[metric]
        curr = self.state[metric]
        midpoint = (cfg["min"] + cfg["max"]) / 2.0

        # Small nudge towards center to avoid clinging to boundary edges
        pull = 0.05 * (midpoint - curr)
        delta = random.uniform(-cfg["step"], cfg["step"]) + pull
        new_val = curr + delta

        # Clamp strictly within normal operating bounds
        clamped_val = max(cfg["min"], min(cfg["max"], new_val))
        self.state[metric] = clamped_val
        rounded_val = round(clamped_val, cfg["round"])
        return 0.0 if rounded_val == 0.0 else rounded_val

    def generate_normal_telemetry(self) -> dict:
        """Generates a single telemetry reading within normal operating parameters."""
        return {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "temperature": self._drift_value("temperature"),
            "vibration": self._drift_value("vibration"),
            "current": self._drift_value("current"),
            "speed": self._drift_value("speed"),
            "alignment": self._drift_value("alignment"),
            "load": self._drift_value("load"),
        }


def main():
    simulator = ConveyorSensorSimulator(device_id="ESP32-01")
    print(f"Starting Sensor Simulator for [{simulator.device_id}] (Normal Operation)...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            telemetry = simulator.generate_normal_telemetry()
            print(json.dumps(telemetry, indent=2))
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nSimulator stopped cleanly by user.")


if __name__ == "__main__":
    main()
