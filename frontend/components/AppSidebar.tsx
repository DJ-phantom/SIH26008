"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Layers,
  BarChart3,
  AlertTriangle,
  Camera,
  Server,
  Radio,
  BrainCircuit,
  ScanSearch,
  Monitor,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/live", label: "Live Monitoring", icon: Activity },
  { href: "/decision-support", label: "Decision Support", icon: ScanSearch },
  { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit },
  { href: "/digital-belt", label: "Digital Belt", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/local-display", label: "Local Display", icon: Monitor },
  { href: "/camera", label: "Camera Inspection", icon: Camera },
  { href: "/system", label: "System Status", icon: Server },
];

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Radio className="brand-icon" size={20} />
          <span className="brand-name" style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.5px" }}>
            SRIJAN
          </span>
        </div>
        <div className="brand-tag" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "2px" }}>
          SIH26008 • Belt Health System
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-disclosure">
          <span className="disclosure-dot" />
          <span>SRIJAN • SIH26008</span>
        </div>
        <div className="sidebar-version">Conveyor Health Platform</div>
      </div>
    </aside>
  );
};
