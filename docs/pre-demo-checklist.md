# SRIJAN • SIH26008 — Pre-Demo Checklist

Pre-presentation verification checklist to guarantee 100% platform readiness before SIH judge demonstrations.

---

## 1. Startup & Subsystem Verification

- [ ] **PostgreSQL Database** running on port 5433 (`pgdata` cluster active)
- [ ] **Mosquitto MQTT Broker** running on port 1883
- [ ] **FastAPI Backend Application** running on port 8000 (`http://127.0.0.1:8000/health` returns `status: ok`)
- [ ] **Telemetry Publisher** running (`python simulator/mqtt_publisher.py --scenario NORMAL`)
- [ ] **Next.js Frontend Dashboard** running on port 3000 (`http://localhost:3000`)

---

## 2. Automated System Smoke Check

Run the automated system smoke test before judge review:
```powershell
.\venv\Scripts\python tools/system_smoke_test.py
```
- [ ] All 8 subsystem checks report `[PASS]`
- [ ] Terminal outputs `SYSTEM READY FOR DEMO`

---

## 3. Dashboard Visual & Operational Inspection

- [ ] Overview dashboard header shows:
  - Team Brand: **SRIJAN**
  - Problem Reference: `SIH26008`
  - Data Source: `[ Prototype • Synthetic Telemetry ]`
  - Active Scenario: `[ Scenario: NORMAL ]`
  - Software Status: `[ Platform Online ]`
- [ ] First Viewport Condition Grid:
  - **Overall Belt Condition**: `NORMAL` (Risk Index ~13 / 100)
  - **Monitored Splice S1**: `NORMAL` (Splice Risk ~11 / 100)
  - **Decision Assessment**: `NORMAL` (Evidence Agreement: `HIGH`)
  - **Active Alerts**: `0 Active`
  - **AI Pattern Monitor**: `NORMAL PATTERN` (Anomaly Index ~8 / 100)
- [ ] Live Telemetry Channels: 6 cards actively updating every second (1 Hz)
- [ ] Browser Console: Clean with zero recurring errors or hydration warnings

---

## 4. Live Demo Control Readiness

- [ ] Demo Controller operational in a separate terminal:
  ```powershell
  .\venv\Scripts\python tools/demo_controller.py
  ```
- [ ] Verify test command execution:
  ```powershell
  .\venv\Scripts\python tools/demo_controller.py HIGH_VIBRATION
  ```
  - Scenario badge changes dynamically to `Scenario: HIGH_VIBRATION`
  - Vibration steps up smoothly on live cards and historical trend chart
  - Decision Support aggregates evidence
- [ ] Verify reset command execution:
  ```powershell
  .\venv\Scripts\python tools/demo_controller.py NORMAL
  ```
  - Telemetry steps back to normal baseline
  - Alerts resolve automatically after recovery window
  - Dashboard returns to `NORMAL` state
