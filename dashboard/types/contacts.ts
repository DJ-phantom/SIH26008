export interface EmergencyContact {
  id: string;
  role: string;
  department: string;
  contactPerson: string;
  phone: string;
  radioChannel: string;
  email: string;
  location: string;
  availableHours: string;
  priority: "emergency" | "operational" | "support";
}
