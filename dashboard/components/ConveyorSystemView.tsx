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
        return "bg-rose-50 text-rose-800 border-rose-200 font-semibold";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
      case "healthy":
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <Eye className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Conveyor System View</span>
              <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                2D Schematic Panel
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Component-level status representation for industrial supervision
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Flow: Tail Pulley → Carry Strand → Drive Head
        </div>
      </div>

      {/* 2D Schematic Graphic / Flow Representation */}
      <div className="mt-5 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 lg:p-5 overflow-x-auto">
        <div className="min-w-[700px] flex items-center justify-between gap-2 relative">
          {/* Component 1: Tail Pulley */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.tailPulley.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <RotateCw className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Tail Pulley</span>
            <span className="text-[10px] text-slate-400 font-mono">Return Zone</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.tailPulley.status)}`}>
              {comps.tailPulley.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Component 2: Splice Joint */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.spliceJoint.status === "critical"
                ? "border-rose-300/80 bg-rose-50/60"
                : comps.spliceJoint.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <CircleDot className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Splice Joint</span>
            <span className="text-[10px] text-slate-400 font-mono">Joint Zone J1</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.spliceJoint.status)}`}>
              {comps.spliceJoint.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Component 3: Roller / Idler Zone */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.rollerZone.status === "critical"
                ? "border-rose-300/80 bg-rose-50/60"
                : comps.rollerZone.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Roller Idler Zone</span>
            <span className="text-[10px] text-slate-400 font-mono">Sensors S1-S3</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.rollerZone.status)}`}>
              {comps.rollerZone.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Component 4: Belt Carry Strand */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.beltStrand.status === "critical"
                ? "border-rose-300/80 bg-rose-50/60"
                : comps.beltStrand.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Carry Strand</span>
            <span className="text-[10px] text-slate-400 font-mono">Steel Cord Belt</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.beltStrand.status)}`}>
              {comps.beltStrand.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Component 5: Drive Pulley */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.drivePulley.status === "critical"
                ? "border-rose-300/80 bg-rose-50/60"
                : comps.drivePulley.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <RotateCw className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Drive Pulley</span>
            <span className="text-[10px] text-slate-400 font-mono">Head Discharge</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.drivePulley.status)}`}>
              {comps.drivePulley.detail}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Component 6: Motor & Gearbox Unit */}
          <div
            className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors shadow-xs ${
              comps.motor.status === "critical"
                ? "border-amber-400/80 bg-amber-50/60"
                : comps.motor.status === "warning"
                ? "border-amber-300/80 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-700 mb-1.5 shadow-2xs">
              <HardDrive className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Motor Unit</span>
            <span className="text-[10px] text-slate-400 font-mono">3-Phase Drive</span>
            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] border ${getCompBadge(comps.motor.status)}`}>
              {comps.motor.detail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
