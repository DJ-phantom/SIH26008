"use client";

import React from "react";
import { LucideIcon, Thermometer, Activity, Gauge, Zap } from "lucide-react";

interface TelemetryCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  icon: "temperature" | "vibration" | "speed" | "current";
  nominalRange: string;
  condition: string;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  title,
  value,
  unit,
  icon,
  nominalRange,
  condition,
}) => {
  const getIcon = (): React.ReactNode => {
    switch (icon) {
      case "temperature":
        return <Thermometer className="w-5 h-5 text-rose-400" />;
      case "vibration":
        return <Activity className="w-5 h-5 text-cyan-400" />;
      case "speed":
        return <Gauge className="w-5 h-5 text-emerald-400" />;
      case "current":
        return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  // Status computation for individual metric display
  const getMetricStatus = (): { label: string; color: string; bg: string; border: string } => {
    if (value === null || value === undefined) {
      return { label: "No Data", color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
    }

    if (icon === "temperature") {
      if (value > 50) return { label: "Critical Temp", color: "text-rose-400", bg: "bg-rose-950/60", border: "border-rose-800" };
      if (value > 37) return { label: "Elevated", color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-800" };
      return { label: "Nominal", color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800" };
    }

    if (icon === "vibration") {
      if (value > 4.0) return { label: "High Vibration", color: "text-rose-400", bg: "bg-rose-950/60", border: "border-rose-800" };
      if (value > 2.8) return { label: "Moderate", color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-800" };
      return { label: "Nominal", color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800" };
    }

    if (icon === "current") {
      if (value > 2.4) return { label: "High Load", color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-800" };
      if (value > 1.9) return { label: "Moderate Load", color: "text-blue-400", bg: "bg-blue-950/60", border: "border-blue-800" };
      return { label: "Nominal", color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800" };
    }

    // Speed
    if (value < 1.3) return { label: "Reduced Speed", color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-800" };
    return { label: "Nominal Speed", color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800" };
  };

  const status = getMetricStatus();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all duration-200 shadow-lg shadow-black/20 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
          {getIcon()}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl lg:text-4xl font-extrabold font-mono text-slate-100 tracking-tight">
          {value !== null && value !== undefined ? value.toFixed(2) : "--"}
        </span>
        <span className="text-sm font-medium text-slate-400 font-mono">
          {unit}
        </span>
      </div>

      {/* Status Badge & Range Subtext */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.bg} ${status.color} ${status.border}`}
        >
          {status.label}
        </span>
        <span className="text-slate-500 font-mono text-[11px]">
          Nominal: {nominalRange}
        </span>
      </div>
    </div>
  );
};
