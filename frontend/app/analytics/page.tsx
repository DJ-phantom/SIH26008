"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  HardDrive,
  TrendingUp,
  Thermometer,
  Activity,
  Zap,
  Gauge,
  MoveHorizontal,
  Weight,
  ChevronRight,
  BrainCircuit,
} from "lucide-react";
import { fetchTelemetryCount } from "@/lib/api";
import { StatusStrip } from "@/components/StatusStrip";

export default function AnalyticsPage() {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCount = async () => {
    const res = await fetchTelemetryCount();
    if (res.data) {
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, 3000);
    return () => clearInterval(timer);
  }, []);

  const trendLinks = [
    {
      name: "Temperature Trend",
      href: "/live/temperature",
      metric: "Bearing & Pulley Temperature (°C)",
      icon: Thermometer,
    },
    {
      name: "Vibration Trend",
      href: "/live/vibration",
      metric: "RMS Bearing Vibration (g)",
      icon: Activity,
    },
    {
      name: "Motor Current Trend",
      href: "/live/current",
      metric: "Drive Motor Power Current (A)",
      icon: Zap,
    },
    {
      name: "Belt Speed Trend",
      href: "/live/speed",
      metric: "Linear Surface Velocity (m/s)",
      icon: Gauge,
    },
    {
      name: "Alignment Trend",
      href: "/live/alignment",
      metric: "Tracking Lateral Offset (mm)",
      icon: MoveHorizontal,
    },
    {
      name: "Load Trend",
      href: "/live/load",
      metric: "Material Throughput Load (%)",
      icon: Weight,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Telemetry Analytics & Historical Trends</h2>
        <p className="page-desc">Historical data aggregation, persistent storage metrics, and sensor channel time-series graphs</p>
      </div>

      <StatusStrip />

      {/* Storage Summary & AI Analytics Cards */}
      <div className="system-grid" style={{ marginBottom: "24px" }}>
        <div className="system-card">
          <div className="system-card-header">
            <span className="system-card-title">Stored Telemetry</span>
            <Database size={16} className="strip-icon" />
          </div>
          <div className="system-card-body">
            <div className="card-value-box" style={{ margin: "4px 0" }}>
              <span className="metric-val" style={{ fontSize: "2rem" }}>
                {isLoading && totalCount === null ? "..." : totalCount?.toLocaleString()}
              </span>
              <span className="metric-unit">readings</span>
            </div>
            <div className="demo-range-text">Real telemetry records persisted in PostgreSQL table `telemetry`</div>
          </div>
        </div>

        <div className="system-card">
          <div className="system-card-header">
            <span className="system-card-title">Storage Schema</span>
            <HardDrive size={16} className="strip-icon" />
          </div>
          <div className="system-card-body">
            <div className="system-meta-row">
              <span className="system-meta-label">Database</span>
              <span className="system-meta-val">PostgreSQL 18 (sih26008)</span>
            </div>
            <div className="system-meta-row">
              <span className="system-meta-label">Cadence</span>
              <span className="system-meta-val">~1.0 Hz Continuous Ingestion</span>
            </div>
          </div>
        </div>

        <div className="system-card" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="system-card-header">
            <span className="system-card-title">AI Anomaly Detection</span>
            <BrainCircuit size={16} className="strip-icon" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="system-card-body">
            <div className="system-meta-row">
              <span className="system-meta-label">Model</span>
              <span className="system-meta-val">Isolation Forest Baseline</span>
            </div>
            <div className="system-meta-row">
              <span className="system-meta-label">Pattern Monitor</span>
              <span className="strip-badge online">Active</span>
            </div>
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Link href="/ai-insights" className="action-btn" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "4px 10px" }}>
                Open AI Insights <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Historical Trend Links */}
      <div className="card-panel">
        <div className="panel-header">
          <div className="panel-title-with-icon">
            <TrendingUp size={16} className="card-metric-icon" />
            <h3 className="panel-title" style={{ margin: 0 }}>Historical Sensor Trends</h3>
          </div>
          <span className="strip-badge online">Real PostgreSQL History</span>
        </div>

        <p className="panel-subtitle-text" style={{ marginBottom: "16px" }}>
          Inspect 120-reading historical time-series graphs, min/max/average descriptive statistics, and timestamped telemetry records for each individual physical sensor channel:
        </p>

        <div className="analytics-trend-grid">
          {trendLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="analytics-trend-card">
                <div className="analytics-trend-left">
                  <div className="analytics-icon-box">
                    <Icon size={18} className="card-metric-icon" />
                  </div>
                  <div>
                    <div className="analytics-trend-title">{item.name}</div>
                    <div className="analytics-trend-sub">{item.metric}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="analytics-trend-arrow" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

