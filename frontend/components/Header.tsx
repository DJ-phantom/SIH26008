import React from "react";

interface HeaderProps {
  deviceId: string;
}

export const Header: React.FC<HeaderProps> = ({ deviceId }) => {
  return (
    <header className="app-header">
      <div className="app-title-group">
        <h1>SIH26008</h1>
        <div className="subtitle">Conveyor Health Monitoring System — Live Prototype Telemetry</div>
      </div>
      <div className="header-device-badge">
        <span style={{ color: "var(--text-muted)" }}>TARGET:</span>
        <strong>{deviceId}</strong>
      </div>
    </header>
  );
};
