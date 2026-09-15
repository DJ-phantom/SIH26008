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
          icon: <Zap className="w-5 h-5 text-amber-600" />,
          title: "OVERLOAD CONDITION",
          badgeColor: "bg-amber-100/80 text-amber-900 border-amber-300/80",
          bannerBg: "bg-amber-50/70 border-amber-200/90",
          riskBadge: "bg-amber-100/70 text-amber-900 border-amber-300/70",
        };
      case "MISALIGNMENT":
        return {
          icon: <AlertCircle className="w-5 h-5 text-indigo-600" />,
          title: "BELT MISALIGNMENT",
          badgeColor: "bg-indigo-100/80 text-indigo-900 border-indigo-300/80",
          bannerBg: "bg-indigo-50/70 border-indigo-200/90",
          riskBadge: "bg-indigo-100/70 text-indigo-900 border-indigo-300/70",
        };
      case "ROLLER_FAULT":
        return {
          icon: <Wrench className="w-5 h-5 text-rose-600" />,
          title: "ROLLER BEARING FAULT",
          badgeColor: "bg-rose-100/80 text-rose-900 border-rose-300/80",
          bannerBg: "bg-rose-50/70 border-rose-200/90",
          riskBadge: "bg-rose-100/70 text-rose-900 border-rose-300/70",
        };
      case "FRICTION":
        return {
          icon: <Flame className="w-5 h-5 text-rose-600" />,
          title: "FRICTION & THERMAL ELEVATION",
          badgeColor: "bg-rose-100/80 text-rose-900 border-rose-300/80",
          bannerBg: "bg-rose-50/70 border-rose-200/90",
          riskBadge: "bg-rose-100/70 text-rose-900 border-rose-300/70",
        };
      case "NORMAL":
      default:
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          title: "NORMAL OPERATION",
          badgeColor: "bg-emerald-100/80 text-emerald-900 border-emerald-300/80",
          bannerBg: "bg-emerald-50/50 border-emerald-200/90",
          riskBadge: "bg-emerald-100/70 text-emerald-900 border-emerald-300/70",
        };
    }
  };

  const config = getConditionConfig();

  return (
    <div
      className={`w-full rounded-xl border p-4 ${config.bannerBg} transition-colors shadow-xs`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Simulated Condition:
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono tracking-wide border ${config.badgeColor}`}
              >
                {normCondition}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${config.riskBadge}`}
              >
                Level: {assessment.riskLevel}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 mt-1 font-medium">
              {assessment.conditionDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-xs shrink-0">
          <span className="text-slate-400">Demo State:</span>
          <span className="text-slate-900 font-semibold font-mono">{assessment.riskLabel}</span>
        </div>
      </div>
    </div>
  );
};
