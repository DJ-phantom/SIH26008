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
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 flex flex-col font-sans">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-900">
                Telemetry Analytics & Historical Trends
              </h1>
              <p className="text-xs text-slate-500">
                Deep-dive statistical analysis, sensor distributions, and condition comparisons from PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 self-start sm:self-auto shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export CSV Dataset</span>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Condition:</span>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none font-semibold cursor-pointer"
              >
                <option value="All" className="bg-white">All Conditions</option>
                <option value="NORMAL" className="bg-white">NORMAL</option>
                <option value="OVERLOAD" className="bg-white">OVERLOAD</option>
                <option value="MISALIGNMENT" className="bg-white">MISALIGNMENT</option>
                <option value="ROLLER_FAULT" className="bg-white">ROLLER_FAULT</option>
                <option value="FRICTION" className="bg-white">FRICTION</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              <span className="text-slate-500">Sample Size:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-transparent text-slate-800 text-xs focus:outline-none font-semibold cursor-pointer"
              >
                <option value={30} className="bg-white">30 Records</option>
                <option value={50} className="bg-white">50 Records</option>
                <option value={100} className="bg-white">100 Records</option>
                <option value={250} className="bg-white">250 Records</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-slate-500 font-mono text-[11px]">
            <span>Loaded: <strong className="text-slate-800 font-semibold">{history.length}</strong> rows</span>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-800" : ""}`} />
            </button>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Temperature Statistics
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-rose-800">
                  {stats.temp.avg.toFixed(1)}°C
                </span>
                <span className="text-[10px] text-slate-400 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono pt-1.5 border-t border-slate-100">
                <span>Min: {stats.temp.min.toFixed(1)}°C</span>
                <span>Max: {stats.temp.max.toFixed(1)}°C</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Vibration Velocity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-sky-800">
                  {stats.vib.avg.toFixed(2)} mm/s
                </span>
                <span className="text-[10px] text-slate-400 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono pt-1.5 border-t border-slate-100">
                <span>Min: {stats.vib.min.toFixed(2)}</span>
                <span>Max: {stats.vib.max.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Belt Speed
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  {stats.speed.avg.toFixed(2)} m/s
                </span>
                <span className="text-[10px] text-slate-400 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono pt-1.5 border-t border-slate-100">
                <span>Min: {stats.speed.min.toFixed(2)}</span>
                <span>Max: {stats.speed.max.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block mb-1">
                Motor Current Draw
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-800">
                  {stats.current.avg.toFixed(2)} A
                </span>
                <span className="text-[10px] text-slate-400 font-mono">avg</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono pt-1.5 border-t border-slate-100">
                <span>Min: {stats.current.min.toFixed(2)}A</span>
                <span>Max: {stats.current.max.toFixed(2)}A</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts: Vibration vs Current Scatter & Temperature vs Vibration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Vibration (X) vs Motor Current (Y) Correlation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Mechanical Load Scatter</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="vibration" name="Vibration" unit=" mm/s" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis type="number" dataKey="current" name="Current" unit=" A" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip cursor={{ strokeDasharray: "2 2" }} />
                  <Scatter name="Operating Point" data={history} fill="#0284c7" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bearing Temperature (°C) vs Vibration Velocity (mm/s)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Thermal Friction Index</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="vibration" name="Vibration" unit=" mm/s" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis type="number" dataKey="temperature" name="Temperature" unit=" °C" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip cursor={{ strokeDasharray: "2 2" }} />
                  <Scatter name="Thermal Metric" data={history} fill="#e11d48" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
