# SRIJAN • SIH26008 — SIH Demo Control Cheatsheet

Quick reference guide for live scenario control during judge presentations and software demonstrations.

---

## Startup Sequence

1. **PostgreSQL Database**:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\SIH26008\database\pgdata" -p 5433
   ```
2. **Mosquitto MQTT Broker**:
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto.exe" -v
   ```
3. **FastAPI Backend**:
   ```powershell
   .\venv\Scripts\python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
4. **Telemetry Publisher (Starting Baseline)**:
   ```powershell
   .\venv\Scripts\python -u simulator/mqtt_publisher.py --scenario NORMAL
   ```
5. **Next.js Dashboard**:
   ```powershell
   cd frontend
   npm run dev
   ```

---

## Live Demo Controller Usage

Launch the private terminal controller in a separate window to trigger live scenario transitions **without restarting the telemetry publisher**:

### 1. Interactive Controller
```powershell
.\venv\Scripts\python tools/demo_controller.py
```
- Option `1`: `NORMAL`
- Option `2`: `HIGH_VIBRATION`
- Option `3`: `MOTOR_OVERLOAD`
- Option `4`: `BELT_MISALIGNMENT`
- Option `5`: `SPLICE_DEGRADATION`
- Option `R`: Reset to `NORMAL`
- Option `Q`: Quit

### 2. Direct CLI Command Mode
```powershell
# Trigger High Vibration
.\venv\Scripts\python tools/demo_controller.py HIGH_VIBRATION

# Trigger Motor Overload
.\venv\Scripts\python tools/demo_controller.py MOTOR_OVERLOAD

# Trigger Belt Misalignment
.\venv\Scripts\python tools/demo_controller.py BELT_MISALIGNMENT

# Trigger Splice Degradation
.\venv\Scripts\python tools/demo_controller.py SPLICE_DEGRADATION

# Reset to NORMAL
.\venv\Scripts\python tools/demo_controller.py NORMAL
```

---

## Recommended Presentation Flow (2-Minute Demo)

1. **Baseline**: Start publisher in `NORMAL`. Show Overview dashboard (all 5 condition/intelligence indicators report `NORMAL` / `HIGH` agreement).
2. **Fault Demonstration**: Run `python tools/demo_controller.py HIGH_VIBRATION`.
   - Observe vibration gradually rise over ~15 seconds.
   - Point out active `Critical Vibration Alert` on Overview & Alerts page.
   - Show `Overall Belt Condition` rise to `CRITICAL`.
   - Show `Prototype Splice Risk Index` increase.
   - Show `AI Pattern Monitor` switch to `ANOMALOUS PATTERN`.
   - Navigate to `/decision-support` to highlight aggregated multi-system evidence & suggested inspection actions.
3. **Recovery**: Run `python tools/demo_controller.py NORMAL`.
   - Observe telemetry values progressively return to baseline.
   - Alerts automatically resolve after recovery hysteresis window.
   - Decision support returns to `NORMAL`.
