# SIH26008: Intelligent Conveyor Belt Health Monitoring System

## Overview
SIH26008 is an intelligent conveyor belt health and splice health monitoring system designed for real-time telemetry processing, PostgreSQL persistence, deterministic condition evaluation, multi-sensor condition assessment, predictive maintenance, anomaly detection, unified decision support, and real hardware demonstration readiness.

## Current Development Stage
- **Stage**: Step 14 — Hardware Demonstration Readiness & System Connectivity
- **Status**: Completed hardware demonstration readiness layer. System is prepared for real ESP32 microcontrollers, local LCD edge displays, and camera inspection pipelines. System status (`/system`) features clean separation into **SOFTWARE SERVICES** and **HARDWARE / EDGE** sections with device status reporting (`data_source`, `device_id`, telemetry stream state, MQTT link, DB link). Features a realistic Local LCD Edge Display preview (`/local-display`), updated optical camera inspection page (`/camera`) with architectural flowcharts, and compact hardware summary on Overview.

---

## Architecture Flow
```text
Data Source Layer (Simulator OR Real Physical ESP32)
        ↓  [Topic: sih26008/conveyor/ESP32-01/telemetry]
Mosquitto MQTT Broker (Port 1883)
        ↓
FastAPI Backend (Port 8000)
        ↓
PostgreSQL Telemetry Ingestion (Port 5433: telemetry table)
        ├── Rule-Based Condition & Alert Engine (backend/alert_engine.py)
        │       ↓ PostgreSQL Alert Persistence (alerts table) -> REST Alert APIs -> Next.js /alerts
        │
        ├── Multi-Sensor Condition Assessment Engine (backend/condition_engine.py)
        │       ↓ 20-sample rolling numerical window -> Piecewise Linear Risk & Weighted Fusion
        │
        ├── Isolation Forest Anomaly Engine (backend/anomaly_engine.py)
        │       ↓ Exact 6-Feature Numerical Vector -> Isolation Forest Inference & Calibration
        │
        └── Step 13 Decision Support Engine (backend/decision_support.py)
                ↓ Level (NORMAL/ATTENTION/WARNING/CRITICAL) + Evidence Agreement + Action Mapping
                ↓
    REST API + Next.js Dashboard + Local LCD Preview + Camera Inspection Framework
```

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
