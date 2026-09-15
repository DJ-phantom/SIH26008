"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { IncidentReport, IncidentSeverity, IncidentStatus } from "../../types/incidents";
import { getStoredIncidents } from "../../lib/incidentsData";
import {
  FileWarning,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  Eye,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);

  useEffect(() => {
    setIncidents(getStoredIncidents());
  }, []);

  // Summary Metrics
  const openCount = incidents.filter((i) => i.status === "Open" || i.status === "In Progress").length;
  const criticalCount = incidents.filter((i) => i.severity === "Critical").length;
  const maintenanceCount = incidents.filter((i) => i.status === "Under Maintenance").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  // Filtered List
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === "All" || item.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "High":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Low":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "Open":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "In Progress":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "Under Maintenance":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        conveyorId="BC01"
        isBackendConnected={true}
        isMqttConnected={true}
        hasData={true}
        lastUpdated="Incident Registry Synced"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Title Bar & Report Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <FileWarning className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-900">
                Incident Management & Field Reports
              </h1>
              <p className="text-xs text-slate-500">
                Track, triage, and resolve conveyor damage reports, joint anomalies, and maintenance logs
              </p>
            </div>
          </div>

          <Link
            href="/incidents/new"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-slate-300" />
            <span>Report Incident</span>
          </Link>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Open Incidents */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Open Incidents</p>
              <p className="text-2xl lg:text-3xl font-bold font-mono text-rose-800 mt-1">{openCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Requiring attention</p>
            </div>
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Critical Severity */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Critical Severity</p>
              <p className="text-2xl lg:text-3xl font-bold font-mono text-amber-800 mt-1">{criticalCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">High rupture risk</p>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Under Maintenance */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Under Maintenance</p>
              <p className="text-2xl lg:text-3xl font-bold font-mono text-sky-800 mt-1">{maintenanceCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Crews dispatched</p>
            </div>
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-600">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Resolved Incidents */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Resolved</p>
              <p className="text-2xl lg:text-3xl font-bold font-mono text-emerald-800 mt-1">{resolvedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Repairs completed</p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, problem, location, or reporter..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none font-semibold cursor-pointer"
              >
                <option value="All" className="bg-white">All</option>
                <option value="Critical" className="bg-white">Critical</option>
                <option value="High" className="bg-white">High</option>
                <option value="Medium" className="bg-white">Medium</option>
                <option value="Low" className="bg-white">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              <span className="text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none font-semibold cursor-pointer"
              >
                <option value="All" className="bg-white">All</option>
                <option value="Open" className="bg-white">Open</option>
                <option value="In Progress" className="bg-white">In Progress</option>
                <option value="Under Maintenance" className="bg-white">Under Maintenance</option>
                <option value="Resolved" className="bg-white">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Problem Type</th>
                  <th className="py-3 px-4">Line</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {inc.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border ${getSeverityBadge(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {inc.problemType}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {inc.conveyorId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {inc.location}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${getStatusBadge(inc.status)}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inc.reportedBy}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {inc.reportedAt}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-slate-400 hover:text-slate-800 transition-colors p-1" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No incidents match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Incident Details */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
              <button
                onClick={() => setSelectedIncident(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {selectedIncident.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(selectedIncident.severity)}`}>
                  {selectedIncident.severity} Severity
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>

              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">
                {selectedIncident.problemType} — {selectedIncident.conveyorId}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Location:</span>
                  <span className="text-slate-800 font-medium">{selectedIncident.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Reported Time:</span>
                  <span className="text-slate-800 font-mono">{selectedIncident.reportedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Reported By:</span>
                  <span className="text-slate-800 font-medium">{selectedIncident.reportedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Assigned Crew:</span>
                  <span className="text-slate-800 font-medium">{selectedIncident.assignedTo || "Unassigned"}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 mb-4">
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">Description & Observations</h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
                    {selectedIncident.description}
                  </p>
                </div>

                {selectedIncident.actionTaken && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">Corrective Action Taken</h4>
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-emerald-800">
                      {selectedIncident.actionTaken}
                    </p>
                  </div>
                )}

                {selectedIncident.photoUrl && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">Photo Evidence Attachment</h4>
                    <div className="rounded-lg overflow-hidden border border-slate-200 max-h-56 bg-slate-50 flex items-center justify-center">
                      <img
                        src={selectedIncident.photoUrl}
                        alt="Incident Evidence"
                        className="max-h-56 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
