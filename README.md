# SRIJAN • SIH26008: Intelligent Conveyor Belt Health Monitoring System

## Overview
SIH26008 is an intelligent conveyor belt health and splice health monitoring system designed for real-time telemetry processing, PostgreSQL persistence, deterministic condition evaluation, multi-sensor condition assessment, predictive maintenance, anomaly detection, unified decision support, real hardware demonstration readiness, and public cloud demo mode.

## Current Development Stage
- **Stage**: Step 18A — Public Cloud Demo Mode for Backend
- **Status**: Complete public cloud demo generator (`backend/cloud_demo.py`) and shared backend processing pipeline (`backend/telemetry_processor.py`). Allows deployed FastAPI backend to stream continuous synthetic telemetry directly into the intelligence engine pipeline without requiring Mosquitto or external publishers.

---

## Operating Modes: Local vs. Public Cloud Demo

The platform supports two official execution modes:

### 1. LOCAL / HARDWARE MODE (`CLOUD_DEMO=false`)

Used for local development, physical prototype testing, and live private presentation.

```text
ESP32 Microcontroller OR simulator/mqtt_publisher.py
        ↓  [Topic: sih26008/conveyor/ESP32-01/telemetry]
Mosquitto MQTT Broker (Port 1883)
        ↓
FastAPI Backend (Port 8000)
        ↓
Shared Telemetry Processor (backend/telemetry_processor.py)
        ├── PostgreSQL Telemetry Table
        ├── Rule-Based Alert Engine
        ├── Multi-Sensor Condition Assessment Engine
        ├── Isolation Forest Anomaly Engine
        └── Step 13 Decision Support Engine
```

- **Environment Settings**:
  ```env
  CLOUD_DEMO=false
  DATA_SOURCE=SIMULATOR   # or ESP32 for physical hardware
  ```

---

### 2. PUBLIC CLOUD DEMO MODE (`CLOUD_DEMO=true`)

Designed for public deployment (e.g. Render, Railway, Vercel). Automatically generates continuous synthetic baseline telemetry (`NORMAL` scenario) inside FastAPI so the public dashboard remains interactive when judges open the PPT link without requiring local Mosquitto or active terminal scripts.

```text
FastAPI Cloud Generator (backend/cloud_demo.py)
        ↓
Shared Telemetry Processor (backend/telemetry_processor.py)
        ├── PostgreSQL Telemetry Table (or hosted Neon/Supabase DB)
        ├── Rule-Based Alert Engine
        ├── Multi-Sensor Condition Assessment Engine
        ├── Isolation Forest Anomaly Engine
        └── Step 13 Decision Support Engine
```

- **Environment Settings**:
  ```env
  CLOUD_DEMO=true
  DATA_SOURCE=CLOUD_DEMO
  DATABASE_URL=postgresql://user:pass@hosted-db.neon.tech/sih26008?sslmode=require
  FRONTEND_ORIGINS=https://sih26008-dashboard.vercel.app
  ```

> **Key Guarantee**: In Cloud Demo Mode, telemetry is generated using the exact same `ConveyorSensorSimulator` and routed through the exact same processing pipeline as real telemetry. No fake sensor values are hardcoded in the frontend.

---

## SIH Private Demo Control & Live Scenario Switching

For live hardware/local presentations where fault scenario injection is desired:

### Launch Interactive Demo Controller
```powershell
.\venv\Scripts\python tools/demo_controller.py
```
Press `1` to `5` to select scenarios (`NORMAL`, `HIGH_VIBRATION`, `MOTOR_OVERLOAD`, `BELT_MISALIGNMENT`, `SPLICE_DEGRADATION`), `R` to reset to `NORMAL`, or `Q` to quit.

---

## Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CLOUD_DEMO` | `false` | Enable backend synthetic telemetry generator for public cloud hosting |
| `DATA_SOURCE` | `SIMULATOR` | Data source disclosure label (`SIMULATOR`, `ESP32`, `CLOUD_DEMO`) |
| `DATABASE_URL` | None | Hosted PostgreSQL connection URI (takes precedence over PGHOST/PGPORT) |
| `PGHOST` | `127.0.0.1` | Local PostgreSQL host |
| `PGPORT` | `5433` | Local PostgreSQL port |
| `PGDATABASE` | `sih26008` | Local PostgreSQL database name |
| `PGUSER` | `postgres` | Local PostgreSQL user |
| `PGPASSWORD` | `postgres` | Local PostgreSQL password |
| `FRONTEND_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allowed origins |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Frontend API backend endpoint URL |

---

## Production Startup Command

To run the backend on a generic Linux/Cloud Python host:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

---

## REST Endpoints
- `GET /` — Service status & cloud mode indicator
- `GET /health` — Connectivity check (`status`, `mqtt_connected`, `mqtt_required`, `database_connected`, `cloud_demo`, `data_source`, `data_source_mode`)
- `GET /api/telemetry/latest` — Live in-memory telemetry reading
- `GET /api/telemetry/history?limit=120` — Historical telemetry from PostgreSQL
- `GET /api/telemetry/count` — Total persisted telemetry records count
- `GET /api/alerts/active` — Currently active condition alerts
- `GET /api/alerts/history?limit=50` — Historical alert events (active and resolved)
- `GET /api/alerts/count` — Active and total alert counts
- `GET /api/condition/summary` — Multi-sensor condition summary
- `GET /api/anomaly/status` — Isolation Forest anomaly assessment
- `GET /api/decision-support/summary` — Unified Decision Support diagnostic summary

---

## Interactive 3D Engineering Visualization

- **Route**: `/digital-belt/3d` (accessible via CTA on `/digital-belt`).
- **Description**: Standalone Three.js WebGL engineering visualization representing conveyor mechanical structure, splice monitoring points, idlers, and multi-sensor layout.
