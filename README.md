# SIH26008: Intelligent Conveyor Belt Health Monitoring System

## Overview
SIH26008 is an intelligent conveyor belt health and splice health monitoring system designed for real-time telemetry processing, predictive maintenance, and anomaly detection.

## Current Development Stage
- **Stage**: Step 2 - MQTT Telemetry Transport
- **Status**: Synthetic sensor simulator publishes real-time telemetry to a local Mosquitto MQTT broker.

## Prerequisites
- Python 3.8+
- Mosquitto MQTT Broker

### Setup
```bash
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

## MQTT Configuration
- **Broker**: `localhost:1883`
- **Topic**: `sih26008/conveyor/ESP32-01/telemetry`

## Running

### 1. Start Mosquitto Broker
```bash
mosquitto -v
```
*(Or ensure the Windows Mosquitto service is running: `net start mosquitto`)*

### 2. Start Subscriber Terminal
```bash
mosquitto_sub -h localhost -p 1883 -t "sih26008/conveyor/ESP32-01/telemetry" -v
```

### 3. Run MQTT Publisher
```bash
.\venv\Scripts\python simulator/mqtt_publisher.py
```
*(Or `python simulator/sensor_simulator.py` for direct terminal-only output)*
