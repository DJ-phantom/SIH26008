"use client";

import React from "react";
import { Camera, EyeOff, VideoOff, Info, ArrowRight, ShieldAlert } from "lucide-react";
import { StatusStrip } from "@/components/StatusStrip";

export default function CameraInspectionPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Optical & Camera Inspection Readiness</h2>
        <p className="page-desc">Structural readiness framework for visual defect tracking, splice inspection, and edge wear analysis</p>
      </div>

      <StatusStrip />

      {/* Main Inspection Panel */}
      <div className="card-panel">
        <div className="panel-header">
          <h3 className="panel-title">Vision Feed & Optical Ingestion</h3>
          <span className="strip-badge offline">Stream Inactive</span>
        </div>

        {/* Truthful Disconnected Box — NO FAKE VIDEO / NO FAKE YOLO */}
        <div className="placeholder-box" style={{ padding: "40px 24px", backgroundColor: "#f8fafc" }}>
          <VideoOff size={40} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <div className="placeholder-title" style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>
            Inspection Camera Hardware Not Connected
          </div>
          <p className="placeholder-text" style={{ marginTop: "8px", maxWidth: "680px", lineHeight: "1.5" }}>
            The current prototype relies entirely on numerical sensor telemetry (vibration, current, temperature, alignment, speed, load). Optical camera hardware and computer vision defect models are not active in this build phase. No simulated or fake video streams are displayed.
          </p>
        </div>

        {/* System & Hardware Status Cards */}
        <div className="system-grid" style={{ marginTop: "24px", marginBottom: "24px" }}>
          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Camera Hardware Status</span>
              <Camera size={16} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">Physical Hardware</span>
                <span className="system-meta-val" style={{ color: "#64748b", fontWeight: 600 }}>Not Connected</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Inspection Stream</span>
                <span className="system-meta-val" style={{ color: "var(--text-muted)" }}>Unavailable</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Target Protocol</span>
                <span className="system-meta-val">RTSP / WebRTC / USB Video</span>
              </div>
            </div>
          </div>

          <div className="system-card">
            <div className="system-card-header">
              <span className="system-card-title">Computer Vision Engine</span>
              <EyeOff size={16} className="strip-icon" />
            </div>
            <div className="system-card-body">
              <div className="system-meta-row">
                <span className="system-meta-label">CV Engine Status</span>
                <span className="system-meta-val" style={{ color: "#64748b", fontWeight: 600 }}>Not Enabled</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Defect Classification</span>
                <span className="system-meta-val" style={{ color: "var(--text-muted)" }}>None (Planned)</span>
              </div>
              <div className="system-meta-row">
                <span className="system-meta-label">Target Architecture</span>
                <span className="system-meta-val">OpenCV / Edge AI Pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Structural Architecture Flowchart Area */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
              Planned Camera & CV Ingestion Architecture
            </h4>
            <span style={{ fontSize: "0.75rem", backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
              PLANNED / NOT ACTIVE
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              backgroundColor: "#ffffff",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              overflowX: "auto",
            }}
          >
            <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", textAlign: "center", minWidth: "130px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Source</div>
              <strong style={{ fontSize: "0.825rem", color: "var(--text-main)" }}>Inspection Camera</strong>
            </div>

            <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

            <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", textAlign: "center", minWidth: "130px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ingestion</div>
              <strong style={{ fontSize: "0.825rem", color: "var(--text-main)" }}>Frame Capture</strong>
            </div>

            <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

            <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", textAlign: "center", minWidth: "140px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Processing</div>
              <strong style={{ fontSize: "0.825rem", color: "var(--text-main)" }}>OpenCV Pipeline</strong>
            </div>

            <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

            <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", textAlign: "center", minWidth: "150px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Analysis</div>
              <strong style={{ fontSize: "0.825rem", color: "var(--text-main)" }}>Splice & Defect Analysis</strong>
            </div>

            <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

            <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", textAlign: "center", minWidth: "130px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Output</div>
              <strong style={{ fontSize: "0.825rem", color: "var(--text-main)" }}>Dashboard Event</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Disclosure */}
      <div className="card-panel" style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid var(--accent-primary)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <Info size={20} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Camera & CV Integration Roadmap Disclosure
            </div>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
              Future camera integration will utilize local USB webcams or IP cameras publishing JPEG frame streams to <code style={{ backgroundColor: "#e2e8f0", padding: "1px 4px", borderRadius: "3px" }}>/api/camera/stream</code>. Defect visual events will be correlated with numerical telemetry anomalies in the Decision Support Engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
