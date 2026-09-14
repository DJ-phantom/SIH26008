export interface TelemetryData {
  id?: number;
  conveyor_id: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  speed: number;
  current: number;
  condition: "NORMAL" | "OVERLOAD" | "MISALIGNMENT" | "ROLLER_FAULT" | "FRICTION" | string;
}

export type RiskLevel = "NORMAL" | "WARNING" | "HIGH_RISK" | "CRITICAL";

export interface ComponentState {
  status: "healthy" | "warning" | "critical";
  label: string;
  detail: string;
}

export interface DemoAlert {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "critical";
  component: string;
  title: string;
  message: string;
}

export interface HealthAssessment {
  overallScore: number;
  beltScore: number;
  spliceScore: number;
  driveScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  conditionDescription: string;
  alerts: DemoAlert[];
  components: {
    motor: ComponentState;
    drivePulley: ComponentState;
    beltStrand: ComponentState;
    rollerZone: ComponentState;
    spliceJoint: ComponentState;
    tailPulley: ComponentState;
  };
}
