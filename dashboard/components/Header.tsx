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
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 py-3 sticky top-0 z-30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Conveyor ID */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 shrink-0">
            <Activity className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                SIH26008
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-slate-700 bg-slate-100/90 border border-slate-200/90 px-1.5 py-0.5 rounded font-mono">
                Team SRIJAN
              </span>
              <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                Intelligent Conveyor Health Monitoring System
              </h1>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>NMDC Iron Ore Conveyor Predictive Maintenance</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-mono text-[11px]">
                Conveyor Unit: <strong className="text-slate-900 font-semibold">{conveyorId}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Right: Status Indicators & Prototype Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isBackendConnected && isMqttConnected && hasData
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isBackendConnected
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected && isMqttConnected && hasData
                  ? "bg-emerald-500"
                  : isBackendConnected
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wide">
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-mono">
              <span className="text-slate-400">Updated:</span>
              <span className="text-slate-700 font-medium">{lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Prototype Demo Disclaimer Bar */}
      <div className="mt-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong className="text-slate-800 font-semibold">Prototype Demo Mode</strong> — Telemetry generated from simulated operating scenarios for pipeline validation.
          </span>
        </div>
        <span className="hidden lg:inline text-[11px] text-slate-500 font-mono">
          FastAPI → Mosquitto MQTT → PostgreSQL
        </span>
      </div>
    </header>
  );
};
