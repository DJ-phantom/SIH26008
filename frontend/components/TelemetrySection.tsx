import React from "react";
import { TelemetryData } from "@/lib/api";

interface TelemetrySectionProps {
  telemetry: TelemetryData | null;
  isStale: boolean;
  isUnavailable: boolean;
  error: string | null;
  isLoading: boolean;
}

export const TelemetrySection: React.FC<TelemetrySectionProps> = ({
  telemetry,
  isStale,
  isUnavailable,
  error,
  isLoading,
}) => {
  if (isLoading && !telemetry) {
    return (
      <section>
        <h2 className="section-title">Live Sensor Telemetry</h2>
        <div className="state-panel">
          <h2>Initializing Telemetry Connection...</h2>
          <p>Connecting to backend at 127.0.0.1:8000</p>
        </div>
      </section>
    );
  }

  if (error && !telemetry) {
    return (
      <section>
        <h2 className="section-title">Live Sensor Telemetry</h2>
        <div className="state-panel error-panel">
          <h2 style={{ color: "var(--status-offline)" }}>Backend Offline</h2>
          <p>Unable to retrieve telemetry stream. Ensure the FastAPI server is running.</p>
        </div>
      </section>
    );
  }

  if (isUnavailable || !telemetry) {
    return (
      <section>
        <h2 className="section-title">Live Sensor Telemetry</h2>
        <div className="state-panel waiting-panel">
          <h2>Waiting for telemetry stream...</h2>
          <p>Backend is active. Please start the MQTT publisher (<code>python simulator/mqtt_publisher.py</code>).</p>
        </div>
      </section>
    );
  }

  const cards = [
    {
      name: "Temperature",
      value: telemetry.temperature.toFixed(1),
      unit: "°C",
      expected: "38.0 – 44.0 °C",
      description: "Sensor bearing temperature",
    },
    {
      name: "Vibration",
      value: telemetry.vibration.toFixed(2),
      unit: "g",
      expected: "0.20 – 0.35 g",
      description: "RMS vibration amplitude",
    },
    {
      name: "Motor Current",
      value: telemetry.current.toFixed(2),
      unit: "A",
      expected: "3.80 – 4.50 A",
      description: "Drive motor phase current",
    },
    {
      name: "Belt Speed",
      value: telemetry.speed.toFixed(2),
      unit: "m/s",
      expected: "1.70 – 1.90 m/s",
      description: "Conveyor linear velocity",
    },
    {
      name: "Alignment",
      value: telemetry.alignment >= 0 ? `+${telemetry.alignment.toFixed(1)}` : telemetry.alignment.toFixed(1),
      unit: "mm",
      expected: "-2.0 – +2.0 mm",
      description: "Lateral belt tracking offset",
    },
    {
      name: "Load",
      value: telemetry.load.toFixed(1),
      unit: "%",
      expected: "50.0 – 70.0 %",
      description: "Conveyor load capacity",
    },
  ];

  return (
    <section aria-labelledby="telemetry-title">
      <div className="telemetry-header-bar">
        <h2 id="telemetry-title" className="section-title" style={{ marginBottom: 0 }}>
          Live Sensor Telemetry
        </h2>
        <div className="stream-meta">
          <span className="timestamp-text">
            Last Reading: <strong>{telemetry.timestamp}</strong>
          </span>
          <span className={`badge ${isStale ? "stale" : "live"}`}>
            <span className="badge-dot" />
            {isStale ? "STALE (Paused)" : "LIVE"}
          </span>
        </div>
      </div>

      <div className="telemetry-grid">
        {cards.map((card) => (
          <div key={card.name} className="telemetry-card">
            <div className="card-top">
              <span className="metric-name">{card.name}</span>
              <span className="metric-range">{card.expected}</span>
            </div>
            <div className="card-value-box">
              <span className="metric-val">{card.value}</span>
              <span className="metric-unit">{card.unit}</span>
            </div>
            <div className="card-bottom">
              <span>{card.description}</span>
              <span style={{ color: "var(--status-online)", fontWeight: 600 }}>Normal</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
