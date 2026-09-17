"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TelemetryRecord } from "@/lib/api";

interface SensorTrendChartProps {
  data: TelemetryRecord[];
  metricKey: "temperature" | "vibration" | "current" | "speed" | "alignment" | "load";
  label: string;
  unit: string;
  decimals?: number;
  isLoading?: boolean;
  error?: string | null;
}

// Custom clean industrial tooltip
const CustomTooltip = ({
  active,
  payload,
  label: timeLabel,
  unit,
  decimals = 1,
}: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const value = payload[0].value;
    const formattedVal =
      typeof value === "number" ? value.toFixed(decimals) : value;

    return (
      <div className="chart-tooltip">
        <div className="tooltip-time">{item.fullTimestamp || timeLabel}</div>
        <div className="tooltip-metric">
          <span className="tooltip-label">{payload[0].name}:</span>
          <span className="tooltip-value">
            {formattedVal} {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const SensorTrendChart: React.FC<SensorTrendChartProps> = ({
  data,
  metricKey,
  label,
  unit,
  decimals = 1,
  isLoading = false,
  error = null,
}) => {
  // Format and reverse data copy for chronological left-to-right (oldest -> newest) rendering
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Make a shallow copy before reversing so shared API state is never mutated
    const copy = [...data].reverse();

    return copy.map((record) => {
      let timeStr = "";
      let fullTimestamp = record.timestamp;

      if (record.timestamp) {
        try {
          const date = new Date(record.timestamp);
          if (!isNaN(date.getTime())) {
            timeStr = date.toLocaleTimeString([], {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            fullTimestamp = date.toLocaleString();
          } else {
            // Fallback for raw ISO string
            const parts = record.timestamp.split("T");
            timeStr = parts[1] ? parts[1].substring(0, 8) : record.timestamp;
          }
        } catch {
          timeStr = record.timestamp;
        }
      }

      return {
        id: record.id,
        time: timeStr,
        fullTimestamp: fullTimestamp,
        value: record[metricKey],
      };
    });
  }, [data, metricKey]);

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="chart-wrapper">
        <div className="chart-state-box">
          <div className="chart-spinner"></div>
          <p className="chart-state-text">Loading historical telemetry records...</p>
        </div>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="chart-wrapper">
        <div className="chart-state-box error">
          <p className="chart-state-text">Historical telemetry unavailable.</p>
          <span className="chart-state-subtext">Ensure the FastAPI backend and PostgreSQL service are online.</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-state-box">
          <p className="chart-state-text">No historical telemetry stored yet.</p>
          <span className="chart-state-subtext">Start the sensor MQTT publisher to stream and persist records.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-header-row">
        <div className="chart-title-box">
          <span className="chart-metric-title">{label} vs Time</span>
          <span className="chart-count-badge">{chartData.length} Readings</span>
        </div>
        <div className="chart-order-indicator">
          <span>Oldest</span>
          <span className="order-arrow">→</span>
          <span>Newest</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => (typeof v === "number" ? v.toFixed(decimals) : v)}
              unit={` ${unit}`}
              width={56}
            />
            <Tooltip
              content={
                <CustomTooltip
                  unit={unit}
                  decimals={decimals}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              name={label}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
