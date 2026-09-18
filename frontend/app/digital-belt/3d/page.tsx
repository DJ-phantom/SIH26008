"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Info, Box, AlertCircle, Loader2 } from "lucide-react";

export default function DigitalBelt3DPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen API error:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)", gap: "12px" }}>
      {/* 1. APPLICATION / VIEWER HEADER AREA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "12px 18px",
          boxShadow: "var(--shadow-sm)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href="/digital-belt"
            className="back-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Digital Belt</span>
          </Link>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Box size={18} style={{ color: "var(--accent-primary)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Interactive 3D Conveyor Model
              </h2>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                Engineering Model
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Engineering visualization of conveyor structure, splice monitoring points and sensor-placement concepts.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleFullscreen}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              fontSize: "0.8rem",
              fontWeight: 600,
              backgroundColor: isFullscreen ? "#0f172a" : "var(--bg-subtle)",
              color: isFullscreen ? "#ffffff" : "var(--text-primary)",
              border: "1px solid var(--border-dark)",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle fullscreen 3D viewport (Press Esc to exit)"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen Visualization"}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT DISCLOSURE NOTICE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderLeft: "4px solid var(--accent-primary)",
          borderRadius: "6px",
          padding: "8px 14px",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        <Info size={16} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        <span>
          <strong>Interactive Concept Visualization</strong> — simulation controls inside this model are independent of the live FastAPI/MQTT monitoring pipeline. Live operational condition data remains available on the Digital Belt and Overview pages.
        </span>
      </div>

      {/* 3. 3D VIEWPORT CONTAINER */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          width: "100%",
          backgroundColor: "#0d1012",
          borderRadius: isFullscreen ? 0 : "8px",
          border: isFullscreen ? "none" : "1px solid #1e293b",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* LOADING STATE OVERLAY */}
        {isLoading && !hasError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#0d1012",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "#e6eaed",
            }}
          >
            <Loader2 size={32} className="spin-icon" style={{ color: "#e0a83e", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#8b949c" }}>
              Loading 3D Engineering Model...
            </span>
          </div>
        )}

        {/* FAILURE STATE OVERLAY */}
        {hasError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#0d1012",
              zIndex: 25,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              color: "#e6eaed",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <AlertCircle size={40} style={{ color: "#d94b3f" }} />
            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                3D visualization unavailable.
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949c" }}>
                Unable to load the static 3D WebGL asset scene. Ensure static assets are served properly.
              </p>
            </div>
            <Link
              href="/digital-belt"
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                marginTop: "6px",
              }}
            >
              Return to Digital Belt
            </Link>
          </div>
        )}

        {/* IFRAME VIEWPORT */}
        <iframe
          src="/visualizations/conveyor-industrial.html"
          title="Interactive 3D Conveyor Engineering Model"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            flex: 1,
          }}
        />
      </div>
    </div>
  );
}
