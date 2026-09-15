"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header";
import { TelemetryCard } from "../components/TelemetryCard";
import { ConditionBanner } from "../components/ConditionBanner";
import { HealthOverview } from "../components/HealthOverview";
import { ConveyorSystemView } from "../components/ConveyorSystemView";
import { TelemetryCharts } from "../components/TelemetryCharts";
import { AlertsPanel } from "../components/AlertsPanel";
import { DemoAlert, TelemetryData } from "../types/telemetry";
import { calculateHealthAssessment } from "../lib/healthEngine";
import { RefreshCw, WifiOff, ArrowRight, ShieldCheck } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);
  const [historyData, setHistoryData] = useState<TelemetryData[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isMqttConnected, setIsMqttConnected] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [alertHistory, setAlertHistory] = useState<DemoAlert[]>([]);

  const mountedRef = useRef<boolean>(true);
  const prevConditionRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // Polling function for /health and /telemetry/latest
    const fetchLatest = async () => {
      try {
        // 1. Health check
        const healthRes = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
        if (!healthRes.ok) throw new Error("Health endpoint error");
        const healthJson = await healthRes.json();

        if (mountedRef.current) {
          setIsBackendConnected(true);
          setIsMqttConnected(Boolean(healthJson.mqtt_connected));
        }

        // 2. Latest telemetry
        const telemetryRes = await fetch(`${API_BASE_URL}/telemetry/latest`, { cache: "no-store" });
        if (!telemetryRes.ok) throw new Error("Telemetry endpoint error");
        const telemetryJson = await telemetryRes.json();

        if (mountedRef.current) {
          if (telemetryJson && Object.keys(telemetryJson).length > 0 && telemetryJson.temperature !== undefined) {
            const telemetry = telemetryJson as TelemetryData;
            setLatestData(telemetry);
            setLastUpdatedTime(new Date().toLocaleTimeString());

            // Track alerts on condition transition without creating duplicate entries every second
            const currentCond = (telemetry.condition || "NORMAL").toUpperCase();
            if (prevConditionRef.current !== currentCond) {
              prevConditionRef.current = currentCond;

              const assessment = calculateHealthAssessment(telemetry);
              if (assessment.alerts.length > 0) {
                const newAlert = {
                  ...assessment.alerts[0],
                  id: `${assessment.alerts[0].id}-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                };
                setAlertHistory((prev) => [newAlert, ...prev.slice(0, 7)]);
              } else if (currentCond === "NORMAL" && alertHistory.length > 0) {
                const recoveryNotice: DemoAlert = {
                  id: `recovery-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  level: "info",
                  component: "System Overview",
                  title: "Operating State Normalized",
                  message: "Telemetry parameters have returned to nominal operating profile.",
                };
                setAlertHistory((prev) => [recoveryNotice, ...prev.slice(0, 7)]);
              }
            }
          }
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setIsBackendConnected(false);
          setIsMqttConnected(false);
        }
      }
    };

    // History polling function
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/telemetry/history?limit=30`, { cache: "no-store" });
        if (res.ok) {
          const data: TelemetryData[] = await res.json();
          if (mountedRef.current && Array.isArray(data)) {
            // Reverse so oldest is left, newest is right for time-series charts
            const chronological = [...data].reverse();
            setHistoryData(chronological);
          }
        }
      } catch (e) {
        // Handled via main polling error state
      }
    };

    // Initial fetch
    fetchLatest();
    fetchHistory();

    // 1-second interval for real-time telemetry polling
    const latestInterval = setInterval(fetchLatest, 1000);
    // 3-second interval for historical buffer refresh
    const historyInterval = setInterval(fetchHistory, 3000);

    return () => {
      mountedRef.current = false;
      clearInterval(latestInterval);
      clearInterval(historyInterval);
    };
  }, []);

  const assessment = calculateHealthAssessment(latestData);
  const currentCondition = latestData?.condition || "NORMAL";

  // Combine live active alert with recent event log (deduplicated)
  const displayAlerts =
    assessment.alerts.length > 0
      ? [
          assessment.alerts[0],
          ...alertHistory.filter(
            (a) => !a.id.startsWith(assessment.alerts[0]?.id.split("-")[1] || "###")
          ),
        ].slice(0, 6)
      : alertHistory.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* Header */}
      <Header
        conveyorId={latestData?.conveyor_id || "BC01"}
        isBackendConnected={isBackendConnected}
        isMqttConnected={isMqttConnected}
        hasData={latestData !== null}
        lastUpdated={lastUpdatedTime}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Backend Offline Banner */}
        {!isBackendConnected && (
          <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-4 flex items-center justify-between gap-3 text-rose-900 text-sm shadow-xs">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900">FastAPI Backend is Offline</p>
                <p className="text-xs text-rose-700">
                  Ensure FastAPI is running on port 8000 (<code className="bg-rose-100/80 px-1 py-0.5 rounded font-mono">uvicorn main:app --reload</code>). Auto-reconnecting...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
              <span>Polling</span>
            </div>
          </div>
        )}

        {/* Condition & Severity Banner */}
        <ConditionBanner condition={currentCondition} assessment={assessment} />

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TelemetryCard
            title="Bearing Temperature"
            value={latestData?.temperature}
            unit="°C"
            icon="temperature"
            nominalRange="30.0 - 35.0 °C"
            condition={currentCondition}
          />
          <TelemetryCard
            title="Vibration Velocity"
            value={latestData?.vibration}
            unit="mm/s"
            icon="vibration"
            nominalRange="1.5 - 2.5 mm/s"
            condition={currentCondition}
          />
          <TelemetryCard
            title="Belt Linear Speed"
            value={latestData?.speed}
            unit="m/s"
            icon="speed"
            nominalRange="1.35 - 1.45 m/s"
            condition={currentCondition}
          />
          <TelemetryCard
            title="Motor Current Draw"
            value={latestData?.current}
            unit="A"
            icon="current"
            nominalRange="1.4 - 1.8 A"
            condition={currentCondition}
          />
        </div>

        {/* Prototype Health Engine Section */}
        <HealthOverview assessment={assessment} />

        {/* Conveyor 2D Schematic System View */}
        <ConveyorSystemView assessment={assessment} condition={currentCondition} />

        {/* Lower Grid: Live Charts & Alerts Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Charts (Spans 2 columns on wide screens) */}
          <div className="lg:col-span-2">
            <TelemetryCharts history={historyData} />
          </div>

          {/* Recent Alerts (Spans 1 column) */}
          <div className="lg:col-span-1">
            <AlertsPanel
              alerts={displayAlerts}
              riskLevel={assessment.riskLevel}
              condition={currentCondition}
            />
          </div>
        </div>

        {/* SIH Architecture Demo Pipeline Roadmap Box */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 text-xs text-slate-600 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 uppercase tracking-wider">
              Data Pipeline & Architecture Overview
            </span>
            <span className="text-[11px] font-mono text-slate-500">Smart India Hackathon SIH26008</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-600">
            <span className="bg-slate-50 px-2 py-1 rounded text-slate-700 border border-slate-200">Simulated ESP32 Telemetry</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-50 px-2 py-1 rounded text-emerald-800 border border-slate-200">Mosquitto MQTT (1883)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-50 px-2 py-1 rounded text-sky-800 border border-slate-200">FastAPI Async Subscriber</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-50 px-2 py-1 rounded text-indigo-800 border border-slate-200">PostgreSQL (sih26008)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-50 px-2 py-1 rounded text-amber-800 border border-slate-200">Health Engine</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-sky-50 px-2 py-1 rounded text-sky-800 border border-sky-200 font-bold">Next.js Live Dashboard</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white/70 border-t border-slate-200/90 py-3.5 px-6 text-center text-xs text-slate-500 font-medium">
        SIH26008 • Intelligent Monitoring and Prediction of Conveyor Belt Joint Rupture & Damage • NMDC Mining Problem Statement
      </footer>
    </div>
  );
}
