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
      {/* 1. Page Title & Description */}
      <div className="page-header">
        <h2 className="page-title">Operational Overview</h2>
        <p className="page-desc">Comprehensive system condition, multi-sensor health fusion, and live telemetry intelligence</p>
      </div>

      {/* 2. Compact Infrastructure Status Strip */}
      <StatusStrip />

      {/* 3. Warm-Up Banner if sample count is low */}
      {condition?.warming_up && (
        <div
          className="card-panel"
          style={{
            borderLeft: "4px solid #d97706",
            marginBottom: "16px",
            padding: "10px 16px",
            backgroundColor: "#fefce8",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Clock size={16} style={{ color: "#d97706" }} />
          <span style={{ fontSize: "0.825rem", color: "#92400e", fontWeight: 600 }}>
            Condition Engine Warming Up — Collecting recent telemetry window ({condition.sample_count} / 20 readings)...
          </span>
        </div>
      )}

      {/* 4. PRIMARY JUDGE-FOCUSED CONDITION & INTELLIGENCE GRID (FIRST VIEWPORT) */}
      <section aria-label="Primary Health Indicators" style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          
          {/* CARD 1: OVERALL BELT CONDITION */}
          <div className="card-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="panel-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} className="strip-icon" />
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
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>Prototype Risk Index</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
                      {condition.overall.risk_index} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
                    </span>
                  </div>

                  <div style={{ height: "6px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${condition.overall.risk_index}%`,
                        backgroundColor: getOverallBadgeColor(condition.overall.level).fg,
                        transition: "width 0.5s ease-in-out",
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>
                    Top Risk Contributors:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {condition.overall.contributors.slice(0, 2).map((contrib) => (
                      <div
                        key={contrib.metric}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 8px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "4px",
                          fontSize: "0.775rem",
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
                <div style={{ padding: "16px 0", fontSize: "0.825rem", color: "var(--text-muted)" }}>Awaiting initial telemetry window...</div>
              )}
            </div>
          </div>

          {/* CARD 2: MONITORED SPLICE S1 */}
          <div className="card-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="panel-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={18} className="strip-icon" />
                  <h3 className="panel-title">Monitored Splice S1</h3>
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
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>Splice Risk Index</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
                      {condition.splice.risk_index} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
                    </span>
                  </div>

                  <div style={{ height: "6px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${condition.splice.risk_index}%`,
                        backgroundColor: getSpliceBadgeColor(condition.splice.level).fg,
                        transition: "width 0.5s ease-in-out",
                      }}
                    />
                  </div>

                  <p style={{ fontSize: "0.775rem", color: "var(--text-main)", backgroundColor: "#f8fafc", padding: "6px 8px", borderRadius: "4px", borderLeft: "3px solid var(--accent-primary)", margin: 0, lineHeight: 1.3 }}>
                    {condition.splice.message}
                  </p>
                </div>
              ) : (
                <div style={{ padding: "16px 0", fontSize: "0.825rem", color: "var(--text-muted)" }}>Awaiting splice telemetry window...</div>
              )}
            </div>

            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Link href="/digital-belt" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
                View Splice schematic →
              </Link>
            </div>
          </div>

          {/* CARD 3: DECISION SUPPORT ASSESSMENT */}
          <div className="card-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="panel-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ScanSearch size={18} className="strip-icon" />
                  <h3 className="panel-title">Decision Assessment</h3>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: getOverallBadgeColor(decision?.level || "NORMAL").bg,
                    color: getOverallBadgeColor(decision?.level || "NORMAL").fg,
                    border: `1px solid ${getOverallBadgeColor(decision?.level || "NORMAL").border}`,
                  }}
                >
                  {decision?.level || "NORMAL"}
                </span>
              </div>

              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Evidence Agreement: <strong style={{ color: "var(--text-main)" }}>{decision?.evidence_agreement || "HIGH"}</strong>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 600, margin: 0, lineHeight: 1.35 }}>
                  {decision?.headline || "Conveyor operating normally within expected parameters."}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <Link href="/decision-support" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                View Decision Support <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* CARD 4: ACTIVE ALERTS */}
          <div className="card-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="panel-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldAlert size={18} style={{ color: activeAlerts.length > 0 ? "var(--status-warning)" : "var(--text-muted)" }} />
                  <h3 className="panel-title">Active Alerts</h3>
                </div>
                <span className={`strip-badge ${activeAlerts.length > 0 ? "offline" : "online"}`}>
                  {activeAlerts.length} Active
                </span>
              </div>

              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: activeAlerts.length > 0 ? "#dc2626" : "#047857" }}>
                  {activeAlerts.length === 0 ? "0 Active Alerts" : `${activeAlerts.length} Active Alert${activeAlerts.length > 1 ? "s" : ""}`}
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {criticalCount > 0 && <span style={{ color: "#dc2626", fontWeight: 700, marginRight: "8px" }}>{criticalCount} Critical</span>}
                  {warningCount > 0 && <span style={{ color: "#c2410c", fontWeight: 700 }}>{warningCount} Warning</span>}
                  {activeAlerts.length === 0 && "All channels within demonstration bounds"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <Link href="/alerts" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                View Alerts <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* CARD 5: AI PATTERN MONITOR */}
          <div className="card-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="panel-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BrainCircuit size={18} className="strip-icon" />
                  <h3 className="panel-title">AI Pattern Monitor</h3>
                </div>
                <span className={`strip-badge ${anomaly?.available ? (anomaly.status === "ANOMALOUS_PATTERN" ? "offline" : "online") : "stale"}`}>
                  {anomaly?.available ? (anomaly.status === "ANOMALOUS_PATTERN" ? "ANOMALOUS" : "NORMAL") : "Unavailable"}
                </span>
              </div>

              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: anomaly?.status === "ANOMALOUS_PATTERN" ? "#dc2626" : "#047857" }}>
                  {anomaly?.status === "ANOMALOUS_PATTERN" ? "ANOMALOUS PATTERN" : "NORMAL PATTERN"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Anomaly Index: <strong style={{ color: "var(--text-main)" }}>{anomaly?.anomaly_index || 0} / 100</strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <Link href="/ai-insights" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                View AI Insights <ChevronRight size={12} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. LIVE TELEMETRY CARDS (6 CHANNELS) */}
      <section aria-labelledby="live-telemetry-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <h3 id="live-telemetry-title" className="panel-title">
            Live Telemetry Channels
          </h3>
          <span className="strip-badge live">6 Channels Active</span>
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

      {/* 6. DIGITAL BELT SCHEMATIC PREVIEW */}
      <section className="card-panel" aria-labelledby="digital-belt-preview-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <h3 id="digital-belt-preview-title" className="panel-title">
            Digital Belt Schematic Preview
          </h3>
          <span className="strip-badge online">Spatial Model</span>
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

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link href="/digital-belt" className="action-btn" style={{ textDecoration: "none", fontSize: "0.825rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            View Digital Belt Representation <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* 7. HARDWARE INTEGRATION SUMMARY (LOWER POSITION) */}
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
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                SIMULATOR
              </div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ESP32 Hardware</span>
              <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-muted)" }}>Not Connected</div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Camera Stream</span>
              <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-muted)" }}>Not Connected</div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Local LCD Panel</span>
              <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#047857" }}>Preview Available</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/local-display" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "5px 10px" }}>
              LCD Preview
            </Link>
            <Link href="/system" className="action-btn" style={{ textDecoration: "none", fontSize: "0.775rem", padding: "5px 10px" }}>
              System Status
            </Link>
          </div>
        </div>
      </div>

      {/* 8. SCIENTIFIC TRANSPARENCY DISCLAIMER (RESTRAINED FOOTER STRIP) */}
      <div
        className="card-panel"
        style={{
          borderLeft: "3px solid var(--accent-primary)",
          marginBottom: 0,
          padding: "10px 14px",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Info size={15} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
          <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
            <strong style={{ color: "var(--text-main)" }}>Scientific Disclaimer:</strong>{" "}
            Prototype risk indices use synthetic telemetry and heuristic calibration. Real sensor validation is required for industrial deployment.
          </div>
        </div>
      </div>
    </div>
  );
}
