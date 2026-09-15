export type ProblemType =
  | "Belt Tear"
  | "Splice / Joint Damage"
  | "Belt Misalignment"
  | "Roller Damage"
  | "Material Spillage"
  | "Abnormal Noise"
  | "Motor Problem"
  | "Smoke / Fire"
  | "Structural Damage"
  | "Other";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";

export type IncidentStatus = "Open" | "In Progress" | "Under Maintenance" | "Resolved";

export interface IncidentReport {
  id: string;
  conveyorId: string;
  problemType: ProblemType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  photoUrl?: string;
  actionTaken?: string;
  assignedTo?: string;
}
