import { IncidentReport } from "../types/incidents";

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: "INC-2026-084",
    conveyorId: "BC01",
    problemType: "Roller Damage",
    severity: "High",
    status: "Under Maintenance",
    location: "Carry Strand Idler Station S2 (+42m from tail)",
    description: "Abnormal squealing noise and severe vibration (7.4 mm/s) detected on wing idler bearing. Bearing seizure risk.",
    reportedBy: "Tech. Amit Kumar (ID: W-412)",
    reportedAt: "2026-09-15 08:30:00",
    actionTaken: "Maintenance team dispatched for idler replacement during scheduled inter-shift pause.",
    assignedTo: "Mechanical Crew B",
  },
  {
    id: "INC-2026-081",
    conveyorId: "BC01",
    problemType: "Splice / Joint Damage",
    severity: "Critical",
    status: "In Progress",
    location: "Vulcanized Splice Joint J1",
    description: "Thermal imaging flagged localized friction hotspot (68°C) near top cover splice edge. Slight joint seam fray observed.",
    reportedBy: "Control Room AI Automated Trigger",
    reportedAt: "2026-09-14 22:15:00",
    actionTaken: "Conveyor speed temporarily reduced by 10%. Splice joint inspection scheduled.",
    assignedTo: "Er. Rajesh Sharma",
  },
  {
    id: "INC-2026-079",
    conveyorId: "BC01",
    problemType: "Belt Misalignment",
    severity: "Medium",
    status: "Resolved",
    location: "Discharge Chute Transition Zone",
    description: "Belt wandering 35mm towards drive motor side. Triggered alignment limit switch.",
    reportedBy: "Operator Sunita Rao (ID: OP-108)",
    reportedAt: "2026-09-14 14:20:00",
    actionTaken: "Adjusted self-aligning training idlers at station T3. Tracking verified normal.",
    assignedTo: "Shift Mechanical Tech",
  },
  {
    id: "INC-2026-072",
    conveyorId: "BC01",
    problemType: "Material Spillage",
    severity: "Low",
    status: "Resolved",
    location: "Transfer Chute 4 Loading Point",
    description: "Iron ore fines buildup along skirtboard sealing rubber causing minor spillage on return strand.",
    reportedBy: "Field Inspector D. Naik",
    reportedAt: "2026-09-13 11:05:00",
    actionTaken: "Cleaned return plow area and readjusted polyurethane skirt clamp.",
    assignedTo: "Housekeeping Crew 3",
  },
];

const STORAGE_KEY = "sih26008_incidents_v1";

export function getStoredIncidents(): IncidentReport[] {
  if (typeof window === "undefined") return INITIAL_INCIDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_INCIDENTS;
  }
}

export function saveIncident(newReport: Omit<IncidentReport, "id" | "reportedAt" | "status">): IncidentReport {
  const current = getStoredIncidents();
  const nextNum = current.length + 85;
  const created: IncidentReport = {
    ...newReport,
    id: `INC-2026-${String(nextNum).padStart(3, "0")}`,
    reportedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    status: "Open",
  };
  const updated = [created, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }
  return created;
}
