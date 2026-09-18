# SRIJAN • SIH26008: Intelligent Conveyor Belt Health Monitoring System

## Overview
SIH26008 is an intelligent conveyor belt health and splice health monitoring system designed for real-time telemetry processing, PostgreSQL persistence, deterministic condition evaluation, multi-sensor condition assessment, predictive maintenance, anomaly detection, unified decision support, real hardware demonstration readiness, and live private demo control.

## Current Development Stage
- **Stage**: Step 16 — Live Private Demo Control & Live Scenario Switching
- **Status**: Complete live private demo control architecture (`tools/demo_controller.py`). Allows developers/presenters to trigger live scenario transitions (`NORMAL`, `HIGH_VIBRATION`, `MOTOR_OVERLOAD`, `BELT_MISALIGNMENT`, `SPLICE_DEGRADATION`) over MQTT topic `sih26008/control/scenario` without restarting the telemetry publisher or adding public buttons to the judge dashboard.

---

## Architecture Flow
```text
Private Demo Controller (tools/demo_controller.py)
        ↓  [Topic: sih26008/control/scenario]
Mosquitto MQTT Broker (Port 1883)
        ↓
Running Telemetry Publisher (mqtt_publisher.py) -> Live Smooth Scenario Transition
        ↓  [Topic: sih26008/conveyor/ESP32-01/telemetry]
FastAPI Backend (Port 8000)
        ↓
PostgreSQL Telemetry Ingestion (Port 5433: telemetry table)
        ├── Rule-Based Condition & Alert Engine (backend/alert_engine.py)
        ├── Multi-Sensor Condition Assessment Engine (backend/condition_engine.py)
        ├── Isolation Forest Anomaly Engine (backend/anomaly_engine.py)
        └── Step 13 Decision Support Engine (backend/decision_support.py)
                ↓
    REST API + SRIJAN Next.js Dashboard + Local LCD Preview
```

---

## SIH Demo Control & Live Scenario Switching

To switch demonstration scenarios live without restarting the telemetry publisher:

### 1. Launch Interactive Demo Controller
```powershell
.\venv\Scripts\python tools/demo_controller.py
```
Press `1` to `5` to select scenarios, `R` to reset to `NORMAL`, or `Q` to quit.

### 2. Direct Command Mode (CLI Scripting)
```powershell
.\venv\Scripts\python tools/demo_controller.py HIGH_VIBRATION
.\venv\Scripts\python tools/demo_controller.py MOTOR_OVERLOAD
.\venv\Scripts\python tools/demo_controller.py BELT_MISALIGNMENT
.\venv\Scripts\python tools/demo_controller.py SPLICE_DEGRADATION
.\venv\Scripts\python tools/demo_controller.py NORMAL
```
> See [`docs/demo-cheatsheet.md`](file:///c:/SIH26008/docs/demo-cheatsheet.md) for the complete presentation guide.

---

## Demo Setup & Startup Order

To launch the platform for demonstration, follow this exact startup sequence:

### Startup Sequence
1. **PostgreSQL Database** (Port 5433)
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\SIH26008\database\pgdata" -p 5433
   ```
2. **Mosquitto MQTT Service** (Port 1883)
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto.exe" -v
   ```
3. **FastAPI Backend Application** (Port 8000)
   ```powershell
   .\venv\Scripts\python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
4. **Telemetry Data Source** (Simulator Mode OR Real ESP32 Hardware)
   - **Simulator Mode (Default)**:
     ```powershell
     .\venv\Scripts\python -u simulator/mqtt_publisher.py --scenario NORMAL
     ```
   - **Real Hardware Mode**:
     Stop simulator. Power on physical ESP32 flashed with firmware publishing standard telemetry JSON to `sih26008/conveyor/ESP32-01/telemetry`.
5. **Next.js Frontend Dashboard** (Port 3000)
   ```powershell
   cd frontend
   npm run dev
   ```

---

## Simulator Mode vs. Real ESP32 Hardware Replacement

| Feature | Simulator Mode | Real ESP32 Hardware Mode |
| :--- | :--- | :--- |
| **Data Source** | Python `simulator/mqtt_publisher.py` | Physical ESP32 Microcontroller |
| **MQTT Topic** | `sih26008/conveyor/ESP32-01/telemetry` | `sih26008/conveyor/ESP32-01/telemetry` |
| **Backend Code** | No change required | No change required |
| **Database Schema** | No change required | No change required |
| **Dashboard UI** | Data Source: `SIMULATOR` | Data Source: `ESP32` |

### Telemetry JSON Schema Expectation
Both simulator and physical ESP32 publish identical JSON payloads every 1 second:
```json
{
  "device_id": "ESP32-01",
  "timestamp": "2026-09-18T05:10:04.123456Z",
  "scenario": "NORMAL",
  "temperature": 41.2,
  "vibration": 0.28,
  "current": 4.1,
  "speed": 1.81,
  "alignment": 0.5,
  "load": 450.0
}
```

---

## Hardware Integration Components

### 1. Local Edge LCD Display (`/local-display`)
- Displays simulated physical 20x4 character LCD screen as mounted on on-site conveyor enclosures.
- Values are driven **100% by live backend telemetry and condition data** (temperature, vibration, current, speed, belt condition, splice condition).
- Features automatic `STALE` handling when telemetry stream pauses.
- Dual-stream architecture: ESP32 drives local SPI/I2C LCD panel for on-site operators while publishing MQTT telemetry for remote dashboard monitoring.

### 2. Optical Camera Inspection (`/camera`)
- Truthful disclosure: Inspection Camera Hardware: `Not Connected`, Stream: `Unavailable`, CV Engine: `Not Enabled`.
- **Zero fake video, zero fake YOLO bounding boxes**.
- Planned Ingestion Pipeline: `Inspection Camera` → `Frame Capture` → `OpenCV CV Pipeline` → `Visible Belt / Splice Defect Analysis` → `Dashboard Event`.

---

## REST Endpoints
- `GET /` — Service status
- `GET /health` — Connectivity check (`status`, `mqtt_connected`, `database_connected`, `data_source`, `device_id`, `telemetry_topic`)
- `GET /api/telemetry/latest` — Live in-memory telemetry reading
- `GET /api/telemetry/history?limit=120` — Historical telemetry from PostgreSQL
- `GET /api/telemetry/count` — Total persisted telemetry records count
- `GET /api/alerts/active` — Currently active condition alerts
- `GET /api/alerts/history?limit=50` — Historical alert events (active and resolved)
- `GET /api/alerts/count` — Active and total alert counts
- `GET /api/condition/summary` — Multi-sensor condition summary
- `GET /api/anomaly/status` — Isolation Forest anomaly assessment
- `GET /api/decision-support/summary` — Step 13 Unified Decision Support diagnostic summary

---

## Interactive 3D Engineering Visualization

- **Route**: Available under `/digital-belt/3d` (accessible via CTA on `/digital-belt`).
- **Description**: Standalone Three.js 3D engineering visualization representing conveyor mechanical structure, splice monitoring points, troughing idlers, motor drive assembly, and multi-sensor layout concepts.
- **Backend Independence**: The 3D viewer runs as a isolated WebGL client-side asset. Internal 3D fault simulation controls (`Simulate Fault`, `Break Belt`, `Repair`) are local animation controls and **do not modify live FastAPI backend telemetry, MQTT data, or PostgreSQL alert records**.

