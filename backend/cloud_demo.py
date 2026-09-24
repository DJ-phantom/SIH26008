import asyncio
import logging
import os
import sys
from typing import Optional

# Ensure project root is in sys.path if needed
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import TelemetryData
from backend.telemetry_processor import process_telemetry
from simulator.sensor_simulator import ConveyorSensorSimulator, Scenario

logger = logging.getLogger("backend.cloud_demo")


class CloudDemoGenerator:
    """FastAPI Cloud Demo Telemetry Generator.
    
    Runs a background task inside FastAPI when CLOUD_DEMO=true.
    Generates continuous synthetic telemetry in the active Scenario (default NORMAL) at ~1 Hz
    and routes every sample into the shared backend process_telemetry() pipeline.
    """

    def __init__(self, device_id: str = "ESP32-01", publish_interval: float = 1.0):
        self.device_id = device_id
        self.publish_interval = publish_interval
        self.active_scenario = Scenario.NORMAL
        self.simulator = ConveyorSensorSimulator(device_id=device_id, initial_scenario=Scenario.NORMAL)
        self._running = False
        self._task: Optional[asyncio.Task] = None

    def set_scenario(self, scenario: Scenario):
        """Switches the active simulation scenario profile."""
        if scenario != self.active_scenario:
            self.active_scenario = scenario
            self.simulator.set_scenario(scenario)
            print(f"[CloudDemoGenerator] Switched active scenario to [{scenario.value}]")

    async def _run_loop(self):
        """Continuous async loop generating telemetry and feeding the shared pipeline."""
        print(f"[CloudDemoGenerator] Starting synthetic telemetry loop for [{self.device_id}] (Active Scenario: {self.active_scenario.value})...")
        while self._running:
            try:
                # 1. Ensure simulator matches active_scenario
                if self.simulator.scenario != self.active_scenario:
                    self.simulator.set_scenario(self.active_scenario)

                # 2. Generate synthetic reading
                raw_data = self.simulator.generate_telemetry()
                raw_data["scenario"] = self.active_scenario.value

                # 3. Validate model
                validated_data = TelemetryData.model_validate(raw_data)

                # 4. Route through shared backend telemetry processor
                process_telemetry(validated_data)
            except asyncio.CancelledError:
                print("[CloudDemoGenerator] Background task cancelled.")
                break
            except Exception as e:
                print(f"[CloudDemoGenerator] Iteration error (recovering): {e}")

            try:
                await asyncio.sleep(self.publish_interval)
            except asyncio.CancelledError:
                break

        print("[CloudDemoGenerator] Background loop stopped cleanly.")

    def start(self):
        """Starts the background asyncio task if not already running."""
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._run_loop())
            print("[CloudDemoGenerator] Background task started successfully.")

    async def stop(self):
        """Stops the background task cleanly during FastAPI shutdown."""
        print("[CloudDemoGenerator] Stopping background task...")
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        print("[CloudDemoGenerator] Background task shutdown complete.")


# Global singleton instance for FastAPI cloud demo mode
cloud_demo_generator = CloudDemoGenerator()
