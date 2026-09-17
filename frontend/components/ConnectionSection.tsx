import React from "react";
import { HealthResponse } from "@/lib/api";

interface ConnectionSectionProps {
  health: HealthResponse | null;
  backendError: string | null;
  isLoading: boolean;
}

export const ConnectionSection: React.FC<ConnectionSectionProps> = ({
  health,
  backendError,
  isLoading,
}) => {
  const getBackendStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (backendError || !health) return { label: "Offline", state: "offline" };
    return { label: "Online", state: "online" };
  };

  const getMqttStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (!health || backendError) return { label: "Offline", state: "offline" };
    return health.mqtt_connected
      ? { label: "Online", state: "online" }
      : { label: "Offline", state: "offline" };
  };

  const getDbStatus = () => {
    if (isLoading && !health && !backendError) return { label: "Checking...", state: "checking" };
    if (!health || backendError) return { label: "Offline", state: "offline" };
    return health.database_connected
      ? { label: "Online", state: "online" }
      : { label: "Offline", state: "offline" };
  };

  const backend = getBackendStatus();
  const mqtt = getMqttStatus();
  const db = getDbStatus();

  return (
    <section aria-labelledby="conn-status-title">
      <h2 id="conn-status-title" className="section-title">
        System Connection Status
      </h2>
      <div className="connection-grid">
        {/* Backend Status Card */}
        <div className="connection-card">
          <div>
            <div className="conn-label">FastAPI Backend</div>
            <div className="conn-sub">REST & Lifespan Service</div>
          </div>
          <span className={`badge ${backend.state}`}>
            <span className="badge-dot" />
            {backend.label}
          </span>
        </div>

        {/* MQTT Broker Status Card */}
        <div className="connection-card">
          <div>
            <div className="conn-label">MQTT Broker</div>
            <div className="conn-sub">Mosquitto (Port 1883)</div>
          </div>
          <span className={`badge ${mqtt.state}`}>
            <span className="badge-dot" />
            {mqtt.label}
          </span>
        </div>

        {/* PostgreSQL Status Card */}
        <div className="connection-card">
          <div>
            <div className="conn-label">PostgreSQL Database</div>
            <div className="conn-sub">Port 5433 (sih26008)</div>
          </div>
          <span className={`badge ${db.state}`}>
            <span className="badge-dot" />
            {db.label}
          </span>
        </div>
      </div>
    </section>
  );
};
