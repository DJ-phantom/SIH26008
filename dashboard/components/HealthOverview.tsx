"use client";

import React from "react";
import { Activity, ShieldAlert, Cpu, Layers, Disc, CircleDot } from "lucide-react";
import { HealthAssessment } from "../types/telemetry";

interface HealthOverviewProps {
  assessment: HealthAssessment;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({ assessment }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: "text-emerald-400", bar: "bg-emerald-500", glow: "shadow-emerald-500/20" };
    if (score >= 65) return { text: "text-amber-400", bar: "bg-amber-500", glow: "shadow-amber-500/20" };
    if (score >= 45) return { text: "text-orange-400", bar: "bg-orange-500", glow: "shadow-orange-500/20" };
    return { text: "text-rose-400", bar: "bg-rose-500", glow: "shadow-rose-500/20" };
  };

  const overallColors = getScoreColor(assessment.overallScore);
  const beltColors = getScoreColor(assessment.beltScore);
  const spliceColors = getScoreColor(assessment.spliceScore);
  const driveColors = getScoreColor(assessment.driveScore);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
      {/* Title & Heuristic Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Prototype Health Engine</span>
              <span className="text-[11px] font-semibold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Rule-Based Demo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Heuristic assessment • Will be replaced with ML + sensor-fusion models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto font-mono">
          <span>Overall Status:</span>
          <span className={`font-bold ${overallColors.text}`}>{assessment.riskLabel}</span>
        </div>
      </div>

      {/* Grid: Big Radial/Overall Score + Sub-system Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        {/* Overall Conveyor Health Box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Overall Conveyor Health
          </span>
          <div className="relative flex items-center justify-center my-1">
            <span className={`text-4xl font-black font-mono tracking-tight ${overallColors.text}`}>
              {assessment.overallScore}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${overallColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.overallScore}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            Composite index from all sensors
          </span>
        </div>

        {/* Belt Carcass Health */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Belt Carcass Health</span>
              </div>
              <span className={`text-sm font-bold font-mono ${beltColors.text}`}>
                {assessment.beltScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Surface wear, lateral tracking, and thermal stress
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${beltColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.beltScore}%` }}
            />
          </div>
        </div>

        {/* Splice Joint Health */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <CircleDot className="w-4 h-4 text-purple-400" />
                <span>Splice Joint Health</span>
              </div>
              <span className={`text-sm font-bold font-mono ${spliceColors.text}`}>
                {assessment.spliceScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Vulcanized joint tension and rupture risk index
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${spliceColors.bar} transition-all duration-500`}
              style={{ width: `${assessment.spliceScore}%` }}
            />
          </div>
        </div>

        {/* Drive & Mechanical Health */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Disc className="w-4 h-4 text-amber-400" />
                <span>Drive & Mechanical</span>
              </div>
              <span className={`text-sm font-bold font-mono ${driveColors.text}`}>
                {assessment.driveScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Motor load, drive pulley traction, and idler vibration
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
