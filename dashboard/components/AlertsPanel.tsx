"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, ShieldCheck, Bell } from "lucide-react";
import { DemoAlert, RiskLevel } from "../types/telemetry";

interface AlertsPanelProps {
  alerts: DemoAlert[];
  riskLevel: RiskLevel;
  condition: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, riskLevel, condition }) => {
  const normCond = (condition || "NORMAL").toUpperCase();

  const getAlertIcon = (level: "info" | "warning" | "critical") => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getAlertBadge = (level: "info" | "warning" | "critical") => {
    switch (level) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "warning":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "info":
      default:
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Recent Alerts Panel
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {alerts.length > 0 ? `${alerts.length} Active` : "0 Active"}
          </span>
        </div>

        {/* Alerts List */}
        <div className="mt-3.5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 flex flex-col gap-1.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.level)}
                    <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getAlertBadge(alert.level)}`}>
                    {alert.level.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-400 pl-6">{alert.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pl-6 pt-1 font-mono">
                  <span>Target: {alert.component}</span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-4 flex items-center gap-3 text-emerald-300 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">No Active Critical Alerts</p>
                <p className="text-emerald-400/80 text-[11px] mt-0.5">
                  Conveyor telemetry parameters are operating within nominal thresholds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Rule-based prototype diagnostics</span>
        <span className="font-mono text-cyan-400/80">SIH26008 Engine</span>
      </div>
    </div>
  );
};
