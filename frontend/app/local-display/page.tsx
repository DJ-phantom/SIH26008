"use client";

import React from "react";
import { StatusStrip } from "@/components/StatusStrip";
import { LocalLcdPanel } from "@/components/LocalLcdPanel";
import { Monitor, Info, Radio, Cpu } from "lucide-react";

export default function LocalDisplayPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Local Edge LCD Representation</h2>
        <p className="page-desc">Simulated physical 20x4 character LCD panel as deployed on the conveyor side enclosure</p>
      </div>

      <StatusStrip />

      <LocalLcdPanel />

      <div className="card-panel" style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid var(--accent-primary)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              On-Site Local Display Hardware Purpose
            </div>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
              In a physical field deployment, operators on the factory floor rely on local LCD screens for immediate sensor readings without needing web dashboard connectivity. The ESP32 micro-controller drives both the local SPI/I2C LCD display and the MQTT wireless telemetry stream simultaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
