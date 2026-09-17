import React from "react";
import Link from "next/link";
import { TelemetryData } from "@/lib/api";
import {
  Thermometer,
  Activity,
  Zap,
  Gauge,
  MoveHorizontal,
  Weight,
  ChevronRight,
} from "lucide-react";

interface TelemetryCardsProps {
  telemetry: TelemetryData | null;
  isStale: boolean;
  isUnavailable: boolean;
  error: string | null;
  isLoading: boolean;
  compact?: boolean;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  telemetry,
  isStale,
  isUnavailable,
  error,
  isLoading,
  compact = false,
}) => {
  if (isLoading && !telemetry) {
    return (
      <div className="state-panel">
        <h3>Connecting to Telemetry Pipeline...</h3>
        <p>Polling live telemetry from 127.0.0.1:8000/api/telemetry/latest</p>
      </div>
    );
  }

  if (error && !telemetry) {
    return (
      <div className="state-panel error-panel">
        <h3 style={{ color: "var(--status-offline)" }}>Backend Offline</h3>
        <p>Unable to retrieve telemetry stream. Ensure the FastAPI backend is running.</p>
      </div>
    );
  }

  if (isUnavailable || !telemetry) {
    return (
      <div className="state-panel waiting-panel">
        <h3>Waiting for Telemetry Stream...</h3>
        <p>Backend is active. Please start the synthetic sensor MQTT publisher (<code>python simulator/mqtt_publisher.py</code>).</p>
      </div>
    );
  }

  const cards = [
    {
      key: "temperature",
      name: "Temperature",
      value: telemetry.temperature.toFixed(1),
      unit: "°C",
      demoRange: "Normal baseline: 38.0 – 44.0 °C",
      icon: Thermometer,
    },
    {
      key: "vibration",
      name: "Vibration",
      value: telemetry.vibration.toFixed(2),
      unit: "g",
      demoRange: "Normal baseline: 0.20 – 0.35 g",
      icon: Activity,
    },
    {
      key: "current",
      name: "Motor Current",
      value: telemetry.current.toFixed(2),
      unit: "A",
      demoRange: "Normal baseline: 3.80 – 4.50 A",
      icon: Zap,
    },
    {
      key: "speed",
      name: "Belt Speed",
      value: telemetry.speed.toFixed(2),
      unit: "m/s",
      demoRange: "Normal baseline: 1.70 – 1.90 m/s",
      icon: Gauge,
    },
    {
      key: "alignment",
      name: "Alignment",
      value: telemetry.alignment >= 0 ? `+${telemetry.alignment.toFixed(1)}` : telemetry.alignment.toFixed(1),
      unit: "mm",
      demoRange: "Normal baseline: -2.0 – +2.0 mm",
      icon: MoveHorizontal,
    },
    {
      key: "load",
      name: "Load",
      value: telemetry.load.toFixed(1),
      unit: "%",
      demoRange: "Normal baseline: 50.0 – 70.0 %",
      icon: Weight,
    },
  ];

  return (
    <div className={`telemetry-cards-grid ${compact ? "compact" : "prominent"}`}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.key}
            href={`/live/${card.key}`}
            className="telemetry-card telemetry-card-link"
            aria-label={`View historical trend for ${card.name}`}
          >
            <div className="card-top">
              <div className="card-title-group">
                <Icon size={16} className="card-metric-icon" />
                <span className="metric-name">{card.name}</span>
              </div>
              <div className="card-status-group">
                <span className={`stream-pill ${isStale ? "stale" : "live"}`}>
                  {isStale ? "STALE" : "LIVE"}
                </span>
                <ChevronRight size={14} className="card-link-arrow" />
              </div>
            </div>

            <div className="card-value-box">
              <span className="metric-val">{card.value}</span>
              <span className="metric-unit">{card.unit}</span>
            </div>

            <div className="card-bottom">
              <span className="demo-range-text">{card.demoRange}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

