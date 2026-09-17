"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchHealth, fetchLatestTelemetry, HealthResponse, TelemetryData } from "./api";

const POLL_INTERVAL_MS = 1000;
const STALE_THRESHOLD_MS = 3500;

interface TelemetryContextType {
  health: HealthResponse | null;
  telemetry: TelemetryData | null;
  backendError: string | null;
  isUnavailable: boolean;
  isStale: boolean;
  isLoading: boolean;
  lastUpdated: string | null;
}

const TelemetryContext = createContext<TelemetryContextType>({
  health: null,
  telemetry: null,
  backendError: null,
  isUnavailable: false,
  isStale: false,
  isLoading: true,
  lastUpdated: null,
});

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isUnavailable, setIsUnavailable] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const lastFreshTimeRef = useRef<number>(Date.now());
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function pollData() {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        // 1. Health Poll
        const healthRes = await fetchHealth();
        if (isMounted) {
          if (healthRes.error) {
            setBackendError(healthRes.error);
            setHealth(null);
          } else {
            setBackendError(null);
            setHealth(healthRes.data);
          }
        }

        // 2. Latest Telemetry Poll
        const telemetryRes = await fetchLatestTelemetry();
        if (isMounted) {
          if (telemetryRes.isUnavailable) {
            setIsUnavailable(true);
            setTelemetry(null);
          } else if (telemetryRes.error) {
            setBackendError(telemetryRes.error);
          } else if (telemetryRes.data) {
            setIsUnavailable(false);
            setBackendError(null);

            setTelemetry((prev) => {
              if (!prev || prev.timestamp !== telemetryRes.data!.timestamp) {
                lastFreshTimeRef.current = Date.now();
                setIsStale(false);
              }
              return telemetryRes.data;
            });
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setBackendError(err.message || "Network error");
          setIsLoading(false);
        }
      } finally {
        isFetchingRef.current = false;
      }
    }

    // Initial immediate poll
    pollData();

    // 1-second continuous telemetry polling
    const pollTimer = setInterval(pollData, POLL_INTERVAL_MS);

    // Stale detection check
    const staleTimer = setInterval(() => {
      if (Date.now() - lastFreshTimeRef.current > STALE_THRESHOLD_MS) {
        setIsStale(true);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      clearInterval(staleTimer);
    };
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        health,
        telemetry,
        backendError,
        isUnavailable,
        isStale,
        isLoading,
        lastUpdated: telemetry?.timestamp || null,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
