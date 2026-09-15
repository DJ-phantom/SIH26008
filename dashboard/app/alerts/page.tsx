"use client";

import React, { useState } from "react";
import { Header } from "../../components/Header";
import { DemoAlert } from "../../types/telemetry";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Search,
} from "lucide-react";

export const SAMPLE_ALERTS_LOG: DemoAlert[] = [
  {
    id: "alt-01",
    timestamp: "2026-09-15 09:12:44",
    level: "critical",
    component: "Belt / Roller Interface",
    title: "Critical Thermal Friction Elevation",
    message: "Bearing / carcass friction detected reaching 68.0°C. Elevated risk of belt burning and localized joint softening.",
  },
  {
    id: "alt-02",
    timestamp: "2026-09-15 08:45:10",
    level: "critical",
    component: "Roller Idler Zone S2",
    title: "Abnormal Idler Vibration Spike",
    message: "High-frequency vibration velocity peaked at 7.4 mm/s. Wing idler bearing seizure risk on carry strand.",
  },
  {
    id: "alt-03",
    timestamp: "2026-09-15 07:30:22",
    level: "warning",
    component: "Belt Carry Strand",
    title: "Belt Tracking Deviation",
    message: "Lateral vibration (6.1 mm/s) indicates edge contact with structure. Idler self-training realignment recommended.",
  },
  {
    id: "alt-04",
    timestamp: "2026-09-14 23:18:05",
    level: "warning",
    component: "Drive / Motor Unit",
    title: "Motor Load Exceeding Nominal Profile",
    message: "Current draw reached 3.2 A (nominal: 1.4 - 1.8 A). Elevated pull-force tension on vulcanized splice joint J1.",
  },
  {
    id: "alt-05",
    timestamp: "2026-09-14 18:05:40",
    level: "info",
    component: "System Overview",
    title: "Operating State Normalized",
    message: "All mechanical and electrical telemetry parameters returned to nominal operating window.",
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DemoAlert[]>(SAMPLE_ALERTS_LOG);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = severityFilter === "All" || a.level.toLowerCase() === severityFilter.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.component.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getAlertIcon = (level: "info" | "warning" | "critical") => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const getBadgeStyle = (level: "info" | "warning" | "critical") => {
    switch (level) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "warning":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "info":
      default:
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        conveyorId="BC01"
        isBackendConnected={true}
        isMqttConnected={true}
        hasData={true}
        lastUpdated="Alerts Buffer Active"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                Rule-Based Diagnostic & Alert Logs
              </h1>
              <p className="text-xs text-slate-400">
                Audit trail of condition triggers, threshold breaches, and mechanical fault warnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg font-mono self-start sm:self-auto">
            <span>Logged Events: <strong className="text-cyan-300">{alerts.length}</strong></span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert title, diagnosis message, or subsystem..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setSeverityFilter("All")}
              className={`px-3 py-1 rounded-md transition-all ${
                severityFilter === "All" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Severities
            </button>
            <button
              onClick={() => setSeverityFilter("critical")}
              className={`px-3 py-1 rounded-md transition-all ${
                severityFilter === "critical" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter("warning")}
              className={`px-3 py-1 rounded-md transition-all ${
                severityFilter === "warning" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setSeverityFilter("info")}
              className={`px-3 py-1 rounded-md transition-all ${
                severityFilter === "info" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Info / Recovery
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getAlertIcon(alert.level)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase ${getBadgeStyle(alert.level)}`}>
                      {alert.level}
                    </span>
                    <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Target: <strong className="text-slate-300">{alert.component}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono self-start md:self-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>{alert.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
