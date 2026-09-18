"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTelemetry } from "@/lib/TelemetryContext";
import { fetchTelemetryHistory, TelemetryRecord, TelemetryData } from "@/lib/api";
import { SensorTrendChart } from "@/components/SensorTrendChart";
import { StatusStrip } from "@/components/StatusStrip";
import {
  Thermometer,
  Activity,
  Zap,
  Gauge,
  MoveHorizontal,
  Weight,
  ArrowLeft,
  ChevronRight,
  Database,
  Info,
  Clock,
} from "lucide-react";

type SupportedMetric = "temperature" | "vibration" | "current" | "speed" | "alignment" | "load";

interface MetricConfig {
  key: SupportedMetric;
  label: string;
  unit: string;
  decimals: number;
  icon: React.ElementType;
  description: string;
  demoRange: string;
  warningThreshold: string;
  criticalThreshold: string;
}

const METRIC_CONFIGS: Record<SupportedMetric, MetricConfig> = {
  temperature: {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    decimals: 1,
    icon: Thermometer,
    description: "Temperature sensor reading",
    demoRange: "38.0 – 44.0 °C (Demo Simulation Range)",
    warningThreshold: ">= 44.5 °C",
    criticalThreshold: ">= 48.0 °C",
  },
  vibration: {
    key: "vibration",
    label: "Vibration",
    unit: "g",
    decimals: 2,
    icon: Activity,
    description: "Vibration sensor reading",
    demoRange: "0.20 – 0.35 g (Demo Simulation Range)",
    warningThreshold: ">= 0.40 g",
    criticalThreshold: ">= 0.60 g",
  },
  current: {
    key: "current",
    label: "Motor Current",
    unit: "A",
    decimals: 2,
    icon: Zap,
    description: "Motor current sensor reading",
    demoRange: "3.80 – 4.50 A (Demo Simulation Range)",
    warningThreshold: ">= 4.70 A",
    criticalThreshold: ">= 5.50 A",
  },
  speed: {
    key: "speed",
    label: "Belt Speed",
    unit: "m/s",
    decimals: 2,
    icon: Gauge,
    description: "Belt speed sensor reading",
    demoRange: "1.70 – 1.90 m/s (Demo Simulation Range)",
    warningThreshold: "<= 1.68 m/s",
    criticalThreshold: "<= 1.58 m/s",
  },
  alignment: {
    key: "alignment",
    label: "Alignment",
    unit: "mm",
    decimals: 1,
    icon: MoveHorizontal,
    description: "Lateral alignment sensor reading",
    demoRange: "-2.0 – +2.0 mm (Demo Simulation Range)",
    warningThreshold: "abs(alignment) >= 3.0 mm",
    criticalThreshold: "abs(alignment) >= 5.0 mm",
  },
  load: {
    key: "load",
    label: "Load",
    unit: "%",
    decimals: 1,
    icon: Weight,
    description: "Simulated prototype load",
    demoRange: "50.0 – 70.0 % (Demo Simulation Range)",
    warningThreshold: ">= 75.0 %",
    criticalThreshold: ">= 85.0 %",
  },
};

