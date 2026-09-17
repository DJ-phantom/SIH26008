"use client";

import React from "react";
import { useTelemetry } from "@/lib/TelemetryContext";
import { Database, Server, Radio, Clock } from "lucide-react";

export const StatusStrip: React.FC = () => {
  const { health, backendError, isStale, isUnavailable, telemetry, isLoading } = useTelemetry();

  const getBackendStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (backendError || !health) return { label: "Offline", state: "offline" };
    return { label: "Online", state: "online" };
  };

  const getMqttStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (!health || backendError) return { label: "Offline", state: "offline" };
    return health.mqtt_connected
      ? { label: "Online", state: "online" }
      : { label: "Offline", state: "offline" };
  };

  const getDbStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (!health || backendError) return { label: "Offline", state: "offline" };
    return health.database_connected
      ? { label: "Online", state: "online" }
      : { label: "Offline", state: "offline" };
  };

  const getStreamStatus = () => {
    if (backendError) return { label: "Backend Offline", state: "offline" };
    if (isUnavailable || !telemetry) return { label: "Waiting Stream", state: "checking" };
    if (isStale) return { label: "STALE (Paused)", state: "stale" };
    return { label: "LIVE (1 Hz)", state: "live" };
  };

  const backend = getBackendStatus();
  const mqtt = getMqttStatus();
  const db = getDbStatus();
  const stream = getStreamStatus();

  return (
    <div className="status-strip" role="region" aria-label="System Connectivity Strip">
      <div className="strip-item">
        <Server size={14} className="strip-icon" />
        <span className="strip-label">FastAPI:</span>
        <span className={`strip-badge ${backend.state}`}>{backend.label}</span>
      </div>

      <div className="strip-item">
        <Radio size={14} className="strip-icon" />
        <span className="strip-label">Mosquitto MQTT:</span>
        <span className={`strip-badge ${mqtt.state}`}>{mqtt.label}</span>
      </div>

      <div className="strip-item">
        <Database size={14} className="strip-icon" />
        <span className="strip-label">PostgreSQL:</span>
        <span className={`strip-badge ${db.state}`}>{db.label}</span>
      </div>

      <div className="strip-item">
        <span className="strip-label">Stream:</span>
        <span className={`strip-badge ${stream.state}`}>{stream.label}</span>
      </div>

      {telemetry && (
        <div className="strip-item timestamp-item">
          <Clock size={14} className="strip-icon" />
          <span className="strip-label">Timestamp:</span>
          <span className="strip-mono">{telemetry.timestamp}</span>
        </div>
      )}
    </div>
  );
};
