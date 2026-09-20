import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["CLOUD_DEMO"] = "true"
os.environ["DATA_SOURCE"] = "CLOUD_DEMO"

from backend.cloud_demo import CloudDemoGenerator
from backend.config import CLOUD_DEMO, DATA_SOURCE, get_data_source_mode
from backend.db import check_db_connection, get_telemetry_count, init_db
from backend.telemetry_processor import get_latest_telemetry


async def run_test():
    print("=== Testing STEP 18A Public Cloud Demo Mode ===")
    print(f"CLOUD_DEMO env: {CLOUD_DEMO}")
    print(f"DATA_SOURCE env: {DATA_SOURCE}")
    print(f"Data Source Mode: {get_data_source_mode()}")

    assert CLOUD_DEMO is True, "CLOUD_DEMO must be True"
    assert DATA_SOURCE == "CLOUD_DEMO", "DATA_SOURCE must be CLOUD_DEMO"
    assert get_data_source_mode() == "Cloud Synthetic Telemetry"

    # Initialize DB
    init_db()
    initial_count = get_telemetry_count()
    print(f"Initial DB telemetry count: {initial_count}")

    generator = CloudDemoGenerator(publish_interval=0.5)
    generator.start()

    print("Waiting 3 seconds for cloud generator telemetry iterations...")
    await asyncio.sleep(3.0)

    await generator.stop()

    new_count = get_telemetry_count()
    latest = get_latest_telemetry()

    print(f"New DB telemetry count: {new_count}")
    print(f"Latest telemetry timestamp: {latest.timestamp if latest else None}")
    print(f"Latest scenario: {latest.scenario if latest else None}")

    assert new_count > initial_count, "Database count should have increased"
    assert latest is not None, "Latest telemetry should be cached"
    assert latest.scenario == "NORMAL", "Cloud demo scenario should be NORMAL"

    print("[SUCCESS] Cloud Demo Generator test PASSED successfully!")


if __name__ == "__main__":
    asyncio.run(run_test())