export default function SensorDetailPage() {
  const params = useParams();
  const rawMetric = Array.isArray(params?.metric) ? params.metric[0] : params?.metric;
  const metricKey = (rawMetric ? rawMetric.toLowerCase() : "") as SupportedMetric;
  const config = METRIC_CONFIGS[metricKey];

  const { telemetry, isStale, isUnavailable, backendError } = useTelemetry();

  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Fetch 120 historical readings (approx 2 mins of 1 Hz data)
  const loadHistory = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetchTelemetryHistory(120);
      if (res.error) {
        setHistoryError(res.error);
      } else if (res.data) {
        setHistory(res.data);
        setHistoryError(null);
      }
    } catch (err: any) {
      setHistoryError(err.message || "Failed to fetch historical telemetry");
    } finally {
      setIsHistoryLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!config) return;

    loadHistory();
    // Auto-refresh historical trend every 5 seconds
    const interval = setInterval(loadHistory, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [metricKey, config]);

  // Client-side descriptive statistics computed strictly from PostgreSQL stored history
  const stats = useMemo(() => {
    if (!config || history.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    const values = history
      .map((r) => r[config.key])
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (values.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    let min = values[0];
    let max = values[0];
    let sum = 0;

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val < min) min = val;
      if (val > max) max = val;
      sum += val;
    }

    const avg = sum / values.length;

    return {
      min,
      max,
      avg,
      count: values.length,
    };
  }, [history, config]);

  if (!config) {
    return (
      <div>
        <div className="breadcrumb-nav">
          <Link href="/live" className="breadcrumb-link">
            <ArrowLeft size={14} /> Back to Live Monitoring
          </Link>
        </div>
        <div className="state-panel error-panel" style={{ marginTop: "20px" }}>
          <h3>Unrecognized Sensor Metric</h3>
          <p>
            The requested metric &quot;<code>{rawMetric}</code>&quot; is not a supported physical channel.
          </p>
          <p style={{ marginTop: "8px" }}>
            Supported metrics: <code>temperature</code>, <code>vibration</code>, <code>current</code>, <code>speed</code>, <code>alignment</code>, <code>load</code>.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link href="/live" className="action-btn">
              Return to Live Monitoring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = config.icon;
  const liveVal = telemetry ? telemetry[config.key] : null;
  const formattedLiveVal =
    typeof liveVal === "number"
      ? config.key === "alignment" && liveVal >= 0
        ? `+${liveVal.toFixed(config.decimals)}`
        : liveVal.toFixed(config.decimals)
      : "--";

  return (
    <div>
      {/* 1. Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="breadcrumb-nav">
        <Link href="/live" className="breadcrumb-link">
          Live Monitoring
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">{config.label} Trend</span>
      </nav>

      {/* Page Header */}
      <div className="page-header" style={{ marginTop: "12px" }}>
        <div className="sensor-header-row">
          <div className="sensor-title-box">
            <div className="sensor-title-group">
              <Icon size={24} className="card-metric-icon" />
              <h2 className="page-title">{config.label} History & Trend</h2>
            </div>
            <p className="page-desc">{config.description}</p>
          </div>

          <Link href="/live" className="back-button">
            <ArrowLeft size={14} />
            <span>All Channels</span>
          </Link>
        </div>
      </div>

      <StatusStrip />

      {/* 2. Live & Summary Row */}
      <div className="sensor-detail-grid">
        {/* Current Live Reading Box */}
        <div className="sensor-live-card">
          <div className="sensor-card-header">
            <span className="sensor-card-title">Live Sensor Reading</span>
            <span
              className={`stream-pill ${
                backendError || isUnavailable
                  ? "offline"
                  : isStale
                  ? "stale"
                  : "live"
              }`}
            >
              {backendError
                ? "BACKEND OFFLINE"
                : isUnavailable
                ? "AWAITING"
                : isStale
                ? "STALE"
                : "LIVE"}
            </span>
          </div>

          <div className="sensor-live-body">
            <div className="sensor-live-val-box">
              <span className="sensor-live-val">{formattedLiveVal}</span>
              <span className="sensor-live-unit">{config.unit}</span>
            </div>
            <div className="sensor-live-subtext">
              {telemetry ? (
                <span>Timestamp: <span className="strip-mono">{telemetry.timestamp}</span></span>
              ) : (
                <span>Awaiting live sensor packet</span>
              )}
            </div>
          </div>
        </div>

        {/* Descriptive Statistics Card */}
        <div className="sensor-stats-card">
          <div className="sensor-card-header">
            <span className="sensor-card-title">Descriptive Statistics</span>
            <span className="sensor-card-count">
              {stats.count > 0 ? `Computed from ${stats.count} records` : "No records"}
            </span>
          </div>

          <div className="stats-metric-grid">
            <div className="stat-item">
              <span className="stat-label">Current</span>
              <span className="stat-value">
                {formattedLiveVal} <span className="stat-unit">{config.unit}</span>
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Minimum</span>
              <span className="stat-value">
                {stats.min !== null ? stats.min.toFixed(config.decimals) : "--"}{" "}
                <span className="stat-unit">{config.unit}</span>
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Maximum</span>
              <span className="stat-value">
                {stats.max !== null ? stats.max.toFixed(config.decimals) : "--"}{" "}
                <span className="stat-unit">{config.unit}</span>
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">
                {stats.avg !== null ? stats.avg.toFixed(config.decimals) : "--"}{" "}
                <span className="stat-unit">{config.unit}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Historical Sensor Trend Chart Panel */}
      <div className="card-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            Historical Sensor Trend (Last {history.length > 0 ? history.length : 120} Readings)
          </h3>
          <span className="historical-refresh-pill">
            <Clock size={12} /> Auto-refresh 5s
          </span>
        </div>

        <SensorTrendChart
          data={history}
          metricKey={config.key}
          label={config.label}
          unit={config.unit}
          decimals={config.decimals}
          isLoading={isHistoryLoading}
          error={historyError}
        />
      </div>

      {/* 4. Small Factual Metadata Section */}
      <div className="card-panel">
        <div className="panel-header">
          <h3 className="panel-title">Factual Ingestion & Storage Metadata</h3>
          <span className="strip-badge online">Verified Pipeline</span>
        </div>

        <div className="system-meta-row">
          <span className="system-meta-label">Data Source</span>
          <span className="system-meta-val">PostgreSQL Table `telemetry`</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Simulation Scenario</span>
          <span className="system-meta-val" style={{ color: "var(--accent-primary)" }}>
            {telemetry?.scenario || (history.length > 0 && history[0].scenario) || "NORMAL"}
          </span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Current Source</span>
          <span className="system-meta-val">Synthetic Prototype Telemetry (Target: ESP32-01)</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Sampling Cadence</span>
          <span className="system-meta-val">Approximately 1.0 Hz (1000 ms)</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Historical Query Window</span>
          <span className="system-meta-val">Latest 120 readings (~2 minutes)</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Demo Simulation Bounds</span>
          <span className="system-meta-val">{config.demoRange}</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Prototype Warning Threshold</span>
          <span className="system-meta-val" style={{ color: "#d97706", fontWeight: 600 }}>{config.warningThreshold}</span>
        </div>
        <div className="system-meta-row">
          <span className="system-meta-label">Prototype Critical Threshold</span>
          <span className="system-meta-val" style={{ color: "#dc2626", fontWeight: 600 }}>{config.criticalThreshold}</span>
        </div>
      </div>
    </div>
  );
}
