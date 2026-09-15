"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { TelemetryData } from "../types/telemetry";
import { LineChart as ChartIcon, LayoutGrid, Maximize2 } from "lucide-react";

interface TelemetryChartsProps {
  history: TelemetryData[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history }) => {
  const [activeTab, setActiveTab] = useState<"all" | "temperature" | "vibration" | "speed" | "current">("all");

  // Format data for Recharts
  const chartData = history.map((item) => {
    const date = new Date(item.timestamp);
    const timeLabel = !isNaN(date.getTime())
      ? date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : item.timestamp;

    return {
      time: timeLabel,
      temperature: item.temperature,
      vibration: item.vibration,
      speed: item.speed,
      current: item.current,
      condition: item.condition,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200/90 p-2.5 rounded-lg shadow-md text-xs font-mono">
          <p className="text-slate-500 mb-1">Time: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {data.condition && (
            <p className="text-slate-600 mt-1 pt-1 border-t border-slate-100 text-[10px]">
              Condition: <strong className="text-slate-800">{data.condition}</strong>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center text-slate-500 shadow-xs">
        <p className="text-sm">No historical telemetry available yet. Waiting for sensor packets...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      {/* Header & Metric Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <ChartIcon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Telemetry Trends</h2>
            <p className="text-xs text-slate-500">
              Real-time time-series buffer ({chartData.length} records)
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/90 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveTab("temperature")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "temperature" ? "bg-rose-50 text-rose-800 border border-rose-200 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveTab("vibration")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "vibration" ? "bg-sky-50 text-sky-800 border border-sky-200 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vibration
          </button>
          <button
            onClick={() => setActiveTab("speed")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "speed" ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Speed
          </button>
          <button
            onClick={() => setActiveTab("current")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "current" ? "bg-amber-50 text-amber-800 border border-amber-200 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Current
          </button>
        </div>
      </div>

      {/* Charts Grid or Focused Chart */}
      <div className="mt-5">
        {activeTab === "all" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Temperature */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Bearing Temperature (°C)
                </span>
                <span className="text-[11px] text-rose-700 font-mono">Nominal: 30 - 35°C</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#e11d48" strokeWidth={1.8} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Vibration */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Vibration Velocity (mm/s)
                </span>
                <span className="text-[11px] text-sky-700 font-mono">Nominal: 1.5 - 2.5 mm/s</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#0284c7" strokeWidth={1.8} fillOpacity={1} fill="url(#colorVib)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Belt Speed */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Belt Linear Speed (m/s)
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">Nominal: 1.35 - 1.45 m/s</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="speed" name="Speed (m/s)" stroke="#059669" strokeWidth={1.8} fillOpacity={1} fill="url(#colorSpeed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Motor Current */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Motor Current (A)
                </span>
                <span className="text-[11px] text-amber-700 font-mono">Nominal: 1.4 - 1.8 A</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="current" name="Current (A)" stroke="#d97706" strokeWidth={1.8} fillOpacity={1} fill="url(#colorCurrent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          /* Focused Single Metric Large Chart */
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocused" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          activeTab === "temperature"
                            ? "#e11d48"
                            : activeTab === "vibration"
                            ? "#0284c7"
                            : activeTab === "speed"
                            ? "#059669"
                            : "#d97706"
                        }
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          activeTab === "temperature"
                            ? "#e11d48"
                            : activeTab === "vibration"
                            ? "#0284c7"
                            : activeTab === "speed"
                            ? "#059669"
                            : "#d97706"
                        }
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={activeTab}
                    name={activeTab.toUpperCase()}
                    stroke={
                      activeTab === "temperature"
                        ? "#e11d48"
                        : activeTab === "vibration"
                        ? "#0284c7"
                        : activeTab === "speed"
                        ? "#059669"
                        : "#d97706"
                    }
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFocused)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
