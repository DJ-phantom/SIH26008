"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Box,
  TrendingUp,
  Bell,
  FileWarning,
  PhoneCall,
  Server,
  Layers,
  ChevronRight,
  Menu,
  X,
  Radio,
  PlusCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Overview & Live",
      href: "/",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      label: "Digital Twin (3D)",
      href: "/digital-twin",
      icon: <Box className="w-4 h-4" />,
      badge: "Interactive",
      badgeColor: "bg-sky-950/80 text-sky-300 border-sky-800/60",
    },
    {
      label: "Analytics & Trends",
      href: "/analytics",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: "Alerts & Events",
      href: "/alerts",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      label: "Incident Reports",
      href: "/incidents",
      icon: <FileWarning className="w-4 h-4" />,
      badge: "Action",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    },
    {
      label: "Emergency Contacts",
      href: "/contacts",
      icon: <PhoneCall className="w-4 h-4" />,
    },
    {
      label: "System Status",
      href: "/system-status",
      icon: <Server className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 flex items-center justify-center transition-transform active:scale-95"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#0f172a] border-r border-slate-800/90 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
            <div className="p-2 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sky-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold font-mono tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.2 rounded">
                  SIH26008
                </span>
                <span className="text-[10px] font-bold tracking-wide text-slate-300">
                  SRIJAN
                </span>
              </div>
              <h2 className="text-xs font-bold text-slate-100 tracking-tight leading-tight truncate">
                Conveyor Health AI
              </h2>
            </div>
          </div>

          {/* Quick Conveyor Unit Info Card */}
          <div className="mx-3 mt-3.5 p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400 tracking-wider">Active Line</p>
                <p className="font-mono font-semibold text-slate-200 text-xs">Conveyor BC01</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-800/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/70">
              Iron Ore
            </span>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 mt-2">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Platform Modules
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold shadow-xs border-l-2 border-sky-400 pl-2.5"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-medium font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Action: Report Incident */}
          <div className="px-3 mt-2">
            <Link
              href="/incidents/new"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Incident</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/60">
          <div className="flex items-center justify-between mb-1 text-[10px]">
            <span className="text-slate-300 font-medium">Team SRIJAN</span>
            <span className="text-emerald-400 font-mono">v1.2-Demo</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Predictive Joint Monitoring & Fault Prevention Platform
          </p>
        </div>
      </aside>
    </>
  );
};
