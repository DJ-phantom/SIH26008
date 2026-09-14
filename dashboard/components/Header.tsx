"use client";

import React from "react";
import { Activity, Radio, AlertTriangle, ShieldCheck, Database } from "lucide-react";

interface HeaderProps {
  conveyorId: string;
  isBackendConnected: boolean;
  isMqttConnected: boolean;
  hasData: boolean;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  conveyorId,
  isBackendConnected,
  isMqttConnected,
  hasData,
  lastUpdated,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3.5 sticky top-0 z-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Conveyor ID */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                SIH26008
              </span>
              <h1 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
                Intelligent Conveyor Health Monitoring System
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>NMDC Iron Ore Conveyor Predictive Maintenance</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono font-medium">Conveyor Unit: <strong className="text-cyan-300">{conveyorId}</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Status Indicators & Prototype Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
              isBackendConnected && isMqttConnected && hasData
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-700/60"
                : isBackendConnected
                ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                : "bg-rose-950/80 text-rose-300 border-rose-700/60"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected && isMqttConnected && hasData
                  ? "bg-emerald-400 animate-ping"
                  : isBackendConnected
                  ? "bg-amber-400 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span>
              {!isBackendConnected
                ? "BACKEND OFFLINE"
                : !isMqttConnected
                ? "BROKER WAITING"
                : !hasData
                ? "WAITING FOR TELEMETRY"
                : "LIVE TELEMETRY"}
            </span>
          </div>

          {/* Timestamp Indicator */}
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-md font-mono">
              <span className="text-slate-500">Updated:</span>
              <span className="text-slate-200">{lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Prototype Demo Disclaimer Bar */}
      <div className="mt-2.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-900/50 rounded-md flex items-center justify-between text-xs text-cyan-200/90">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>Prototype Demo Mode</strong> — Telemetry currently generated from simulated operating scenarios for software pipeline validation.
          </span>
        </div>
        <span className="hidden lg:inline text-[11px] text-cyan-400/70 font-mono">
          FastAPI → Mosquitto MQTT → PostgreSQL
        </span>
      </div>
    </header>
  );
};
