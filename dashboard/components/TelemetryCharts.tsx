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
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 mb-1">Time: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {data.condition && (
            <p className="text-slate-300 mt-1 pt-1 border-t border-slate-800 text-[10px]">
              Condition: <strong className="text-cyan-400">{data.condition}</strong>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <p className="text-sm">No historical telemetry available yet. Waiting for sensor packets...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
      {/* Header & Metric Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Live Telemetry Trends</h2>
            <p className="text-xs text-slate-400">
              Real-time time-series buffer ({chartData.length} records)
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "all" ? "bg-slate-800 text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveTab("temperature")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "temperature" ? "bg-rose-950/70 text-rose-300 border border-rose-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveTab("vibration")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "vibration" ? "bg-cyan-950/70 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Vibration
          </button>
          <button
            onClick={() => setActiveTab("speed")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "speed" ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Speed
          </button>
          <button
            onClick={() => setActiveTab("current")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "current" ? "bg-amber-950/70 text-amber-300 border border-amber-800/60" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Current
          </button>
        </div>
      </div>

      {/* Charts Grid or Focused Chart */}
      <div className="mt-5">
        {activeTab === "all" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Temperature */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Bearing Temperature (°C)
                </span>
                <span className="text-[11px] text-rose-400 font-mono">Nominal: 30 - 35°C</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Vibration */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Vibration Velocity (mm/s)
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">Nominal: 1.5 - 2.5 mm/s</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVib)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Belt Speed */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Belt Linear Speed (m/s)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">Nominal: 1.35 - 1.45 m/s</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="speed" name="Speed (m/s)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Motor Current */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Motor Current (A)
                </span>
                <span className="text-[11px] text-amber-400 font-mono">Nominal: 1.4 - 1.8 A</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="current" name="Current (A)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          /* Focused Single Metric Large Chart */
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocused" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          activeTab === "temperature"
                            ? "#f43f5e"
                            : activeTab === "vibration"
                            ? "#06b6d4"
                            : activeTab === "speed"
                            ? "#10b981"
                            : "#f59e0b"
                        }
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          activeTab === "temperature"
                            ? "#f43f5e"
                            : activeTab === "vibration"
                            ? "#06b6d4"
                            : activeTab === "speed"
                            ? "#10b981"
                            : "#f59e0b"
                        }
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={activeTab}
                    name={activeTab.toUpperCase()}
                    stroke={
                      activeTab === "temperature"
                        ? "#f43f5e"
                        : activeTab === "vibration"
                        ? "#06b6d4"
                        : activeTab === "speed"
                        ? "#10b981"
                        : "#f59e0b"
                    }
                    strokeWidth={2.5}
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
