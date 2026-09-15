"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../components/Header";
import { ProblemType, IncidentSeverity } from "../../../types/incidents";
import { saveIncident } from "../../../lib/incidentsData";
import {
  FileWarning,
  ArrowLeft,
  Camera,
  UploadCloud,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HardDrive,
} from "lucide-react";

const PROBLEM_TYPES: ProblemType[] = [
  "Belt Tear",
  "Splice / Joint Damage",
  "Belt Misalignment",
  "Roller Damage",
  "Material Spillage",
  "Abnormal Noise",
  "Motor Problem",
  "Smoke / Fire",
  "Structural Damage",
  "Other",
];

const SEVERITY_LEVELS: IncidentSeverity[] = ["Low", "Medium", "High", "Critical"];

export default function ReportIncidentPage() {
  const router = useRouter();

  const [conveyorId, setConveyorId] = useState("BC01");
  const [problemType, setProblemType] = useState<ProblemType>("Splice / Joint Damage");
  const [severity, setSeverity] = useState<IncidentSeverity>("High");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim() || !reportedBy.trim()) {
      alert("Please fill in Location, Description, and Worker Name/ID.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      saveIncident({
        conveyorId,
        problemType,
        severity,
        location: location.trim(),
        description: description.trim(),
        reportedBy: reportedBy.trim(),
        photoUrl: photoPreview || undefined,
        actionTaken: "Logged in field dispatch queue. Awaiting maintenance assignment.",
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);

      setTimeout(() => {
        router.push("/incidents");
      }, 1200);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        conveyorId={conveyorId}
        isBackendConnected={true}
        isMqttConnected={true}
        hasData={true}
        lastUpdated="Field Dispatch Active"
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Navigation / Back Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/incidents"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Incident Registry</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">Form Ref: SIH26008-INC-DISPATCH</span>
        </div>

        {/* Success Notice Banner */}
        {submittedSuccess && (
          <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-xl p-4 flex items-center gap-3 text-emerald-200 animate-pulse">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Incident Dispatched Successfully!</p>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Logged to local registry. Redirecting to Incident Management...
              </p>
            </div>
          </div>
        )}

        {/* Main Form Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800 mb-6">
            <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-amber-400">
              <FileWarning className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Log New Field Incident / Conveyor Damage
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Record manual observations, splice fraying, roller seizure, or emergency belt stops
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Conveyor ID & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Conveyor / Belt ID <span className="text-rose-400">*</span>
                </label>
                <select
                  value={conveyorId}
                  onChange={(e) => setConveyorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="BC01">BC01 — Primary Overland Line (Monitored)</option>
                  <option value="BC02">BC02 — Pit Secondary Transfer Line</option>
                  <option value="BC03">BC03 — Crushing Plant Feed Conveyor</option>
                  <option value="BC04">BC04 — Stockpile Stacker Line</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Incident Severity <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map((sev) => {
                    const isSel = severity === sev;
                    return (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                          isSel
                            ? sev === "Critical"
                              ? "bg-rose-950 text-rose-200 border-rose-600 shadow-md shadow-rose-900/30"
                              : sev === "High"
                              ? "bg-orange-950 text-orange-200 border-orange-600 shadow-md shadow-orange-900/30"
                              : sev === "Medium"
                              ? "bg-amber-950 text-amber-200 border-amber-600"
                              : "bg-slate-800 text-slate-200 border-slate-600"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Problem Type & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Problem Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value as ProblemType)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {PROBLEM_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Location / Zone <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Vulcanized Splice J1, Drive Pulley, Idler Zone S2..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Row 3: Worker / Reporter ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Reporter Worker Name / ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="e.g. Field Inspector K. Sharma (ID: TECH-304)"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Row 4: Detailed Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Damage Description & Observations <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed observations: sound frequency, heat smell, tear length, vibration amplitude, ore spillage volume..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            {/* Row 5: Photo Evidence Upload UI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Photo Evidence Attachment (Optional)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />

              {!photoPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-cyan-600/70 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="p-3 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    Click to browse or drag & drop joint/belt inspection photos
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports PNG, JPG, WEBP (Mock local preview active for hackathon demo)
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 max-h-36 max-w-[200px] shrink-0 bg-black">
                    <img
                      src={photoPreview}
                      alt="Selected preview"
                      className="max-h-36 w-auto object-contain"
                    />
                  </div>
                  <div className="flex-1 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Photo loaded in local preview buffer</span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] truncate">
                      File: {photoFileName || "evidence.jpg"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Isolated mock storage ready for future S3 / Cloudinary cloud upload integration.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors"
                      >
                        Replace Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded text-[11px] font-medium border border-rose-800 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                href="/incidents"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || submittedSuccess}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Report...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Dispatch Incident</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
