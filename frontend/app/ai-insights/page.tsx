"use client";

import React, { useEffect, useState, useRef } from "react";
import { StatusStrip } from "@/components/StatusStrip";
import { fetchAnomalyStatus, AnomalyAssessment } from "@/lib/api";
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Activity,
  BarChart2,
  Clock,
  CheckCircle2,
  Server,
  HelpCircle,
} from "lucide-react";

export default function AIInsightsPage() {
  const [anomaly, setAnomaly] = useState<AnomalyAssessment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef<boolean>(false);

  const loadAnomalyData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const res = await fetchAnomalyStatus();
      if (res.data) {
        setAnomaly(res.data);
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadAnomalyData();
    const interval = setInterval(loadAnomalyData, 1500);
    return () => clearInterval(interval);
  }, []);

  const isAnomalous = anomaly?.status === "ANOMALOUS_PATTERN";
  const isAvailable = anomaly?.available ?? false;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BrainCircuit size={26} style={{ color: "var(--accent-primary)" }} />
          <div>
            <h2 className="page-title">AI Insights — Prototype Anomaly Detection</h2>
            <p className="page-desc">
              Unsupervised multivariate pattern monitoring using Isolation Forest trained on normal conveyor baseline telemetry
            </p>
          </div>
        </div>
      </div>

      <StatusStrip />

      {/* Model Unavailable Banner */}
      {!isLoading && anomaly && !anomaly.available && (
        <div
          className="card-panel"
          style={{
            borderLeft: "4px solid #dc2626",
            marginBottom: "24px",
            padding: "16px 20px",
            backgroundColor: "#fef2f2",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#dc2626", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#991b1b", fontSize: "0.95rem" }}>
              Anomaly Detection Model Unavailable
            </strong>
            <p style={{ fontSize: "0.85rem", color: "#7f1d1d", marginTop: "2px" }}>
              The trained Isolation Forest model file was not found or failed to load. Run{" "}
              <code style={{ backgroundColor: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>
                python ml/train_anomaly_model.py
              </code>{" "}
              to generate the model baseline artifact. Backend telemetry ingestion remains fully functional.
            </p>
          </div>
        </div>
      )}

      {/* Primary Pattern & Index Grid */}
      <div className="system-grid" style={{ marginBottom: "24px" }}>
        {/* 1. PATTERN STATUS CARD */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} className="strip-icon" />
              <h3 className="panel-title">Pattern Status</h3>
            </div>
            {isAvailable ? (
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  backgroundColor: isAnomalous ? "#fef2f2" : "#ecfdf5",
                  color: isAnomalous ? "#dc2626" : "#047857",
                  border: `1px solid ${isAnomalous ? "#fecaca" : "#a7f3d0"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isAnomalous ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                {anomaly?.status.replace("_", " ")}
              </span>
            ) : (
              <span className="strip-badge offline">Unavailable</span>
            )}
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: isAnomalous ? "#c2410c" : "#047857", letterSpacing: "-0.5px" }}>
              {isAvailable ? (isAnomalous ? "ANOMALOUS PATTERN" : "NORMAL PATTERN") : "MODEL UNAVAILABLE"}
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
              Multivariate Isolation Forest pattern classification based on current 6-sensor telemetry vector.
            </p>

            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Raw Decision Score:</span>
                <span className="strip-mono" style={{ fontWeight: 700, color: "var(--text-main)" }}>
                  {anomaly?.decision_score !== undefined ? (anomaly.decision_score > 0 ? `+${anomaly.decision_score.toFixed(4)}` : anomaly.decision_score.toFixed(4)) : "N/A"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Recent Window (5 Samples):</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {anomaly?.recent_anomaly_count ?? 0} / {anomaly?.window_size ?? 5} anomalous
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PROTOTYPE ANOMALY INDEX CARD */}
        <div className="card-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={20} className="strip-icon" />
              <h3 className="panel-title">Prototype Anomaly Index</h3>
            </div>
            <span className="strip-badge online">Calibrated Scale</span>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>Multivariate Deviation Index</span>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)" }}>
                {anomaly?.anomaly_index ?? 0}{" "}
                <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div style={{ height: "10px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden", marginBottom: "12px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${anomaly?.anomaly_index ?? 0}%`,
                  backgroundColor: (anomaly?.anomaly_index ?? 0) >= 50 ? "#dc2626" : (anomaly?.anomaly_index ?? 0) >= 25 ? "#d97706" : "#16a34a",
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600, backgroundColor: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid var(--accent-primary)", marginBottom: "12px" }}>
              Deviation index — not a failure probability.
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4, margin: 0 }}>
              Transparent bounded 0–100 scale derived from baseline decision score distribution. Score 0 represents standard normal baseline; values above 50 indicate growing multivariate pattern deviation.
            </p>
          </div>
        </div>
      </div>

      {/* Model Configuration & Architecture Summary */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={18} className="strip-icon" />
            <h3 className="panel-title">Model Architecture & Baseline Details</h3>
          </div>
          <span className="strip-badge online">Isolation Forest</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "12px" }}>
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Model Algorithm</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "4px" }}>{anomaly?.model_type || "IsolationForest"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>scikit-learn Pipeline</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Input Vector Features</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "4px" }}>6 Numerical Sensors</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Temp, Vib, Curr, Spd, Align, Load</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Training Baseline Size</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "4px" }}>
              {anomaly?.training_sample_count?.toLocaleString() || "0"} Records
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Synthetic NORMAL scenario telemetry</div>
          </div>

          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Inference Window</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "4px" }}>5 Samples Majority</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Rolling 5-prediction stability</div>
          </div>
        </div>
      </div>

      {/* Top Baseline Deviations */}
      <div className="card-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} className="strip-icon" />
            <h3 className="panel-title">Largest Deviations from Learned Normal Baseline</h3>
          </div>
          <span className="strip-badge live">Live Telemetry Distance</span>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
          Statistical distances measured in standard deviations (<strong style={{ color: "var(--text-main)" }}>σ</strong>) from the training NORMAL baseline mean ($|x - \mu| / \sigma$). Higher z-scores highlight individual sensor channels contributing most to baseline deviation.
        </p>

        {anomaly?.top_deviations && anomaly.top_deviations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {anomaly.top_deviations.map((item, idx) => {
              const isHighDev = item.deviation >= 3.0;
              return (
                <div
                  key={item.metric}
                  style={{
                    padding: "14px 16px",
                    backgroundColor: isHighDev ? "#fff7ed" : "#f8fafc",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${isHighDev ? "#c2410c" : "var(--accent-primary)"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                      #{idx + 1} {item.metric}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: isHighDev ? "#c2410c" : "var(--accent-primary)",
                        backgroundColor: isHighDev ? "#ffedd5" : "#e0f2fe",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.deviation}σ from baseline
                    </span>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Current Value: <strong style={{ color: "var(--text-main)" }}>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="placeholder-box" style={{ padding: "20px" }}>
            <p className="placeholder-text">Awaiting live telemetry reading for deviation calculation...</p>
          </div>
        )}

        <div style={{ marginTop: "12px", fontSize: "0.775rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <HelpCircle size={14} style={{ color: "var(--text-muted)" }} />
          <span>Note: Baseline deviations indicate metrics farthest from normal training averages, not mathematical feature attributions.</span>
        </div>
      </div>

      {/* Scientific Disclaimer Card */}
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
              Scientific Disclaimer — Prototype Anomaly Detection Model
            </strong>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
              This prototype model learns synthetic NORMAL telemetry and detects multivariate deviations. It does not predict belt rupture or remaining useful life. Real sensor datasets and controlled fault experiments are required for industrial model validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
