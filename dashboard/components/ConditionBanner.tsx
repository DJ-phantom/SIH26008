"use client";

import React from "react";
import { ShieldCheck, AlertCircle, AlertOctagon, Flame, Wrench, Zap } from "lucide-react";
import { HealthAssessment } from "../types/telemetry";

interface ConditionBannerProps {
  condition: string;
  assessment: HealthAssessment;
}

export const ConditionBanner: React.FC<ConditionBannerProps> = ({
  condition,
  assessment,
}) => {
  const normCondition = (condition || "NORMAL").toUpperCase();

  const getConditionConfig = () => {
    switch (normCondition) {
      case "OVERLOAD":
        return {
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          title: "OVERLOAD CONDITION",
          badgeColor: "bg-amber-950/80 text-amber-300 border-amber-700",
          bannerBg: "bg-amber-950/20 border-amber-800/40",
          riskBadge: "bg-amber-900/60 text-amber-300 border-amber-700",
        };
      case "MISALIGNMENT":
        return {
          icon: <AlertCircle className="w-5 h-5 text-purple-400" />,
          title: "BELT MISALIGNMENT",
          badgeColor: "bg-purple-950/80 text-purple-300 border-purple-700",
          bannerBg: "bg-purple-950/20 border-purple-800/40",
          riskBadge: "bg-purple-900/60 text-purple-300 border-purple-700",
        };
      case "ROLLER_FAULT":
        return {
          icon: <Wrench className="w-5 h-5 text-rose-400" />,
          title: "ROLLER BEARING FAULT",
          badgeColor: "bg-rose-950/80 text-rose-300 border-rose-700",
          bannerBg: "bg-rose-950/20 border-rose-800/40",
          riskBadge: "bg-rose-900/60 text-rose-300 border-rose-700",
        };
      case "FRICTION":
        return {
          icon: <Flame className="w-5 h-5 text-red-400" />,
          title: "FRICTION & THERMAL ELEVATION",
          badgeColor: "bg-red-950/80 text-red-300 border-red-700",
          bannerBg: "bg-red-950/20 border-red-800/40",
          riskBadge: "bg-red-900/60 text-red-300 border-red-700",
        };
      case "NORMAL":
      default:
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          title: "NORMAL OPERATION",
          badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-700",
          bannerBg: "bg-emerald-950/20 border-emerald-800/40",
          riskBadge: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
        };
    }
  };

  const config = getConditionConfig();

  return (
    <div
      className={`w-full rounded-xl border p-4 ${config.bannerBg} backdrop-blur-sm transition-all duration-300 shadow-md`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Simulated Condition:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono tracking-wide border ${config.badgeColor}`}
              >
                {normCondition}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${config.riskBadge}`}
              >
                Level: {assessment.riskLevel}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              {assessment.conditionDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          <span className="text-slate-500">Demo Mode State:</span>
          <span className="text-cyan-300 font-medium font-mono">{assessment.riskLabel}</span>
        </div>
      </div>
    </div>
  );
};
