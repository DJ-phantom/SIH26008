"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Layers,
  MapPin,
  Activity,
  Cpu,
  ShieldCheck,
  Info,
  Zap,
  Gauge,
  MoveHorizontal,
  Weight,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  Clock,
  Box,
} from "lucide-react";
import { StatusStrip } from "@/components/StatusStrip";
import {
  fetchConditionSummary,
  fetchActiveAlerts,
  fetchLatestTelemetry,
  fetchDecisionSupportSummary,
  ConditionSummary,
  AlertRecord,
  TelemetryData,
  DecisionSummary,
} from "@/lib/api";

function getLevelStyle(level?: string): { bg: string; fg: string; border: string } {
  switch (level) {
    case "NORMAL":
      return { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" };
    case "ATTENTION":
    case "WATCH":
      return { bg: "#fefce8", fg: "#a16207", border: "#fef08a" };
    case "WARNING":
    case "ELEVATED":
      return { bg: "#fff7ed", fg: "#c2410c", border: "#ffedd5" };
    case "CRITICAL":
    case "HIGH":
      return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" };
    default:
      return { bg: "#f8fafc", fg: "#475569", border: "#e2e8f0" };
  }
}

export default function DigitalBeltPage() {
  const [condition, setCondition] = useState<ConditionSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [isBackendOffline, setIsBackendOffline] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);

  const loadDigitalBeltData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [condRes, alertRes, telemRes, decRes] = await Promise.all([
        fetchConditionSummary(),
        fetchActiveAlerts(),
        fetchLatestTelemetry(),
        fetchDecisionSupportSummary(),
      ]);

      if (condRes.error && alertRes.error && telemRes.error) {
        setIsBackendOffline(true);
      } else {
        setIsBackendOffline(false);
        if (condRes.data) setCondition(condRes.data);
        if (alertRes.data) setAlerts(alertRes.data);
        if (telemRes.data) setTelemetry(telemRes.data);
        if (decRes.data) setDecision(decRes.data);
      }
    } catch {
      setIsBackendOffline(true);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadDigitalBeltData();
    const interval = setInterval(loadDigitalBeltData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter alerts by structural association
  const motorAlerts = alerts.filter(
    (a) => a.metric === "current" || a.metric === "temperature"
  );
  const spliceAlerts = alerts.filter((a) => a.metric === "vibration");
  const beltAlerts = alerts.filter(
    (a) => a.metric === "alignment" || a.metric === "speed" || a.metric === "load"
  );

  const overallStyle = getLevelStyle(condition?.overall.level);
  const spliceStyle = getLevelStyle(condition?.splice.level);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="page-title">Digital Belt Representation</h2>
            <p className="page-desc">
              Spatial schematic mapping of conveyor components, monitored splice node, live condition states, and active alert indicators
            </p>
          </div>

          {decision && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: "0.775rem", color: "var(--text-muted)", fontWeight: 600 }}>Decision Assessment:</span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color:
                    decision.level === "CRITICAL"
                      ? "#dc2626"
                      : decision.level === "WARNING"
                      ? "#c2410c"
                      : decision.level === "ATTENTION"
                      ? "#a16207"
                      : "#047857",
                }}
              >
                {decision.level}
              </span>
            </div>
          )}
        </div>
      </div>

      <StatusStrip />

      {/* Backend Offline Banner */}
      {isBackendOffline && (
        <div className="state-panel error-panel" style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "var(--status-offline)" }}>Backend Service Unavailable</h3>
          <p>Unable to retrieve digital belt state. Ensure FastAPI service is online.</p>
        </div>
      )}

      {/* 1. SPATIAL CONVEYOR SCHEMATIC DIAGRAM */}
      <section className="card-panel" aria-labelledby="conveyor-schematic-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers size={20} className="strip-icon" />
            <h3 id="conveyor-schematic-title" className="panel-title">
              Spatial Conveyor Structure Diagram
            </h3>
          </div>
          <span className="strip-badge online">Prototype Reference Schematic</span>
        </div>

        {/* Schematic Container */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "24px 20px",
            marginTop: "12px",
          }}
        >
          {/* Main Conveyor Node Chain */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* NODE 1: Motor Drive Head */}
            <div
              style={{
                flex: "1 1 180px",
                backgroundColor: "#ffffff",
                border: `2px solid ${motorAlerts.length > 0 ? "#dc2626" : "#cbd5e1"}`,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    HEAD SECTION
                  </span>
                  <Zap size={16} style={{ color: motorAlerts.length > 0 ? "#dc2626" : "var(--accent-primary)" }} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Motor Drive Head
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Drive Pulley & Electric Motor
                </p>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                {motorAlerts.length > 0 ? (
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ShieldAlert size={12} /> {motorAlerts.length} Active Drive Alert(s)
                  </div>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>
                    Drive Assembly Nominal
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700 }}>
              ═════
            </div>

            {/* NODE 2: Belt Section A */}
            <div
              style={{
                flex: "1 1 180px",
                backgroundColor: "#ffffff",
                border: `2px solid ${overallStyle.border}`,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    CARRIER SECTION
                  </span>
                  <Cpu size={16} style={{ color: "var(--accent-primary)" }} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Belt Section A
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Node: {condition?.device_id || "ESP32-01"}
                </p>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: overallStyle.bg,
                    color: overallStyle.fg,
                  }}
                >
                  Overall: {condition?.overall.level || "NORMAL"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700 }}>
              ═════
            </div>

            {/* NODE 3: Monitored Splice S1 */}
            <div
              style={{
                flex: "1 1 200px",
                backgroundColor: spliceStyle.bg,
                border: `2px solid ${spliceStyle.fg}`,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: spliceStyle.fg, letterSpacing: "0.5px" }}>
                    PROTOTYPE SPLICE NODE
                  </span>
                  <Activity size={16} style={{ color: spliceStyle.fg }} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Monitored Splice S1
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Reference Joint Node #1
                </p>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: `1px solid ${spliceStyle.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: "#ffffff",
                      color: spliceStyle.fg,
                      border: `1px solid ${spliceStyle.border}`,
                    }}
                  >
                    Splice: {condition?.splice.level || "NORMAL"}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: spliceStyle.fg }}>
                    Risk: {condition?.splice.risk_index ?? 0} / 100
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700 }}>
              ═════
            </div>

            {/* NODE 4: Belt Section B */}
            <div
              style={{
                flex: "1 1 180px",
                backgroundColor: "#ffffff",
                border: "2px solid #cbd5e1",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    RETURN SECTION
                  </span>
                  <MoveHorizontal size={16} style={{ color: "var(--text-muted)" }} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Belt Section B
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Return Run & Tracking
                </p>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                {beltAlerts.length > 0 ? (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d97706" }}>
                    Tracking Warning
                  </span>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Return Path Nominal
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700 }}>
              ═════
            </div>

            {/* NODE 5: Tail Pulley */}
            <div
              style={{
                flex: "1 1 160px",
                backgroundColor: "#ffffff",
                border: "2px solid #cbd5e1",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    TAIL SECTION
                  </span>
                  <MapPin size={16} style={{ color: "var(--text-muted)" }} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Tail Pulley
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Take-Up & Return Assembly
                </p>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>
                  Tail Nominal
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5 INTERACTIVE 3D ENGINEERING MODEL CTA */}
      <section
        className="card-panel"
        style={{
          marginBottom: "24px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          border: "1px solid #334155",
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Box size={22} style={{ color: "#38bdf8" }} />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.5px", color: "#ffffff" }}>
                INTERACTIVE 3D ENGINEERING MODEL
              </h3>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                3D View
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Explore the conveyor structure, monitoring locations and planned sensor network through an interactive engineering visualization.
            </p>
          </div>

          <Link
            href="/digital-belt/3d"
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.2s ease",
            }}
          >
            <Box size={16} />
            <span>Open Interactive 3D Model</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 2. SIDE CONDITION & CONTRIBUTORS GRID */}
      <div className="system-grid" style={{ marginBottom: "24px" }}>
        {/* CURRENT CONDITION SIDE PANEL */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} className="strip-icon" />
              <h3 className="panel-title">Current Condition Summary</h3>
            </div>
            <span className={`strip-badge ${alerts.length > 0 ? "offline" : "online"}`}>
              {alerts.length} Active Alert(s)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <div style={{ padding: "12px 14px", backgroundColor: overallStyle.bg, borderRadius: "6px", border: `1px solid ${overallStyle.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: overallStyle.fg }}>
                  Overall Conveyor Belt
                </span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#ffffff", color: overallStyle.fg }}>
                  {condition?.overall.level || "NORMAL"}
                </span>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: overallStyle.fg, marginTop: "4px" }}>
                Risk Index: {condition?.overall.risk_index ?? 0} / 100
              </div>
            </div>

            <div style={{ padding: "12px 14px", backgroundColor: spliceStyle.bg, borderRadius: "6px", border: `1px solid ${spliceStyle.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: spliceStyle.fg }}>
                  Monitored Splice S1
                </span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#ffffff", color: spliceStyle.fg }}>
                  {condition?.splice.level || "NORMAL"}
                </span>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: spliceStyle.fg, marginTop: "4px" }}>
                Risk Index: {condition?.splice.risk_index ?? 0} / 100
              </div>
            </div>

            <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Telemetry Stream State:</span>
              <strong style={{ color: telemetry ? "#16a34a" : "#dc2626" }}>
                {telemetry ? "LIVE (1 Hz)" : "AWAITING"}
              </strong>
            </div>
          </div>
        </div>

        {/* CONTRIBUTORS PANEL */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} className="strip-icon" />
              <h3 className="panel-title">Prototype Risk Contributors</h3>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
              Overall Belt Contributors
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {condition?.overall.contributors.map((c) => (
                <div key={c.metric} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#f8fafc", borderRadius: "4px", fontSize: "0.8rem" }}>
                  <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{c.metric}</span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span className="strip-mono" style={{ color: "var(--text-muted)" }}>{c.value} {c.unit}</span>
                    <strong style={{ color: c.risk >= 40 ? "#c2410c" : "var(--text-main)" }}>Risk: {c.risk}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
              Splice S1 Contributors
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {condition?.splice.contributors.map((c) => (
                <div key={c.metric} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#f8fafc", borderRadius: "4px", fontSize: "0.8rem" }}>
                  <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{c.metric}</span>
                  <strong style={{ color: c.risk >= 40 ? "#c2410c" : "var(--text-main)" }}>Risk: {c.risk}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPACT LIVE SENSOR SUMMARY */}
      <section className="card-panel" aria-labelledby="compact-telemetry-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <h3 id="compact-telemetry-title" className="panel-title">
            Live Telemetry Measurement Stream
          </h3>
          <span className="strip-badge live">Target: ESP32-01</span>
        </div>

        {telemetry ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "12px" }}>
            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Thermometer size={14} /> Temperature
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.temperature.toFixed(1)} °C
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Activity size={14} /> Vibration
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.vibration.toFixed(2)} g
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Zap size={14} /> Motor Current
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.current.toFixed(2)} A
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Gauge size={14} /> Belt Speed
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.speed.toFixed(2)} m/s
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MoveHorizontal size={14} /> Alignment
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.alignment >= 0 ? `+${telemetry.alignment.toFixed(1)}` : telemetry.alignment.toFixed(1)} mm
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Weight size={14} /> Load
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "4px" }}>
                {telemetry.load.toFixed(1)} %
              </div>
            </div>
          </div>
        ) : (
          <div className="placeholder-box" style={{ padding: "20px" }}>
            <p className="placeholder-text">Awaiting live telemetry packet stream...</p>
          </div>
        )}
      </section>

      {/* 4. PROTOTYPE / FUTURE LOCALIZATION DISCLOSURE */}
      <div
        className="card-panel"
        style={{
          backgroundColor: "#f8fafc",
          borderLeft: "4px solid var(--accent-primary)",
          marginBottom: "24px",
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
              Technical Disclosure — Prototype Spatial Representation & Limitation
            </strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Current digital representation maps condition to configured conveyor components. Exact belt-distance and splice localization will be enabled after encoder-based position tracking is integrated.
            </p>
          </div>
        </div>
      </div>

      {/* 5. FUTURE POSITION LOCALIZATION ARCHITECTURE BLUEPRINT */}
      <section className="card-panel" aria-labelledby="future-arch-title">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} className="strip-icon" />
            <h3 id="future-arch-title" className="panel-title">
              Future Position Localization Architecture
            </h3>
          </div>
          <span className="strip-badge checking">PLANNED / NOT ACTIVE</span>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "8px 0 16px 0" }}>
          Target architectural blueprint for physical distance tracking and meter-level anomaly localization:
        </p>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <div style={{ padding: "10px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
              Encoder Pulses
            </div>
            <ArrowRight size={16} style={{ color: "#94a3b8" }} />
            <div style={{ padding: "10px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
              Belt Travel Distance
            </div>
            <ArrowRight size={16} style={{ color: "#94a3b8" }} />
            <div style={{ padding: "10px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
              Known Splice Reference
            </div>
            <ArrowRight size={16} style={{ color: "#94a3b8" }} />
            <div style={{ padding: "10px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
              Sensor / Camera Event
            </div>
            <ArrowRight size={16} style={{ color: "#94a3b8" }} />
            <div style={{ padding: "10px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "var(--accent-primary)" }}>
              Localized Fault Position
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
