"use client";

import React from "react";
import { HardDrive, RotateCw, Activity, Layers, CircleDot, ChevronRight, Eye } from "lucide-react";
import { HealthAssessment } from "../types/telemetry";

interface ConveyorSystemViewProps {
  assessment: HealthAssessment;
  condition: string;
}

export const ConveyorSystemView: React.FC<ConveyorSystemViewProps> = ({
  assessment,
  condition,
}) => {
  const normCond = (condition || "NORMAL").toUpperCase();
  const comps = assessment.components;

  const getCompBadge = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "critical":
        return "bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse";
      case "warning":
        return "bg-amber-950/90 text-amber-300 border-amber-600";
      case "healthy":
      default:
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Conveyor System View</span>
              <span className="text-[11px] font-semibold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                2D Schematic Panel
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Component-level status representation for industrial supervision
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Flow: Tail Pulley → Carry Strand → Drive Head
        </div>
      </div>

      {/* 2D Schematic Graphic / Flow Representation */}
      <div className="mt-5 bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 lg:p-6 overflow-x-auto">
        <div className="min-w-[700px] flex items-center justify-between gap-2 relative">
          {/* Component 1: Tail Pulley */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.tailPulley.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-600 flex items-center justify-center bg-slate-800 text-slate-300 mb-2">
              <RotateCw className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-slate-200">Tail Pulley</span>
            <span className="text-[10px] text-slate-400 font-mono">Return Zone</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.tailPulley.status)}`}>
              {comps.tailPulley.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

          {/* Component 2: Splice Joint */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.spliceJoint.status === "critical"
                ? "border-rose-600/90 bg-rose-950/30"
                : comps.spliceJoint.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-purple-600/70 flex items-center justify-center bg-purple-950/50 text-purple-300 mb-2">
              <CircleDot className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Splice Joint</span>
            <span className="text-[10px] text-slate-400 font-mono">Joint Zone J1</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.spliceJoint.status)}`}>
              {comps.spliceJoint.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

          {/* Component 3: Roller / Idler Zone */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.rollerZone.status === "critical"
                ? "border-rose-600/90 bg-rose-950/30 shadow-lg shadow-rose-900/20"
                : comps.rollerZone.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-cyan-600/70 flex items-center justify-center bg-cyan-950/50 text-cyan-300 mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Roller Idler Zone</span>
            <span className="text-[10px] text-slate-400 font-mono">Sensors S1-S3</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.rollerZone.status)}`}>
              {comps.rollerZone.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

          {/* Component 4: Belt Carry Strand */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.beltStrand.status === "critical"
                ? "border-purple-600/90 bg-purple-950/30 shadow-lg shadow-purple-900/20"
                : comps.beltStrand.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-emerald-600/70 flex items-center justify-center bg-emerald-950/50 text-emerald-300 mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Carry Strand</span>
            <span className="text-[10px] text-slate-400 font-mono">Steel Cord Belt</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.beltStrand.status)}`}>
              {comps.beltStrand.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

          {/* Component 5: Drive Pulley */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.drivePulley.status === "critical"
                ? "border-rose-600/90 bg-rose-950/30"
                : comps.drivePulley.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-amber-600/70 flex items-center justify-center bg-amber-950/50 text-amber-300 mb-2">
              <RotateCw className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-200">Drive Pulley</span>
            <span className="text-[10px] text-slate-400 font-mono">Head Discharge</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.drivePulley.status)}`}>
              {comps.drivePulley.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

          {/* Component 6: Motor & Gearbox Unit */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
              comps.motor.status === "critical"
                ? "border-amber-500/90 bg-amber-950/30 shadow-lg shadow-amber-900/20 animate-pulse"
                : comps.motor.status === "warning"
                ? "border-amber-600/80 bg-amber-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-blue-600/70 flex items-center justify-center bg-blue-950/50 text-blue-300 mb-2">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Motor Unit</span>
            <span className="text-[10px] text-slate-400 font-mono">3-Phase Drive</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompBadge(comps.motor.status)}`}>
              {comps.motor.detail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
