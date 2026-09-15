"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import { TelemetryData } from "../../types/telemetry";
import {
  TrendingUp,
  Download,
  Filter,
  BarChart2,
  Layers,
  Activity,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function AnalyticsPage() {
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [limit, setLimit] = useState(50);
  const [conditionFilter, setConditionFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url =
        conditionFilter === "All"
          ? `${API_BASE_URL}/telemetry/history?limit=${limit}`
          : `${API_BASE_URL}/telemetry/history?limit=${limit}&condition=${conditionFilter}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data: TelemetryData[] = await res.json();
        setHistory([...data].reverse());
      }
    } catch (e) {
      console.error("Failed to fetch analytics telemetry", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [limit, conditionFilter]);

  // Descriptive Statistics Calculation
  const stats = React.useMemo(() => {
    if (history.length === 0) return null;
    const calcStats = (key: keyof TelemetryData) => {
      const vals = history.map((h) => Number(h[key]) || 0);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { min, max, avg };
    };

    return {
      temp: calcStats("temperature"),
      vib: calcStats("vibration"),
      speed: calcStats("speed"),
      current: calcStats("current"),
      count: history.length,
    };
  }, [history]);

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = "id,conveyor_id,timestamp,temperature,vibration,speed,current,condition\n";
    const rows = history
      .map(
        (h) =>
          `${h.id || ""},${h.conveyor_id},${h.timestamp},${h.temperature},${h.vibration},${h.speed},${h.current},${h.condition}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conveyor_telemetry_analytics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        conveyorId="BC01"
        isBackendConnected={true}
        isMqttConnected={true}
        hasData={history.length > 0}
        lastUpdated="Analytics Database Synced"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                Telemetry Analytics & Historical Trends
              </h1>
              <p className="text-xs text-slate-400">
                Deep-dive statistical analysis, sensor distributions, and condition comparisons from PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV Dataset</span>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Condition:</span>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Conditions</option>
                <option value="NORMAL" className="bg-slate-900">NORMAL</option>
                <option value="OVERLOAD" className="bg-slate-900">OVERLOAD</option>
                <option value="MISALIGNMENT" className="bg-slate-900">MISALIGNMENT</option>
                <option value="ROLLER_FAULT" className="bg-slate-900">ROLLER_FAULT</option>
                <option value="FRICTION" className="bg-slate-900">FRICTION</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span>Sample Size:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium cursor-pointer"
              >
                <option value={30} className="bg-slate-900">30 Records</option>
                <option value={50} className="bg-slate-900">50 Records</option>
                <option value={100} className="bg-slate-900">100 Records</option>
                <option value={250} className="bg-slate-900">250 Records</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-slate-400 font-mono text-[11px]">
            <span>Loaded: <strong className="text-cyan-300">{history.length}</strong> rows</span>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Temperature Statistics
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-rose-400">
                  {stats.temp.avg.toFixed(1)}°C
                </span>
                <span className="text-[10px] text-slate-500 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>Min: {stats.temp.min.toFixed(1)}°C</span>
                <span>Max: {stats.temp.max.toFixed(1)}°C</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Vibration Velocity
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {stats.vib.avg.toFixed(2)} mm/s
                </span>
                <span className="text-[10px] text-slate-500 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>Min: {stats.vib.min.toFixed(2)}</span>
                <span>Max: {stats.vib.max.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Belt Speed
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {stats.speed.avg.toFixed(2)} m/s
                </span>
                <span className="text-[10px] text-slate-500 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>Min: {stats.speed.min.toFixed(2)}</span>
                <span>Max: {stats.speed.max.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Motor Current Draw
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {stats.current.avg.toFixed(2)} A
                </span>
                <span className="text-[10px] text-slate-500 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>Min: {stats.current.min.toFixed(2)}A</span>
                <span>Max: {stats.current.max.toFixed(2)}A</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts: Vibration vs Current Scatter & Temperature vs Vibration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Vibration (X) vs Motor Current (Y) Correlation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Mechanical Load Scatter</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="vibration" name="Vibration" unit=" mm/s" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="current" name="Current" unit=" A" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Operating Point" data={history} fill="#06b6d4" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Bearing Temperature (°C) vs Vibration Velocity (mm/s)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Thermal Friction Index</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="vibration" name="Vibration" unit=" mm/s" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="temperature" name="Temperature" unit=" °C" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Thermal Metric" data={history} fill="#f43f5e" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
