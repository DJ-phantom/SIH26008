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
        return <Thermometer className="w-5 h-5 text-rose-600" />;
      case "vibration":
        return <Activity className="w-5 h-5 text-cyan-600" />;
      case "speed":
        return <Gauge className="w-5 h-5 text-emerald-600" />;
      case "current":
        return <Zap className="w-5 h-5 text-amber-600" />;
    }
  };

  // Status computation for individual metric display
  const getMetricStatus = (): { label: string; color: string; bg: string; border: string } => {
    if (value === null || value === undefined) {
      return { label: "No Data", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
    }

    if (icon === "temperature") {
      if (value > 50) return { label: "Critical Temp", color: "text-rose-800", bg: "bg-rose-50", border: "border-rose-200" };
      if (value > 37) return { label: "Elevated", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" };
      return { label: "Nominal", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
    }

    if (icon === "vibration") {
      if (value > 4.0) return { label: "High Vibration", color: "text-rose-800", bg: "bg-rose-50", border: "border-rose-200" };
      if (value > 2.8) return { label: "Moderate", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" };
      return { label: "Nominal", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
    }

    if (icon === "current") {
      if (value > 2.4) return { label: "High Load", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" };
      if (value > 1.9) return { label: "Moderate Load", color: "text-sky-800", bg: "bg-sky-50", border: "border-sky-200" };
      return { label: "Nominal", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
    }

    // Speed
    if (value < 1.3) return { label: "Reduced Speed", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" };
    return { label: "Nominal Speed", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
  };

  const status = getMetricStatus();

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 hover:border-slate-300/90 transition-colors shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
          {getIcon()}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="flex items-baseline gap-1.5 my-1.5">
        <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
          {value !== null && value !== undefined ? value.toFixed(2) : "--"}
        </span>
        <span className="text-xs font-semibold text-slate-500 font-mono">
          {unit}
        </span>
      </div>

      {/* Status Badge & Range Subtext */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs mt-2">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${status.bg} ${status.color} ${status.border}`}
        >
          {status.label}
        </span>
        <span className="text-slate-500 font-mono text-[10px]">
          Nominal: {nominalRange}
        </span>
      </div>
    </div>
  );
};
