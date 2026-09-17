"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTelemetry } from "@/lib/TelemetryContext";
import { StatusStrip } from "@/components/StatusStrip";
import { TelemetryCards } from "@/components/TelemetryCards";
import {
  fetchActiveAlerts,
  fetchConditionSummary,
  fetchAnomalyStatus,
  fetchDecisionSupportSummary,
  AlertRecord,
  ConditionSummary,
  AnomalyAssessment,
  DecisionSummary,
} from "@/lib/api";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Activity,
  Layers,
  Info,
  Clock,
  BrainCircuit,
  ScanSearch,
  Cpu,
  Monitor,
  Camera,
  Radio,
} from "lucide-react";

function getOverallBadgeColor(level: string): { bg: string; fg: string; border: string } {
  switch (level) {
    case "NORMAL":
      return { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" };
    case "ATTENTION":
      return { bg: "#fefce8", fg: "#a16207", border: "#fef08a" };
    case "WARNING":
      return { bg: "#fff7ed", fg: "#c2410c", border: "#ffedd5" };
    case "CRITICAL":
      return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" };
    default:
      return { bg: "#f8fafc", fg: "#475569", border: "#e2e8f0" };
  }
}

function getSpliceBadgeColor(level: string): { bg: string; fg: string; border: string } {
  switch (level) {
    case "NORMAL":
      return { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" };
    case "WATCH":
      return { bg: "#fefce8", fg: "#a16207", border: "#fef08a" };
    case "ELEVATED":
      return { bg: "#fff7ed", fg: "#c2410c", border: "#ffedd5" };
    case "HIGH":
      return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" };
    default:
      return { bg: "#f8fafc", fg: "#475569", border: "#e2e8f0" };
  }
}

export default function OverviewPage() {
  const { telemetry, isStale, isUnavailable, backendError, isLoading } = useTelemetry();

  const [activeAlerts, setActiveAlerts] = useState<AlertRecord[]>([]);
  const [condition, setCondition] = useState<ConditionSummary | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyAssessment | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [condLoading, setCondLoading] = useState<boolean>(true);

  const isFetchingAlerts = useRef<boolean>(false);
  const isFetchingCond = useRef<boolean>(false);
  const isFetchingAnomaly = useRef<boolean>(false);
  const isFetchingDecision = useRef<boolean>(false);

  const loadData = async () => {
    if (!isFetchingAlerts.current) {
      isFetchingAlerts.current = true;
      try {
        const res = await fetchActiveAlerts();
        if (res.data) setActiveAlerts(res.data);
      } catch {
      } finally {
        isFetchingAlerts.current = false;
      }
    }

    if (!isFetchingCond.current) {
      isFetchingCond.current = true;
      try {
        const res = await fetchConditionSummary();
        if (res.data) setCondition(res.data);
      } catch {
      } finally {
        setCondLoading(false);
        isFetchingCond.current = false;
      }
    }

    if (!isFetchingAnomaly.current) {
      isFetchingAnomaly.current = true;
      try {
        const res = await fetchAnomalyStatus();
        if (res.data) setAnomaly(res.data);
      } catch {
      } finally {
        isFetchingAnomaly.current = false;
      }
    }

    if (!isFetchingDecision.current) {
      isFetchingDecision.current = true;
      try {
        const res = await fetchDecisionSupportSummary();
        if (res.data) setDecision(res.data);
      } catch {
      } finally {
        isFetchingDecision.current = false;
      }
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = activeAlerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "WARNING").length;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Operational Overview</h2>
        <p className="page-desc">Primary system status, live telemetry summary, and multi-sensor condition assessment</p>
      </div>

      {/* A. System Summary Strip */}
      <StatusStrip />

      {/* Decision Support Summary Card */}
      <div
        className="card-panel"
        style={{
          borderLeft: `5px solid ${
            decision?.level === "CRITICAL"
              ? "#dc2626"
              : decision?.level === "WARNING"
              ? "#c2410c"
              : decision?.level === "ATTENTION"
              ? "#a16207"
              : "#047857"
          }`,
          marginBottom: "20px",
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ScanSearch size={18} style={{ color: "var(--accent-primary)" }} />
              <strong style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Current System Decision Assessment
              </strong>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color:
                    decision?.level === "CRITICAL"
                      ? "#dc2626"
                      : decision?.level === "WARNING"
                      ? "#c2410c"
                      : decision?.level === "ATTENTION"
                      ? "#a16207"
                      : "#047857",
                }}
              >
                {decision?.level || "NORMAL"}
              </span>
              <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                Evidence Agreement: <strong style={{ color: "var(--text-main)" }}>{decision?.evidence_agreement || "HIGH"}</strong>
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", margin: "4px 0 0 0" }}>
              {decision?.headline || "Conveyor operating normally."}
            </p>
          </div>

          <Link href="/decision-support" className="action-btn" style={{ textDecoration: "none", fontSize: "0.825rem", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            View Decision Support <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Compact Hardware Integration Summary Card */}
      <div
        className="card-panel"
        style={{
          marginBottom: "20px",
          padding: "14px 18px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Data Source
              </span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                SIMULATOR
              </div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ESP32 Hardware</span>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Not Connected</div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Camera Stream</span>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Not Connected</div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Local LCD Panel</span>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#047857" }}>Preview Available</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/local-display" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "6px 10px" }}>
              LCD Preview
            </Link>
            <Link href="/system" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "6px 10px" }}>
              System Status
            </Link>
          </div>
        </div>
      </div>

      {/* Scientific Transparency Disclaimer */}
      <div
        className="card-panel"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
          marginBottom: "20px",
          padding: "14px 18px",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <Info size={18} style={{ color: "var(--accent-primary)", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            <strong style={{ color: "var(--text-main)" }}>Scientific Disclaimer — Prototype Condition Engine:</strong>{" "}
            Condition assessment indices are prototype heuristic outputs derived from synthetic telemetry. Real sensor testing is required for industrial calibration.
          </div>
        </div>
      </div>

      {/* Warm-Up Banner if sample count is low */}
      {condition?.warming_up && (
        <div
          className="card-panel"
          style={{
            borderLeft: "4px solid #d97706",
            marginBottom: "20px",
            padding: "12px 18px",
            backgroundColor: "#fefce8",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Clock size={18} style={{ color: "#d97706" }} />
          <span style={{ fontSize: "0.875rem", color: "#92400e", fontWeight: 600 }}>
            Condition Engine Warming Up — Collecting recent telemetry samples ({condition.sample_count} / 20 readings)...
          </span>
        </div>
      )}

      {/* B. Live Telemetry Summary */}
      <section aria-labelledby="live-telemetry-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <h3 id="live-telemetry-title" className="panel-title">
            Current Telemetry Readings
          </h3>
        </div>
        <TelemetryCards
          telemetry={telemetry}
          isStale={isStale}
          isUnavailable={isUnavailable}
          error={backendError}
          isLoading={isLoading}
          compact={true}
        />
      </section>

      {/* C. Multi-Sensor Condition Assessment Cards */}
      <div className="system-grid" style={{ marginBottom: "24px" }}>
        {/* 1. OVERALL BELT CONDITION CARD */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} className="strip-icon" />
              <h3 className="panel-title">Overall Belt Condition</h3>
            </div>
            {condition ? (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor: getOverallBadgeColor(condition.overall.level).bg,
                  color: getOverallBadgeColor(condition.overall.level).fg,
                  border: `1px solid ${getOverallBadgeColor(condition.overall.level).border}`,
                }}
              >
                {condition.overall.level}
              </span>
            ) : (
              <span className="strip-badge checking">Awaiting Engine</span>
            )}
          </div>

          {condition ? (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Prototype Risk Index</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
                  {condition.overall.risk_index} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
                </span>
              </div>

              {/* Restrained horizontal risk bar */}
              <div style={{ height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${condition.overall.risk_index}%`,
                    backgroundColor: getOverallBadgeColor(condition.overall.level).fg,
                    transition: "width 0.5s ease-in-out",
                  }}
                />
              </div>

              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                Primary Contributing Indicators:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {condition.overall.contributors.map((contrib) => (
                  <div
                    key={contrib.metric}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{contrib.metric}</span>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="strip-mono" style={{ color: "var(--text-muted)" }}>
                        {contrib.value} {contrib.unit}
                      </span>
                      <span style={{ fontWeight: 700, color: contrib.risk >= 40 ? "#c2410c" : "#475569" }}>
                        Risk: {contrib.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="placeholder-box" style={{ padding: "28px 16px" }}>
              <p className="placeholder-text">Awaiting initial telemetry window from FastAPI backend...</p>
            </div>
          )}
        </div>

        {/* 2. PROTOTYPE SPLICE CONDITION CARD */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} className="strip-icon" />
              <h3 className="panel-title">Prototype Splice Condition</h3>
            </div>
            {condition ? (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor: getSpliceBadgeColor(condition.splice.level).bg,
                  color: getSpliceBadgeColor(condition.splice.level).fg,
                  border: `1px solid ${getSpliceBadgeColor(condition.splice.level).border}`,
                }}
              >
                {condition.splice.level}
              </span>
            ) : (
              <span className="strip-badge checking">Awaiting Engine</span>
            )}
          </div>

          {condition ? (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Prototype Splice Risk Index</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
                  {condition.splice.risk_index} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
                </span>
              </div>

              {/* Restrained horizontal risk bar */}
              <div style={{ height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginBottom: "14px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${condition.splice.risk_index}%`,
                    backgroundColor: getSpliceBadgeColor(condition.splice.level).fg,
                    transition: "width 0.5s ease-in-out",
                  }}
                />
              </div>

              <p style={{ fontSize: "0.825rem", color: "var(--text-main)", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", borderLeft: "3px solid var(--accent-primary)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                {condition.splice.message}
              </p>

              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                Splice Heuristic Contributors:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {condition.splice.contributors.map((contrib) => (
                  <div
                    key={contrib.metric}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "5px 10px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{contrib.metric}</span>
                    <span style={{ fontWeight: 700, color: contrib.risk >= 40 ? "#c2410c" : "#475569" }}>
                      Risk: {contrib.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="placeholder-box" style={{ padding: "28px 16px" }}>
              <p className="placeholder-text">Awaiting initial telemetry window from FastAPI backend...</p>
            </div>
          )}
        </div>
      </div>

      {/* D. AI Pattern Monitor (Step 12 Isolation Forest Summary) */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BrainCircuit size={20} className="strip-icon" />
            <h3 className="panel-title">AI Pattern Monitor (Isolation Forest Baseline)</h3>
          </div>
          <span className={`strip-badge ${anomaly?.available ? (anomaly.status === "ANOMALOUS_PATTERN" ? "offline" : "online") : "checking"}`}>
            {anomaly?.available ? (anomaly.status === "ANOMALOUS_PATTERN" ? "ANOMALOUS PATTERN" : "NORMAL PATTERN") : "Model Unavailable"}
          </span>
        </div>

        {anomaly?.available ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: anomaly.status === "ANOMALOUS_PATTERN" ? "#dc2626" : "#047857" }}>
                {anomaly.status === "ANOMALOUS_PATTERN" ? "ANOMALOUS PATTERN DETECTED" : "NORMAL OPERATING PATTERN"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Prototype Anomaly Index: <strong style={{ color: "var(--text-main)" }}>{anomaly.anomaly_index} / 100</strong> (Deviation index — not a failure probability)
              </div>
            </div>

            <Link href="/ai-insights" className="action-btn" style={{ textDecoration: "none", fontSize: "0.825rem", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              View AI Insights <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="placeholder-box" style={{ padding: "16px" }}>
            <p className="placeholder-text" style={{ fontSize: "0.85rem" }}>
              Isolation Forest model unavailable or offline. Run <code style={{ backgroundColor: "#e2e8f0", padding: "2px 4px", borderRadius: "3px" }}>python ml/train_anomaly_model.py</code> to initialize.
            </p>
          </div>
        )}
      </div>

      {/* E. Active Alert Engine Summary */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={20} style={{ color: activeAlerts.length > 0 ? "var(--status-warning)" : "var(--text-muted)" }} />
            <h3 className="panel-title">Active Alert Stream</h3>
          </div>
          <span className={`strip-badge ${activeAlerts.length > 0 ? "offline" : "online"}`}>
            {activeAlerts.length > 0
              ? `${activeAlerts.length} Active Alert${activeAlerts.length > 1 ? "s" : ""}`
              : "Engine Active"}
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="placeholder-box" style={{ padding: "24px 16px" }}>
            <CheckCircle2 size={24} style={{ color: "#16a34a", marginBottom: "6px" }} />
            <div className="placeholder-title" style={{ color: "#16a34a", fontSize: "0.95rem" }}>
              Active Alerts: 0
            </div>
            <p className="placeholder-text" style={{ marginTop: "2px" }}>
              All monitored channels are currently within prototype demonstration thresholds.
            </p>
            <div style={{ marginTop: "10px" }}>
              <Link href="/alerts" className="action-btn" style={{ textDecoration: "none", fontSize: "0.8rem" }}>
                View Alert Management <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "0.85rem" }}>
              <span>
                <strong>Active Alerts:</strong> {activeAlerts.length}
              </span>
              <span>
                {criticalCount > 0 && (
                  <span style={{ color: "#dc2626", fontWeight: 700, marginRight: "8px" }}>
                    {criticalCount} Critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span style={{ color: "#d97706", fontWeight: 700 }}>
                    {warningCount} Warning
                  </span>
                )}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
              {activeAlerts.map((alert) => {
                const isCrit = alert.severity === "CRITICAL";
                return (
                  <div
                    key={alert.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      borderLeft: `4px solid ${isCrit ? "#dc2626" : "#d97706"}`,
                      backgroundColor: isCrit ? "#fef2f2" : "#fefce8",
                      fontSize: "0.85rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ color: isCrit ? "#991b1b" : "#92400e" }}>
                        {alert.title}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {alert.message}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {alert.value} {alert.unit}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "6px", textAlign: "right" }}>
              <Link href="/alerts" className="action-btn" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "6px 12px" }}>
                Full Alerts Page <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* E. Digital Belt Preview */}
      <section className="card-panel" aria-labelledby="digital-belt-preview-title">
        <div className="panel-header">
          <h3 id="digital-belt-preview-title" className="panel-title">
            Digital Belt Schematic Preview
          </h3>
          <span className="strip-badge online">Schematic Online</span>
        </div>

        <div className="belt-preview-diagram">
          <div className="diagram-node">Motor Drive Head</div>
          <span className="diagram-edge">══════</span>
          <div className="diagram-node">Belt Section A ({condition?.device_id || "ESP32-01"})</div>
          <span className="diagram-edge">══════</span>
          <div className="diagram-node">Splice Joint #1</div>
          <span className="diagram-edge">══════</span>
          <div className="diagram-node">Tail Pulley / Return</div>
        </div>

        <p className="placeholder-text" style={{ textAlign: "center", marginTop: "10px" }}>
          Digital belt schematic presents spatial relationship between drive head, telemetry sensor node, monitored splice joint, and return pulley.
        </p>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link href="/digital-belt" className="action-btn" style={{ textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Open Digital Belt Representation <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
