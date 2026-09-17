"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  BellOff,
  Clock,
  ShieldAlert,
  RefreshCw,
  Info,
} from "lucide-react";
import { StatusStrip } from "@/components/StatusStrip";
import {
  fetchActiveAlerts,
  fetchAlertHistory,
  AlertRecord,
} from "@/lib/api";

function formatTimestamp(isoStr: string | null | undefined): string {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    const parts = isoStr.split("T");
    return parts[1] ? parts[1].substring(0, 8) : isoStr;
  } catch {
    return isoStr;
  }
}

function formatFullDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString([], {
        dateStyle: "short",
        timeStyle: "medium",
      });
    }
    return isoStr;
  } catch {
    return isoStr;
  }
}

export default function AlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState<AlertRecord[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  const loadAlertData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [activeRes, historyRes] = await Promise.all([
        fetchActiveAlerts(),
        fetchAlertHistory(50),
      ]);

      if (activeRes.error && historyRes.error) {
        setError(activeRes.error);
      } else {
        setError(null);
        if (activeRes.data) setActiveAlerts(activeRes.data);
        if (historyRes.data) setAlertHistory(historyRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load alert data");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadAlertData();
    const interval = setInterval(loadAlertData, 3000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = activeAlerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "WARNING").length;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Alert & Incident Management</h2>
        <p className="page-desc">
          Real-time rule-based condition evaluation, threshold violation logs, and alert persistence
        </p>
      </div>

      <StatusStrip />

      {/* Prototype Demo Thresholds Disclaimer */}
      <div
        className="card-panel"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
          marginBottom: "20px",
          padding: "16px 20px",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", marginTop: "2px", flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>
              Scientific Disclaimer — Prototype Demonstration Thresholds
            </strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Alert thresholds configured in this engine are demonstration parameters selected to test software functionality against synthetic operating profiles. They are NOT validated NMDC operating limits, OEM safety limits, or experimentally calibrated industrial failure limits.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Error State */}
      {error && (
        <div className="state-panel error-panel" style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "var(--status-offline)" }}>Backend Alert Stream Unavailable</h3>
          <p>Unable to retrieve live alerts: {error}. Ensure FastAPI service is online.</p>
        </div>
      )}

      {/* 1. ACTIVE ALERTS SECTION */}
      <section className="card-panel" aria-labelledby="active-alerts-title" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={20} style={{ color: activeAlerts.length > 0 ? "var(--status-warning)" : "var(--text-muted)" }} />
            <h3 id="active-alerts-title" className="panel-title">
              Active Alerts ({activeAlerts.length})
            </h3>
          </div>
          <span className={`strip-badge ${activeAlerts.length > 0 ? "offline" : "online"}`}>
            {activeAlerts.length > 0
              ? `${criticalCount} Critical | ${warningCount} Warning`
              : "0 Active Incidents"}
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="placeholder-box" style={{ padding: "40px 24px" }}>
            <CheckCircle2 size={36} style={{ color: "#16a34a", marginBottom: "12px" }} />
            <div className="placeholder-title" style={{ fontSize: "1.05rem", color: "#16a34a" }}>
              No Active Alerts
            </div>
            <p className="placeholder-text" style={{ marginTop: "6px" }}>
              All monitored channels are currently within prototype demonstration thresholds.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {activeAlerts.map((alert) => {
              const isCrit = alert.severity === "CRITICAL";
              return (
                <div
                  key={alert.id}
                  style={{
                    border: `1px solid ${isCrit ? "#fca5a5" : "#fde047"}`,
                    backgroundColor: isCrit ? "#fef2f2" : "#fefce8",
                    borderRadius: "8px",
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          backgroundColor: isCrit ? "#dc2626" : "#d97706",
                          color: "#ffffff",
                        }}
                      >
                        {alert.severity}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-main)", fontWeight: 600 }}>
                        {alert.title}
                      </h4>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        ({alert.metric})
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 700, color: isCrit ? "#b91c1c" : "#b45309" }}>
                        {alert.value} {alert.unit}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: "10px 0 12px 0", fontSize: "0.9rem", color: "#334155" }}>
                    {alert.message}
                  </p>

                  <div style={{ display: "flex", gap: "24px", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <div>
                      <strong>Started:</strong> <span className="strip-mono">{formatTimestamp(alert.started_at)}</span>
                    </div>
                    <div>
                      <strong>Last Observed:</strong> <span className="strip-mono">{formatTimestamp(alert.last_seen_at)}</span>
                    </div>
                    <div>
                      <strong>Device ID:</strong> <span className="strip-mono">{alert.device_id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. ALERT HISTORY SECTION */}
      <section className="card-panel" aria-labelledby="alert-history-title">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={20} className="strip-icon" />
            <h3 id="alert-history-title" className="panel-title">
              Alert Event History ({alertHistory.length})
            </h3>
          </div>
          <span className="historical-refresh-pill">
            <RefreshCw size={12} /> Auto-refresh 3s
          </span>
        </div>

        {alertHistory.length === 0 ? (
          <div className="placeholder-box" style={{ padding: "32px 24px" }}>
            <p className="placeholder-text">No historical alert events recorded in database yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px 12px" }}>Started</th>
                  <th style={{ padding: "10px 12px" }}>Metric</th>
                  <th style={{ padding: "10px 12px" }}>Severity</th>
                  <th style={{ padding: "10px 12px" }}>Observed Value</th>
                  <th style={{ padding: "10px 12px" }}>Message</th>
                  <th style={{ padding: "10px 12px" }}>Resolved At</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {alertHistory.map((item) => {
                  const isCrit = item.severity === "CRITICAL";
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }} className="strip-mono">
                        {formatFullDateTime(item.started_at)}
                      </td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize", fontWeight: 600 }}>
                        {item.metric}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: isCrit ? "#fee2e2" : "#fef3c7",
                            color: isCrit ? "#991b1b" : "#92400e",
                          }}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                        {item.value} {item.unit}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-main)" }}>
                        {item.message}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }} className="strip-mono">
                        {item.resolved_at ? formatFullDateTime(item.resolved_at) : "--"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: item.is_active ? "#fef3c7" : "#e2e8f0",
                            color: item.is_active ? "#92400e" : "#475569",
                          }}
                        >
                          {item.is_active ? "ACTIVE" : "RESOLVED"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
