"use client";

import React from "react";
import { useTelemetry } from "@/lib/TelemetryContext";
import { StatusStrip } from "@/components/StatusStrip";
import { TelemetryCards } from "@/components/TelemetryCards";

export default function LiveMonitoringPage() {
  const { telemetry, isStale, isUnavailable, backendError, isLoading } = useTelemetry();

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Live Sensor Monitoring</h2>
        <p className="page-desc">Real-time conveyor physical parameter streams from target device ESP32-01</p>
      </div>

      <StatusStrip />

      <section aria-labelledby="live-metrics-title">
        <div className="panel-header">
          <h3 id="live-metrics-title" className="panel-title">
            Sensor Channels (1 Hz Ingestion)
          </h3>
          <span className="strip-mono">
            {telemetry ? `Updated: ${telemetry.timestamp}` : "Awaiting Data"}
          </span>
        </div>

        <TelemetryCards
          telemetry={telemetry}
          isStale={isStale}
          isUnavailable={isUnavailable}
          error={backendError}
          isLoading={isLoading}
          compact={false}
        />
      </section>

      <div className="card-panel">
        <div className="panel-header">
          <h3 className="panel-title">Channel Sampling Information</h3>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Ingestion Protocol</span>
          <span className="system-meta-val">MQTT (Topic: sih26008/conveyor/ESP32-01/telemetry)</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Transport Cadence</span>
          <span className="system-meta-val">1000 ms (1.0 Hz)</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Validation Engine</span>
          <span className="system-meta-val">Pydantic TelemetryData Schema (FastAPI)</span>
        </div>
      </div>
    </div>
  );
}
