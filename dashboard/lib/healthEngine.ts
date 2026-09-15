import { DemoAlert, HealthAssessment, RiskLevel, TelemetryData } from "../types/telemetry";

/**
 * ============================================================================
 * PROTOTYPE RULE-BASED HEALTH ENGINE
 * ============================================================================
 * NOTE: This is a prototype rule-based health assessment designed for hackathon
 * demonstrations. It simulates how final ML anomaly detection, computer vision,
 * and sensor-fusion pipelines will generate real-time component health scores.
 * ============================================================================
 */

export function calculateHealthAssessment(telemetry: TelemetryData | null): HealthAssessment {
  if (!telemetry) {
    return {
      overallScore: 0,
      beltScore: 0,
      spliceScore: 0,
      driveScore: 0,
      riskLevel: "NORMAL",
      riskLabel: "No Telemetry",
      conditionDescription: "Waiting for sensor data stream from backend...",
      alerts: [],
      components: {
        motor: { status: "healthy", label: "Motor Unit", detail: "Awaiting data" },
        drivePulley: { status: "healthy", label: "Drive Pulley", detail: "Awaiting data" },
        beltStrand: { status: "healthy", label: "Belt Carry Strand", detail: "Awaiting data" },
        rollerZone: { status: "healthy", label: "Roller Idler Zone", detail: "Awaiting data" },
        spliceJoint: { status: "healthy", label: "Splice Joint", detail: "Awaiting data" },
        tailPulley: { status: "healthy", label: "Tail Pulley", detail: "Awaiting data" },
      },
    };
  }

  const condition = (telemetry.condition || "NORMAL").toUpperCase();
  const timeStr = new Date(telemetry.timestamp || Date.now()).toLocaleTimeString();

  switch (condition) {
    case "OVERLOAD":
      return {
        overallScore: 68,
        beltScore: 78,
        spliceScore: 74,
        driveScore: 48,
        riskLevel: "HIGH_RISK",
        riskLabel: "High Mechanical Strain",
        conditionDescription:
          "High material load detected. Motor current is elevated above nominal profile, inducing mechanical stress on drive system.",
        alerts: [
          {
            id: `alert-overload`,
            timestamp: timeStr,
            level: "warning",
            component: "Drive / Motor Unit",
            title: "Overload Condition Detected",
            message: `Motor current draw (${telemetry.current.toFixed(2)} A) exceeds nominal operating window (1.4 - 1.8 A).`,
          },
        ],
        components: {
          motor: { status: "critical", label: "Motor Unit", detail: `High Current: ${telemetry.current.toFixed(2)}A` },
          drivePulley: { status: "warning", label: "Drive Pulley", detail: "Heavy Torque Load" },
          beltStrand: { status: "warning", label: "Belt Carry Strand", detail: "Tension Stressed" },
          rollerZone: { status: "healthy", label: "Roller Idler Zone", detail: "Nominal" },
          spliceJoint: { status: "warning", label: "Splice Joint", detail: "Elevated Pull Force" },
          tailPulley: { status: "healthy", label: "Tail Pulley", detail: "Nominal" },
        },
      };

    case "MISALIGNMENT":
      return {
        overallScore: 62,
        beltScore: 45,
        spliceScore: 60,
        driveScore: 82,
        riskLevel: "WARNING",
        riskLabel: "Tracking Deviation",
        conditionDescription:
          "Belt tracking deviation suspected. Lateral drift detected along carry strand, causing friction with structure edge.",
        alerts: [
          {
            id: `alert-misalignment`,
            timestamp: timeStr,
            level: "warning",
            component: "Belt Carry Strand",
            title: "Belt Tracking Deviation",
            message: `Lateral vibration (${telemetry.vibration.toFixed(2)} mm/s) indicates edge contact and mistracking.`,
          },
        ],
        components: {
          motor: { status: "healthy", label: "Motor Unit", detail: "Nominal" },
          drivePulley: { status: "healthy", label: "Drive Pulley", detail: "Nominal" },
          beltStrand: { status: "critical", label: "Belt Carry Strand", detail: "Lateral Drift Detected" },
          rollerZone: { status: "warning", label: "Roller Idler Zone", detail: "Uneven Pressure" },
          spliceJoint: { status: "warning", label: "Splice Joint", detail: "Asymmetric Stress" },
          tailPulley: { status: "warning", label: "Tail Pulley", detail: "Tracking Error" },
        },
      };

    case "ROLLER_FAULT":
      return {
        overallScore: 54,
        beltScore: 70,
        spliceScore: 72,
        driveScore: 75,
        riskLevel: "HIGH_RISK",
        riskLabel: "Roller Bearing Fault",
        conditionDescription:
          "Abnormal high-frequency vibration spike in roller idler assembly. Indicates bearing degradation or seized idler.",
        alerts: [
          {
            id: `alert-roller`,
            timestamp: timeStr,
            level: "critical",
            component: "Roller Idler Zone",
            title: "Abnormal Idler Vibration",
            message: `Vibration spike (${telemetry.vibration.toFixed(2)} mm/s) in idler zone S2. Seized bearing risk.`,
          },
        ],
        components: {
          motor: { status: "healthy", label: "Motor Unit", detail: "Nominal" },
          drivePulley: { status: "healthy", label: "Drive Pulley", detail: "Nominal" },
          beltStrand: { status: "warning", label: "Belt Carry Strand", detail: "Idler Chatter Impact" },
          rollerZone: { status: "critical", label: "Roller Idler Zone", detail: `Severe Vibration: ${telemetry.vibration.toFixed(2)} mm/s` },
          spliceJoint: { status: "healthy", label: "Splice Joint", detail: "Nominal" },
          tailPulley: { status: "healthy", label: "Tail Pulley", detail: "Nominal" },
        },
      };

    case "FRICTION":
      return {
        overallScore: 42,
        beltScore: 35,
        spliceScore: 48,
        driveScore: 52,
        riskLevel: "CRITICAL",
        riskLabel: "Thermal / Friction Hazard",
        conditionDescription:
          "Critical thermal elevation detected. High surface friction between belt carcass and stationary component posing tear hazard.",
        alerts: [
          {
            id: `alert-friction`,
            timestamp: timeStr,
            level: "critical",
            component: "Belt / Roller Interface",
            title: "Critical Thermal Elevation",
            message: `Temperature reached ${telemetry.temperature.toFixed(1)}°C. High risk of belt carcass burning/rupture.`,
          },
        ],
        components: {
          motor: { status: "warning", label: "Motor Unit", detail: "Friction Load Drag" },
          drivePulley: { status: "warning", label: "Drive Pulley", detail: "Thermal Transfer" },
          beltStrand: { status: "critical", label: "Belt Carry Strand", detail: `High Thermal Stress: ${telemetry.temperature.toFixed(1)}°C` },
          rollerZone: { status: "critical", label: "Roller Idler Zone", detail: "Friction Hotspot" },
          spliceJoint: { status: "critical", label: "Splice Joint", detail: "Thermal Softening Risk" },
          tailPulley: { status: "healthy", label: "Tail Pulley", detail: "Nominal" },
        },
      };

    case "NORMAL":
    default:
      return {
        overallScore: 96,
        beltScore: 98,
        spliceScore: 95,
        driveScore: 96,
        riskLevel: "NORMAL",
        riskLabel: "Optimal Operation",
        conditionDescription:
          "All mechanical and electrical parameters are within nominal operational thresholds. No active faults.",
        alerts: [],
        components: {
          motor: { status: "healthy", label: "Motor Unit", detail: "Current 1.4 - 1.8A" },
          drivePulley: { status: "healthy", label: "Drive Pulley", detail: "Nominal Traction" },
          beltStrand: { status: "healthy", label: "Belt Carry Strand", detail: "Aligned & Tensioned" },
          rollerZone: { status: "healthy", label: "Roller Idler Zone", detail: "Smooth Rotation" },
          spliceJoint: { status: "healthy", label: "Splice Joint", detail: "Integrity Verified" },
          tailPulley: { status: "healthy", label: "Tail Pulley", detail: "Nominal Tracking" },
        },
      };
  }
}
