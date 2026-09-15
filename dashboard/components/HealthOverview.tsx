"use client";

import React from "react";
import { Activity, ShieldAlert, Cpu, Layers, Disc, CircleDot } from "lucide-react";
import { HealthAssessment } from "../types/telemetry";

interface HealthOverviewProps {
  assessment: HealthAssessment;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({ assessment }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: "text-emerald-700", bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (score >= 65) return { text: "text-amber-800", bar: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
    if (score >= 45) return { text: "text-orange-800", bar: "bg-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    return { text: "text-rose-800", bar: "bg-rose-500", bg: "bg-rose-50", border: "border-rose-200" };
  };

  const overallColors = getScoreColor(assessment.overallScore);
  const beltColors = getScoreColor(assessment.beltScore);
  const spliceColors = getScoreColor(assessment.spliceScore);
  const driveColors = getScoreColor(assessment.driveScore);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      {/* Title & Heuristic Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <Cpu className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Prototype Health Engine</span>
              <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Rule-Based Demo
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Heuristic assessment • Designed for integration with ML & sensor-fusion models
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border self-start sm:self-auto font-mono ${overallColors.bg} ${overallColors.border}`}>
          <span className="text-slate-600">Overall Status:</span>
          <span className={`font-bold ${overallColors.text}`}>{assessment.riskLabel}</span>
        </div>
      </div>

      {/* Grid: Big Overall Score + Sub-system Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        {/* Overall Conveyor Health Box */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Overall Conveyor Health
          </span>
          <div className="relative flex items-center justify-center my-1">
            <span className={`text-4xl font-bold font-mono tracking-tight ${overallColors.text}`}>
              {assessment.overallScore}%
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full ${overallColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.overallScore}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">
            Composite index from all sensors
          </span>
        </div>

        {/* Belt Carcass Health */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Belt Carcass Health</span>
              </div>
              <span className={`text-xs font-bold font-mono ${beltColors.text}`}>
                {assessment.beltScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-tight">
              Surface wear, lateral tracking, and thermal stress
            </p>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${beltColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.beltScore}%` }}
            />
          </div>
        </div>

        {/* Splice Joint Health */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <CircleDot className="w-3.5 h-3.5 text-slate-500" />
                <span>Splice Joint Health</span>
              </div>
              <span className={`text-xs font-bold font-mono ${spliceColors.text}`}>
                {assessment.spliceScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-tight">
              Vulcanized joint tension and rupture risk index
            </p>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${spliceColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.spliceScore}%` }}
            />
          </div>
        </div>

        {/* Drive & Mechanical Health */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <Disc className="w-3.5 h-3.5 text-slate-500" />
                <span>Drive & Mechanical</span>
              </div>
              <span className={`text-xs font-bold font-mono ${driveColors.text}`}>
                {assessment.driveScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-tight">
              Motor load, drive pulley traction, and idler vibration
            </p>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${driveColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.driveScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
