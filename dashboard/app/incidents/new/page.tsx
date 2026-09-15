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
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 flex flex-col font-sans">
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
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Back to Incident Registry</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded">
            Form Ref: SIH26008-INC-DISPATCH
          </span>
        </div>

        {/* Success Notice Banner */}
        {submittedSuccess && (
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-4 flex items-center gap-3 text-emerald-900 animate-pulse shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-xs text-emerald-950">Incident Dispatched Successfully!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Logged to local registry. Redirecting to Incident Management...
              </p>
            </div>
          </div>
        )}

        {/* Main Form Container */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 lg:p-7 shadow-xs">
          <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 mb-6">
            <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-700">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                Log New Field Incident / Conveyor Damage
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record manual observations, splice fraying, roller seizure, or emergency belt stops
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Conveyor ID & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Conveyor / Belt ID <span className="text-rose-600">*</span>
                </label>
                <select
                  value={conveyorId}
                  onChange={(e) => setConveyorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-mono transition-colors"
                >
                  <option value="BC01">BC01 — Primary Overland Line (Monitored)</option>
                  <option value="BC02">BC02 — Pit Secondary Transfer Line</option>
                  <option value="BC03">BC03 — Crushing Plant Feed Conveyor</option>
                  <option value="BC04">BC04 — Stockpile Stacker Line</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Incident Severity <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITY_LEVELS.map((sev) => {
                    const isSel = severity === sev;
                    return (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all border ${
                          isSel
                            ? sev === "Critical"
                              ? "bg-rose-50 text-rose-800 border-rose-300 shadow-xs"
                              : sev === "High"
                              ? "bg-orange-50 text-orange-800 border-orange-300 shadow-xs"
                              : sev === "Medium"
                              ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                              : "bg-slate-100 text-slate-900 border-slate-300 shadow-xs"
                            : "bg-slate-50/60 text-slate-500 border-slate-200/80 hover:bg-slate-100 hover:text-slate-700"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Problem Type <span className="text-rose-600">*</span>
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value as ProblemType)}
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-medium transition-colors"
                >
                  {PROBLEM_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location / Zone <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Vulcanized Splice J1, Drive Pulley, Idler Zone S2..."
                  required
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Row 3: Worker / Reporter ID */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Reporter Worker Name / ID <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="e.g. Field Inspector K. Sharma (ID: TECH-304)"
                required
                className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
              />
            </div>

            {/* Row 4: Detailed Description */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Damage Description & Observations <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed observations: sound frequency, heat smell, tear length, vibration amplitude, ore spillage volume..."
                required
                className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 leading-relaxed transition-colors"
              />
            </div>

            {/* Row 5: Photo Evidence Upload UI */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Photo Evidence Attachment <span className="text-slate-400 font-normal lowercase">(optional)</span>
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
                  className="border-2 border-dashed border-slate-200/90 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 group-hover:text-slate-600 transition-colors shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to browse or drag & drop joint/belt inspection photos
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports PNG, JPG, WEBP (Mock local preview active for hackathon demo)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-36 max-w-[200px] shrink-0 bg-slate-900">
                    <img
                      src={photoPreview}
                      alt="Selected preview"
                      className="max-h-36 w-auto object-contain"
                    />
                  </div>
                  <div className="flex-1 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Photo loaded in local preview buffer</span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px] truncate">
                      File: {photoFileName || "evidence.jpg"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Isolated mock storage ready for future S3 / Cloudinary cloud upload integration.
                    </p>
                    <div className="flex items-center gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition-colors"
                      >
                        Replace Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-medium border border-rose-200/80 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/incidents"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || submittedSuccess}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
                    <span>Dispatching Report...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
