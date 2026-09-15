"use client";

import React, { useState, useRef } from "react";
import { Header } from "../../components/Header";
import {
  Box,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Info,
  Layers,
  Activity,
  AlertTriangle,
  Camera,
  RotateCw,
} from "lucide-react";

export default function DigitalTwinPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
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
        lastUpdated="Active 3D Stream"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Title Bar & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <Box className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-bold text-slate-900">
                  Digital Twin — 3D Engineering Visualization
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                  Three.js WebGL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interactive 3D model of overland troughed belt conveyor BC01 & sensor network suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Fullscreen 3D</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3D Simulation Frame Container */}
        <div
          ref={iframeContainerRef}
          className={`relative rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-md transition-all ${
            isFullscreen ? "w-full h-full p-0 border-0" : "h-[650px] w-full"
          }`}
        >
          <iframe
            src="/conveyor-animation/index.html"
            title="Conveyor 3D Digital Twin Simulation"
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        </div>

        {/* 3D Model Guide & Sensor Annotations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Controls Guide */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">
              <RotateCw className="w-4 h-4 text-slate-600" />
              <span>3D Navigation & Controls</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong className="text-slate-800">Left-Click + Drag:</strong> Rotate 3D orbit camera</li>
              <li>• <strong className="text-slate-800">Mouse Scroll:</strong> Zoom in / out</li>
              <li>• <strong className="text-slate-800">Hover Components:</strong> Inspect technical sensor data sheet</li>
              <li>• <strong className="text-slate-800">Top Preset Buttons:</strong> Jump to Joint, Drive, or Loading view</li>
            </ul>
          </div>

          {/* Card 2: Simulated Sensor Suite */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Core Sensor Array</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong className="text-sky-800">Pi Camera Module:</strong> Vision-based joint crack & fray inspection</li>
              <li>• <strong className="text-rose-800">MLX90614 IR:</strong> Non-contact thermal friction monitoring</li>
              <li>• <strong className="text-emerald-800">HX711 Load Cell:</strong> Belt tension & splice load measurement</li>
              <li>• <strong className="text-indigo-800">Hall-Effect + Magnet:</strong> Steel-cord break (MFL) sensor</li>
            </ul>
          </div>

          {/* Card 3: Fault Injection Demo */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Interactive Scenarios</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong className="text-amber-800">Simulate Fault:</strong> Injects high-risk splice vibration & thermal spike</li>
              <li>• <strong className="text-rose-800">Break Belt:</strong> Simulates internal steel-cord failure with MFL gate cam</li>
              <li>• <strong className="text-slate-800">Repair Belt:</strong> Restores nominal belt cord integrity and resets camera</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
