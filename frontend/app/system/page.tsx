"use client";

import React, { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/TelemetryContext";
import { StatusStrip } from "@/components/StatusStrip";
import { LocalLcdPanel } from "@/components/LocalLcdPanel";
import { fetchAnomalyStatus, AnomalyAssessment } from "@/lib/api";
import {
  Server,
  Radio,
  Database,
  Activity,
  Cpu,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Info,
  BrainCircuit,
  Camera,
  Monitor,
  ScanSearch,
  HardDrive,
} from "lucide-react";

export default function SystemStatusPage() {
  const { health, backendError, isStale, isUnavailable, telemetry } = useTelemetry();
  const [anomalyStatus, setAnomalyStatus] = useState<AnomalyAssessment | null>(null);

  useEffect(() => {
    fetchAnomalyStatus().then((res) => {
      if (res.data) setAnomalyStatus(res.data);
    });
  }, []);

  const isBackendOnline = health && !backendError;
  const isMqttOnline = health?.mqtt_connected ?? false;
  const isMqttRequired = health?.mqtt_required ?? true;
  const isCloudDemo = health?.cloud_demo ?? (health?.data_source === "CLOUD_DEMO");
  const isDbOnline = health?.database_connected ?? false;
  const isAnomalyLoaded = anomalyStatus?.available ?? false;
  const deviceId = telemetry?.device_id || health?.device_id || "ESP32-01";
  const dataSource = health?.data_source || "SIMULATOR";

  const getDataSourceLabel = () => {
    if (isCloudDemo) return "Cloud Synthetic Telemetry";
    if (dataSource === "ESP32") return "Physical ESP32";
    return "Synthetic Simulator";
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">System Infrastructure & Hardware Status</h2>
        <p className="page-desc">Comprehensive status for software backend services, hardware integration endpoints, and edge display modules</p>
      </div>

      <StatusStrip />

      {/* 1. Device Status Card */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={18} className="strip-icon" />
            <h3 className="panel-title">Target Device & Stream Status</h3>
          </div>
          <span className={`strip-badge ${!isStale && telemetry ? "live" : "stale"}`}>
            {!isStale && telemetry ? "Ingestion Live (1 Hz)" : isStale ? "Stream Stale" : "Awaiting Data"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "8px" }}>
          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Device ID</div>
            <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{deviceId}</strong>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Data Source</div>
            <strong style={{ fontSize: "0.95rem", color: "var(--accent-primary)" }}>
              {getDataSourceLabel()}
            </strong>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>MQTT Link</div>
            {!isMqttRequired ? (
              <span className="strip-badge" style={{ display: "inline-block", marginTop: "4px", backgroundColor: "#e2e8f0", color: "#475569" }}>
                NOT REQUIRED
              </span>
            ) : (
              <span className={`strip-badge ${isMqttOnline ? "online" : "offline"}`} style={{ display: "inline-block", marginTop: "4px" }}>
                {isMqttOnline ? "CONNECTED" : "DISCONNECTED"}
              </span>
            )}
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>FastAPI Backend</div>
            <span className={`strip-badge ${isBackendOnline ? "online" : "offline"}`} style={{ display: "inline-block", marginTop: "4px" }}>
              {isBackendOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PostgreSQL DB</div>
            <span className={`strip-badge ${isDbOnline ? "online" : "offline"}`} style={{ display: "inline-block", marginTop: "4px" }}>
              {isDbOnline ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Last Reading</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginTop: "4px" }}>
              {telemetry?.timestamp ? telemetry.timestamp.split("T")[1] || telemetry.timestamp : "None"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SOFTWARE SERVICES SECTION */}
      <section style={{ marginBottom: "24px" }}>
        <div className="panel-header" style={{ marginBottom: "12px" }}>
          <h3 className="panel-title" style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Software Services
          </h3>
        </div>

        <div className="system-grid">
          {/* FastAPI Backend */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">FastAPI Backend</span>
              <Server size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Service URL</span>
                <span className="system-meta-val">http://127.0.0.1:8000</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Health Endpoint</span>
                <span className="system-meta-val">GET /health</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Operational State</span>
                <span className={`strip-badge ${isBackendOnline ? "online" : "offline"}`}>
                  {isBackendOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>

          {/* Mosquitto MQTT Broker */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Mosquitto MQTT Broker</span>
              <Radio size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Host & Port</span>
                <span className="system-meta-val">127.0.0.1:1883</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Telemetry Topic</span>
                <span className="system-meta-val">sih26008/conveyor/ESP32-01/telemetry</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Broker Link</span>
                {!isMqttRequired ? (
                  <span className="strip-badge" style={{ backgroundColor: "#e2e8f0", color: "#475569" }}>
                    Not Required in Cloud Demo Mode
                  </span>
                ) : (
                  <span className={`strip-badge ${isMqttOnline ? "online" : "offline"}`}>
                    {isMqttOnline ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PostgreSQL Database */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">PostgreSQL Database</span>
              <Database size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Port & Database</span>
                <span className="system-meta-val">127.0.0.1:5433 (sih26008)</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Storage Engine</span>
                <span className={`strip-badge ${isDbOnline ? "online" : "offline"}`}>
                  {isDbOnline ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Demo Generator (when Cloud Demo Mode) */}
          {isCloudDemo && (
            <div className="system-card">
              <div className="system-card-header">
                <span className="system-card-title">Cloud Demo Generator</span>
                <Clock size={18} className="strip-icon" />
              </div>
              <div className="system-card-body">
                <div className="system-meta-row">
                  <span className="system-meta-label">Pipeline Mode</span>
                  <span className="system-meta-val">FastAPI Background Generator</span>
                </div>
                <div className="system-meta-row">
                  <span className="system-meta-label">Generator State</span>
                  <span className="strip-badge online">ACTIVE (1 Hz)</span>
                </div>
              </div>
            </div>
          )}

          {/* Condition Assessment Engine */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Condition Engine</span>
              <Activity size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Fusion Model</span>
                <span className="system-meta-val">Heuristic Multi-Sensor</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Engine Status</span>
                <span className={`strip-badge ${isBackendOnline ? "online" : "offline"}`}>
                  {isBackendOnline ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>

          {/* Isolation Forest Anomaly Engine */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Anomaly Engine</span>
              <BrainCircuit size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Pipeline</span>
                <span className="system-meta-val">Isolation Forest</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Model State</span>
                <span className={`strip-badge ${isAnomalyLoaded ? "online" : "offline"}`}>
                  {isAnomalyLoaded ? "LOADED" : "UNAVAILABLE"}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Support Engine */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Decision Support Engine</span>
              <ScanSearch size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Evidence Fusion</span>
                <span className="system-meta-val">Explainable Diagnostics</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Engine State</span>
                <span className={`strip-badge ${isBackendOnline ? "online" : "offline"}`}>
                  {isBackendOnline ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HARDWARE / EDGE INTEGRATION SECTION */}
      <section style={{ marginBottom: "24px" }}>
        <div className="panel-header" style={{ marginBottom: "12px" }}>
          <h3 className="panel-title" style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Hardware / Edge Integration
          </h3>
        </div>

        <div className="system-grid">
          {/* Telemetry Device */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Telemetry Device</span>
              <Cpu size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Designated Device</span>
                <span className="system-meta-val">ESP32-01</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Topic</span>
                <span className="system-meta-val">sih26008/conveyor/ESP32-01/telemetry</span>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Data Source</span>
              <HardDrive size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Source Mode</span>
                <span className="system-meta-val" style={{ color: "var(--accent-primary)", fontWeight: 700 }}>
                  {getDataSourceLabel()}
                </span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Scenario</span>
                <span className="system-meta-val">{telemetry?.scenario || "NORMAL"}</span>
              </div>
            </div>
          </div>

          {/* Physical ESP32 Connection */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">ESP32 Hardware</span>
              <Radio size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Physical Hardware</span>
                <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.825rem" }}>Not Connected</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Ingestion Link</span>
                <span className="system-meta-val">
                  {isCloudDemo ? "Direct FastAPI Pipeline" : "Simulator via MQTT"}
                </span>
              </div>
            </div>
          </div>

          {/* Camera Inspection */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Inspection Camera</span>
              <Camera size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Camera Feed</span>
                <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.825rem" }}>Not Connected</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">CV Engine</span>
                <span className="system-meta-val">Not Enabled (Planned)</span>
              </div>
            </div>
          </div>

          {/* Local LCD Display */}
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Local Edge Display</span>
              <Monitor size={18} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Physical LCD</span>
                <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.825rem" }}>Not Connected</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Web Preview</span>
                <span className="strip-badge online">{isCloudDemo ? "Preview Only" : "Active"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Embedded Local Edge LCD Representation */}
      <LocalLcdPanel compact={false} />

      {/* 5. Scientific Transparency Disclosure */}
      <div className="card-panel" style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid var(--accent-primary)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Data Provenance & Deployment Operating Modes
            </div>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
              {isCloudDemo
                ? "The platform is currently operating in PUBLIC CLOUD DEMO MODE. FastAPI generates continuous synthetic baseline telemetry routed directly through all backend intelligence engines. For physical deployment, set CLOUD_DEMO=false and DATA_SOURCE=ESP32."
                : "The software architecture is fully hardware-ready. To transition from SIMULATOR to REAL HARDWARE mode, stop the Python MQTT simulator script and power on an ESP32 publishing valid JSON telemetry to sih26008/conveyor/ESP32-01/telemetry. No backend REST API or frontend dashboard code changes are required."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

