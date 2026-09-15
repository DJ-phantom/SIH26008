"use client";

import React, { useState } from "react";
import { Header } from "../../components/Header";
import { DEMO_CONTACTS } from "../../lib/contactsData";
import { EmergencyContact } from "../../types/contacts";
import {
  PhoneCall,
  Radio,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  AlertOctagon,
  Copy,
  Check,
  Search,
  ExternalLink,
} from "lucide-react";

export default function ContactsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredContacts = DEMO_CONTACTS.filter((c) => {
    const matchesSearch =
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        conveyorId="BC01"
        isBackendConnected={true}
        isMqttConnected={true}
        hasData={true}
        lastUpdated="Emergency Directory Active"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800/60 text-rose-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">
                  Emergency & Operational Contacts
                </h1>
                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                  DEMO CONTACTS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct dispatch telephone directory, VHF radio channels, and rapid emergency contacts for Conveyor Line BC01
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg text-rose-300 text-xs self-start sm:self-auto">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Emergency Hotlines Active</span>
          </div>
        </div>

        {/* Demo Notice Disclaimer Bar */}
        <div className="px-4 py-2 bg-amber-950/30 border border-amber-900/50 rounded-xl flex items-center justify-between text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Demonstration Directory</strong> — Contact telephone numbers and radio frequencies below are simulated for Smart India Hackathon testing.
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, department, name, or location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium self-start md:self-auto">
            <button
              onClick={() => setPriorityFilter("all")}
              className={`px-3 py-1 rounded-md transition-all ${
                priorityFilter === "all" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Roles ({DEMO_CONTACTS.length})
            </button>
            <button
              onClick={() => setPriorityFilter("emergency")}
              className={`px-3 py-1 rounded-md transition-all ${
                priorityFilter === "emergency" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Emergency Only
            </button>
            <button
              onClick={() => setPriorityFilter("operational")}
              className={`px-3 py-1 rounded-md transition-all ${
                priorityFilter === "operational" ? "bg-blue-950 text-blue-300 border border-blue-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Maintenance / Field
            </button>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const isEmergency = contact.priority === "emergency";
            return (
              <div
                key={contact.id}
                className={`bg-slate-900/80 border rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 transition-all hover:border-slate-700 ${
                  isEmergency ? "border-rose-900/50 bg-slate-900/90" : "border-slate-800"
                }`}
              >
                <div>
                  {/* Top Role & Priority Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{contact.role}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">{contact.department}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider shrink-0 ${
                        contact.priority === "emergency"
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : contact.priority === "operational"
                          ? "bg-blue-950 text-blue-300 border-blue-800"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {contact.priority}
                    </span>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2.5 my-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-medium text-slate-200">{contact.contactPerson}</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
                      <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                        <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{contact.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(contact.id, contact.phone)}
                        className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                        title="Copy Phone"
                      >
                        {copiedId === contact.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-amber-300/90 text-[11px] bg-amber-950/20 px-2.5 py-1.5 rounded border border-amber-900/40">
                      <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono">{contact.radioChannel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{contact.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{contact.availableHours}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{contact.email}</span>
                  <span className="text-slate-400">Ext: {contact.phone.split("Ext:")[1] || "Direct"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
