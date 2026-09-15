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
        return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-sky-600 shrink-0" />;
    }
  };

  const getAlertBadge = (level: "info" | "warning" | "critical") => {
    switch (level) {
      case "critical":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "info":
      default:
        return "bg-sky-50 text-sky-800 border-sky-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Alerts Panel
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {alerts.length > 0 ? `${alerts.length} Active` : "0 Active"}
          </span>
        </div>

        {/* Alerts List */}
        <div className="mt-3.5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 flex flex-col gap-1.5 transition-colors hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.level)}
                    <span className="text-xs font-semibold text-slate-800">{alert.title}</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border ${getAlertBadge(alert.level)}`}>
                    {alert.level.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{alert.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-6 pt-1 font-mono">
                  <span>Target: <strong className="text-slate-600 font-medium">{alert.component}</strong></span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-lg p-3.5 flex items-center gap-3 text-emerald-800 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">No Active Critical Alerts</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Conveyor telemetry parameters are operating within nominal thresholds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Rule-based diagnostics</span>
        <span className="text-slate-600">SIH26008 Engine</span>
      </div>
    </div>
  );
};
