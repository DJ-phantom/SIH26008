"use client";

import React, { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/TelemetryContext";
import { fetchConditionSummary, ConditionSummary } from "@/lib/api";
import { Monitor } from "lucide-react";

export const LocalLcdPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { telemetry, isStale, isUnavailable, backendError } = useTelemetry();
  const [condition, setCondition] = useState<ConditionSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCond() {
      try {
        const res = await fetchConditionSummary();
        if (isMounted && res.data) {
          setCondition(res.data);
        }
      } catch {
        // Silent catch for polling
      }
    }

    loadCond();
    const timer = setInterval(loadCond, 2000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const isLive = telemetry && !isStale && !isUnavailable && !backendError;

  // Format 20-character width exact logical rows (OPTION A — TRUE 20x4 STYLE)
  const tempStr = telemetry ? telemetry.temperature.toFixed(1) : "--.-";
  const vibStr = telemetry ? telemetry.vibration.toFixed(2) : "-.--";
  const currStr = telemetry ? telemetry.current.toFixed(1) : "--.-";
  const spdStr = telemetry ? telemetry.speed.toFixed(2) : "-.--";
  
  const beltCode = condition ? condition.overall.level.slice(0, 4) : "NORM";
  const spliceCode = condition ? condition.splice.level.slice(0, 4) : "NORM";

  // Exact 20-character logical rows
  const row1 = isLive ? `BELT:${beltCode.padEnd(4, " ")}  SPL:${spliceCode.padEnd(4, " ")}` : "*** STREAM STALE ***";
  const row2 = isLive ? `T:${tempStr.padStart(5, " ")}C   V:${vibStr.padStart(5, " ")}g` : "AWAITING MQTT DATA  ";
  const row3 = isLive ? `I:${currStr.padStart(5, " ")}A SPD:${spdStr.padStart(4, " ")}m/s` : "HARDWARE DISCONNECT ";
  const row4 = isLive ? "SYS:PLATFORM ONLINE " : "SYS:OFFLINE / STALE ";

  return (
    <div className="card-panel" style={{ marginBottom: compact ? "16px" : "24px" }}>
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Monitor size={18} className="strip-icon" />
          <h3 className="panel-title">Local Edge LCD Representation (True 20x4 Character Display)</h3>
        </div>
        <span className={`strip-badge ${isLive ? "online" : "stale"}`}>
          {isLive ? "Preview Live" : "Stream Stale"}
        </span>
      </div>

      <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "14px" }}>
        Simulated 20x4 character dot-matrix LCD panel as rendered on the physical conveyor side panel. Exact 4-row character grid driven by live backend telemetry.
      </div>

      {/* Retro 20x4 Physical LCD Box */}
      <div
        style={{
          backgroundColor: "#061a12",
          border: "4px solid #0f382c",
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "'Courier New', Courier, monospace",
          color: isLive ? "#10b981" : "#f59e0b",
          fontSize: compact ? "0.9rem" : "1.05rem",
          letterSpacing: "2px",
          lineHeight: "1.8",
          textShadow: isLive ? "0 0 6px rgba(16, 185, 129, 0.6)" : "0 0 6px rgba(245, 158, 11, 0.6)",
          whiteSpace: "pre",
          overflowX: "auto",
        }}
      >
        <div>{row1}</div>
        <div>{row2}</div>
        <div>{row3}</div>
        <div>{row4}</div>
      </div>

      {/* Hardware Status Disclosure */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px 14px",
          backgroundColor: "#f8fafc",
          borderRadius: "6px",
          borderLeft: "3px solid var(--accent-primary)",
          fontSize: "0.825rem",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span>
            <strong>Hardware Status:</strong>{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Not Connected (Web 20x4 LCD Preview Active)</span>
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target Device: ESP32-01</span>
        </div>

        {!compact && (
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "8px" }}>
            <strong>Local & Remote Dual-Stream Architecture:</strong>
            <div style={{ fontFamily: "monospace", fontSize: "0.775rem", backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "4px", marginTop: "6px", border: "1px solid #e2e8f0" }}>
              ESP32 Microcontroller<br />
              ├── MQTT → Mosquitto Broker → FastAPI → Dashboard (Remote)<br />
              └── Local SPI/I2C 20x4 LCD → On-Site Operator Panel (Local)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
