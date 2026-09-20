"use client";

import React from "react";
import { useTelemetry } from "@/lib/TelemetryContext";
import { Database, Server, Radio, Clock } from "lucide-react";

export const StatusStrip: React.FC = () => {
  const { health, backendError, isStale, isUnavailable, telemetry, isLoading } = useTelemetry();

  const getBackendStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking", style: undefined };
    if (backendError || !health) return { label: "Offline", state: "offline", style: undefined };
    return { label: "Online", state: "online", style: undefined };
  };

  const getMqttStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking", style: undefined };
    if (!health || backendError) return { label: "Offline", state: "offline", style: undefined };

    const isCloudDemo = health.cloud_demo ?? (health.data_source === "CLOUD_DEMO");
    const isMqttRequired = health.mqtt_required ?? !isCloudDemo;

    if (isCloudDemo || !isMqttRequired) {
      return { label: "Not Required", state: "neutral", style: { backgroundColor: "#e2e8f0", color: "#475569" } };
    }

    return health.mqtt_connected
      ? { label: "Online", state: "online", style: undefined }
      : { label: "Offline", state: "offline", style: undefined };
  };

  const getDbStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking", style: undefined };
    if (!health || backendError) return { label: "Offline", state: "offline", style: undefined };
    return health.database_connected
      ? { label: "Online", state: "online", style: undefined }
      : { label: "Offline", state: "offline", style: undefined };
  };

  const getStreamStatus = () => {
    if (backendError) return { label: "Backend Offline", state: "offline", style: undefined };
    if (isUnavailable || !telemetry) return { label: "Waiting Stream", state: "checking", style: undefined };
    if (isStale) return { label: "STALE (Paused)", state: "stale", style: undefined };
    return { label: "LIVE (1 Hz)", state: "live", style: undefined };
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
        <span className={`strip-badge ${backend.state}`} style={backend.style}>{backend.label}</span>
      </div>

      <div className="strip-item">
        <Radio size={14} className="strip-icon" />
        <span className="strip-label">Mosquitto MQTT:</span>
        <span className={`strip-badge ${mqtt.state}`} style={mqtt.style}>{mqtt.label}</span>
      </div>

      <div className="strip-item">
        <Database size={14} className="strip-icon" />
        <span className="strip-label">PostgreSQL:</span>
        <span className={`strip-badge ${db.state}`} style={db.style}>{db.label}</span>
      </div>

      <div className="strip-item">
        <span className="strip-label">Stream:</span>
        <span className={`strip-badge ${stream.state}`} style={stream.style}>{stream.label}</span>
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

