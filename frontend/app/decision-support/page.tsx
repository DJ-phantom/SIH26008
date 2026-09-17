"use client";

import React, { useEffect, useState, useRef } from "react";
import { StatusStrip } from "@/components/StatusStrip";
import { fetchDecisionSupportSummary, DecisionSummary } from "@/lib/api";
import {
  ScanSearch,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Activity,
  BrainCircuit,
  ClipboardCheck,
  Layers,
  HelpCircle,
} from "lucide-react";

function getLevelBadgeStyle(level: string) {
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

function getAgreementBadgeStyle(agreement: string) {
  switch (agreement) {
    case "HIGH":
      return { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0" };
    case "MODERATE":
      return { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" };
    case "LOW":
      return { bg: "#fefce8", fg: "#a16207", border: "#fef08a" };
    default:
      return { bg: "#f8fafc", fg: "#475569", border: "#e2e8f0" };
  }
}

export default function DecisionSupportPage() {
  const [summary, setSummary] = useState<DecisionSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef<boolean>(false);

  const loadData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const res = await fetchDecisionSupportSummary();
      if (res.data) {
        setSummary(res.data);
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach backend");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const levelStyle = getLevelBadgeStyle(summary?.level || "NORMAL");
  const agreementStyle = getAgreementBadgeStyle(summary?.evidence_agreement || "HIGH");

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ScanSearch size={28} style={{ color: "var(--accent-primary)" }} />
          <div>
            <h2 className="page-title">Decision Support</h2>
            <p className="page-desc">
              Combined evidence from threshold monitoring, multi-sensor condition assessment, and anomaly detection
            </p>
          </div>
        </div>
      </div>

      <StatusStrip />

      {/* Top Assessment Banner */}
      <div
        className="card-panel"
        style={{
          borderLeft: `6px solid ${levelStyle.fg}`,
          marginBottom: "24px",
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Current Assessment
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: levelStyle.fg, marginTop: "2px" }}>
              {summary?.level || "LOADING..."}
            </div>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-main)", marginTop: "6px", lineHeight: 1.4 }}>
              {summary?.headline || "Evaluating multi-layer system telemetry..."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 700,
                backgroundColor: levelStyle.bg,
                color: levelStyle.fg,
                border: `1px solid ${levelStyle.border}`,
              }}
            >
              {summary?.level || "NORMAL"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>Evidence Agreement:</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.775rem",
                  fontWeight: 700,
                  backgroundColor: agreementStyle.bg,
                  color: agreementStyle.fg,
                  border: `1px solid ${agreementStyle.border}`,
                }}
              >
                {summary?.evidence_agreement || "HIGH"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Three Engine Status Panel (Distinct Cards) */}
      <div className="system-grid" style={{ marginBottom: "24px" }}>
        {/* 1. RULE MONITORING CARD */}
        <div className="system-card">
          <div className="system-card-header">
            <span className="system-card-title">Rule Monitoring</span>
            <ShieldAlert size={18} className="strip-icon" />
          </div>
          <div className="system-card-body">
            <div className="system-meta-row">
              <span className="system-meta-label">Active Alerts</span>
              <span className={`strip-badge ${summary?.active_alert_count ? "offline" : "online"}`}>
                {summary?.active_alert_count ? `${summary.active_alert_count} Active` : "0 Active Alerts"}
              </span>
            </div>
            <div className="system-meta-row">
              <span className="system-meta-label">Evaluation Engine</span>
              <span className="system-meta-val">Deterministic Rules</span>
            </div>
          </div>
        </div>

        {/* 2. CONDITION ASSESSMENT CARD */}
        <div className="system-card">
          <div className="system-card-header">
            <span className="system-card-title">Condition Assessment</span>
            <Activity size={18} className="strip-icon" />
          </div>
          <div className="system-card-body">
            <div className="system-meta-row">
              <span className="system-meta-label">Overall Belt</span>
              <span className="system-meta-val" style={{ fontWeight: 700 }}>
                {summary?.condition_level || "NORMAL"}
              </span>
            </div>
            <div className="system-meta-row">
              <span className="system-meta-label">Splice Condition</span>
              <span className="system-meta-val" style={{ fontWeight: 700 }}>
                {summary?.splice_level || "NORMAL"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. ML PATTERN MONITOR CARD */}
        <div className="system-card">
          <div className="system-card-header">
            <span className="system-card-title">ML Pattern Monitor</span>
            <BrainCircuit size={18} className="strip-icon" />
          </div>
          <div className="system-card-body">
            <div className="system-meta-row">
              <span className="system-meta-label">Pattern Status</span>
              <span className={`strip-badge ${summary?.ml_status === "ANOMALOUS_PATTERN" ? "offline" : summary?.ml_status === "MODEL_UNAVAILABLE" ? "stale" : "online"}`}>
                {summary?.ml_status?.replace("_", " ") || "NORMAL PATTERN"}
              </span>
            </div>
            <div className="system-meta-row">
              <span className="system-meta-label">Model Pipeline</span>
              <span className="system-meta-val">Isolation Forest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated System Evidence List */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardCheck size={18} className="strip-icon" />
            <h3 className="panel-title">Aggregated System Evidence</h3>
          </div>
          <span className="strip-badge online">
            {summary?.evidence.length || 0} Evidence Item{summary?.evidence.length !== 1 ? "s" : ""}
          </span>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
          Structured evidence compiled from active rule thresholds, multi-sensor condition risk contributions, and Isolation Forest baseline deviations:
        </p>

        {summary?.evidence && summary.evidence.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {summary.evidence.map((item, idx) => {
              const isCrit = item.severity === "CRITICAL";
              const isWarn = item.severity === "WARNING";
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: isCrit ? "#fef2f2" : isWarn ? "#fff7ed" : "#f8fafc",
                    borderLeft: `4px solid ${isCrit ? "#dc2626" : isWarn ? "#c2410c" : "var(--accent-primary)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.95rem", color: isCrit ? "#991b1b" : isWarn ? "#92400e" : "var(--text-main)" }}>
                        {item.title}
                      </strong>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {item.detail}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.725rem",
                        fontWeight: 700,
                        backgroundColor: item.source === "RULE" ? "#dbeafe" : item.source === "CONDITION" ? "#e0e7ff" : "#fae8ff",
                        color: item.source === "RULE" ? "#1e40af" : item.source === "CONDITION" ? "#3730a3" : "#86198f",
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      {item.source}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.725rem",
                        fontWeight: 700,
                        backgroundColor: isCrit ? "#fee2e2" : isWarn ? "#ffedd5" : "#f1f5f9",
                        color: isCrit ? "#991b1b" : isWarn ? "#92400e" : "#475569",
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="placeholder-box" style={{ padding: "24px 16px" }}>
            <CheckCircle2 size={24} style={{ color: "#16a34a", marginBottom: "6px" }} />
            <div className="placeholder-title" style={{ color: "#16a34a", fontSize: "0.95rem" }}>
              No Abnormal Evidence Recorded
            </div>
            <p className="placeholder-text">All monitored indicators are operating within standard baseline thresholds.</p>
          </div>
        )}
      </div>

      {/* Suggested Inspection Actions */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} className="strip-icon" />
            <h3 className="panel-title">Suggested Inspection Actions</h3>
          </div>
          <span className="strip-badge online">Maintenance Guidance</span>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
          Conservative maintenance and physical inspection recommendations mapped directly from current evidence:
        </p>

        {summary?.suggested_actions && summary.suggested_actions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {summary.suggested_actions.map((act, idx) => {
              const isPriority = act.priority === "PRIORITY";
              const isRec = act.priority === "RECOMMENDED";
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${isPriority ? "#dc2626" : isRec ? "var(--accent-primary)" : "#64748b"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", lineHeight: 1.4 }}>
                    {idx + 1}. {act.action}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      backgroundColor: isPriority ? "#fee2e2" : isRec ? "#e0f2fe" : "#f1f5f9",
                      color: isPriority ? "#991b1b" : isRec ? "var(--accent-primary)" : "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {act.priority}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="placeholder-box" style={{ padding: "20px" }}>
            <p className="placeholder-text">No active inspection recommendations required.</p>
          </div>
        )}
      </div>

      {/* Scientific Disclosure Footer */}
      <div
        className="card-panel"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
          backgroundColor: "#f8fafc",
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", marginTop: "2px", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
              Scientific Disclosure — Prototype Decision Support Layer
            </strong>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
              This decision-support summary combines independent prototype monitoring outputs. It does not represent a validated failure probability or autonomous safety decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
