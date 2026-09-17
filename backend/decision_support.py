import logging
import threading
from datetime import datetime, timezone
from typing import List, Optional

from backend.alert_engine import alert_engine
from backend.anomaly_engine import anomaly_engine
from backend.condition_engine import condition_engine
from backend.db import get_active_alerts
from backend.models import (
    DecisionAction,
    DecisionEvidence,
    DecisionSummary,
)

logger = logging.getLogger("backend.decision_support")


class DecisionSupportEngine:
    """Step 13 Unified Explainable Decision Support Layer.
    
    Brings together:
    - Active rule-based alerts (AlertEngine)
    - Overall conveyor belt condition & splice risk (ConditionEngine)
    - Isolation Forest multivariate anomaly assessment (AnomalyEngine)
    
    Outputs a transparent, evidence-aggregated operator diagnostic summary.
    Does NOT calculate a fake 'Master AI Score' or average risk indices into a single percentage.
    Does NOT inspect `telemetry.scenario` — evaluations are strictly derived from numerical engine outputs.
    """

    def __init__(self):
        self._lock = threading.Lock()

    def generate_summary(self) -> DecisionSummary:
        """Generates a structured DecisionSummary by inspecting current outputs of all three engines."""
        with self._lock:
            # 1. Fetch current outputs from the three independent engines
            active_alerts = get_active_alerts()
            condition_summary = condition_engine.get_latest_summary()
            anomaly_assessment = anomaly_engine.get_latest_assessment()

            device_id = "ESP32-01"
            if condition_summary:
                device_id = condition_summary.device_id

            timestamp_str = datetime.now(timezone.utc).isoformat()

            # 2. Extract key metrics from engines
            crit_alerts = [a for a in active_alerts if a.get("severity") == "CRITICAL"]
            warn_alerts = [a for a in active_alerts if a.get("severity") == "WARNING"]
            active_alert_count = len(active_alerts)

            overall_level = condition_summary.overall.level if condition_summary else "NORMAL"
            overall_risk = condition_summary.overall.risk_index if condition_summary else 0.0
            splice_level = condition_summary.splice.level if condition_summary else "NORMAL"
            splice_risk = condition_summary.splice.risk_index if condition_summary else 0.0

            ml_available = anomaly_assessment.available if anomaly_assessment else False
            ml_status = anomaly_assessment.status if (anomaly_assessment and ml_available) else "MODEL_UNAVAILABLE"
            ml_is_anomaly = anomaly_assessment.is_anomaly if (anomaly_assessment and ml_available) else False
            ml_stable_anomaly = anomaly_assessment.stable_anomaly if (anomaly_assessment and ml_available) else False
            ml_index = anomaly_assessment.anomaly_index if (anomaly_assessment and ml_available) else 0.0

            # 3. Determine Assessment Level (CRITICAL, WARNING, ATTENTION, NORMAL)
            if len(crit_alerts) > 0 or overall_level == "CRITICAL":
                level = "CRITICAL"
            elif (
                len(warn_alerts) > 0
                or overall_level == "WARNING"
                or splice_level == "HIGH"
                or (ml_stable_anomaly and (overall_level in ["ATTENTION", "WARNING"] or splice_level in ["WATCH", "ELEVATED", "HIGH"]))
            ):
                level = "WARNING"
            elif (
                overall_level == "ATTENTION"
                or splice_level in ["WATCH", "ELEVATED"]
                or ml_stable_anomaly
                or ml_is_anomaly
                or ml_index >= 40.0
            ):
                level = "ATTENTION"
            else:
                level = "NORMAL"

            # 4. Determine Evidence Agreement (LOW, MODERATE, HIGH)
            # Count independent systems indicating abnormal telemetry
            rule_abnormal = active_alert_count > 0
            cond_abnormal = overall_level != "NORMAL" or splice_level != "NORMAL"
            ml_abnormal = ml_stable_anomaly or (ml_is_anomaly and ml_index >= 30.0)

            abnormal_system_count = sum([1 for flag in [rule_abnormal, cond_abnormal, ml_abnormal] if flag])

            if level == "NORMAL":
                # All normal systems agree
                agreement = "HIGH" if (not rule_abnormal and not cond_abnormal and not ml_abnormal) else "MODERATE"
            else:
                if abnormal_system_count >= 3:
                    agreement = "HIGH"
                elif abnormal_system_count == 2:
                    agreement = "HIGH" if (rule_abnormal and cond_abnormal) else "MODERATE"
                else:
                    agreement = "LOW" if not ml_available else "MODERATE"

            # 5. Generate Headline
            if level == "CRITICAL":
                headline = "Critical operational condition detected — immediate component inspection recommended."
            elif level == "WARNING":
                headline = "Abnormal mechanical/operating behavior detected — targeted maintenance inspection recommended."
            elif level == "ATTENTION":
                headline = "Elevated telemetry indicator or unusual baseline pattern observed — monitoring recommended."
            else:
                headline = "Conveyor system operating within normal baseline parameters."

            # 6. Aggregate Structured Evidence Items
            evidence_items: List[DecisionEvidence] = []

            # A. Rule Engine Evidence
            for alert in active_alerts:
                sev = alert.get("severity", "WARNING")
                evidence_items.append(
                    DecisionEvidence(
                        source="RULE",
                        severity=sev,
                        title=alert.get("title", f"Rule Alert: {alert.get('metric')}"),
                        detail=f"{alert.get('message')} (Observed: {alert.get('value')} {alert.get('unit')}).",
                    )
                )

            # B. Condition Engine Evidence
            if condition_summary:
                if overall_level != "NORMAL":
                    sev = "CRITICAL" if overall_level == "CRITICAL" else ("WARNING" if overall_level == "WARNING" else "ATTENTION")
                    top_contribs = ", ".join([c.metric for c in condition_summary.overall.contributors[:2]])
                    evidence_items.append(
                        DecisionEvidence(
                            source="CONDITION",
                            severity=sev,
                            title=f"Overall Belt Condition: {overall_level}",
                            detail=f"Multi-sensor risk index at {overall_risk}/100. Primary contributors: {top_contribs}.",
                        )
                    )

                if splice_level != "NORMAL":
                    sev = "WARNING" if splice_level in ["ELEVATED", "HIGH"] else "ATTENTION"
                    evidence_items.append(
                        DecisionEvidence(
                            source="CONDITION",
                            severity=sev,
                            title=f"Splice-related condition: {splice_level}",
                            detail=f"{condition_summary.splice.message} (Splice Risk Index: {splice_risk}/100).",
                        )
                    )

            # C. Anomaly Engine Evidence
            if anomaly_assessment and ml_available:
                if ml_is_anomaly or ml_index >= 30.0:
                    sev = "WARNING" if ml_stable_anomaly else "ATTENTION"
                    top_devs = ", ".join([f"{d.metric} ({d.deviation}σ)" for d in anomaly_assessment.top_deviations[:2]])
                    evidence_items.append(
                        DecisionEvidence(
                            source="ANOMALY",
                            severity=sev,
                            title=f"Isolation Forest Pattern: {ml_status.replace('_', ' ')}",
                            detail=f"Prototype Anomaly Index at {ml_index}/100. Largest baseline deviations: {top_devs}.",
                        )
                    )

            # Sort evidence by severity priority (CRITICAL > WARNING > ATTENTION) and limit to top 5
            severity_order = {"CRITICAL": 0, "WARNING": 1, "ATTENTION": 2}
            evidence_items.sort(key=lambda e: severity_order.get(e.severity, 3))
            evidence_items = evidence_items[:5]

            # 7. Generate Conservative Suggested Inspection Actions
            actions_set = []
            action_priority = "PRIORITY" if level == "CRITICAL" else ("RECOMMENDED" if level in ["WARNING", "ATTENTION"] else "ROUTINE")

            # Collect metrics showing abnormal behavior across engines
            abnormal_metrics = set()
            for alert in active_alerts:
                abnormal_metrics.add(alert.get("metric"))

            if condition_summary:
                for c in condition_summary.overall.contributors:
                    if c.risk >= 30.0:
                        abnormal_metrics.add(c.metric)

            if anomaly_assessment and ml_available:
                for d in anomaly_assessment.top_deviations:
                    if d.deviation >= 3.0:
                        abnormal_metrics.add(d.metric)

            # Map observed metrics to specific conservative inspection actions
            if splice_level in ["WATCH", "ELEVATED", "HIGH"] or "vibration" in abnormal_metrics:
                actions_set.append("Inspect monitored splice S1 and nearby pulley bearing assemblies for mechanical wear.")

            if "alignment" in abnormal_metrics:
                actions_set.append("Inspect belt tracking, return idlers, and alignment guide mechanism.")

            if "current" in abnormal_metrics or "load" in abnormal_metrics:
                actions_set.append("Inspect conveyor material loading, drive motor power current, and mechanical resistance.")

            if "temperature" in abnormal_metrics:
                actions_set.append("Inspect drive motor, main bearings, and gearbox housing for thermal heating.")

            if "speed" in abnormal_metrics:
                actions_set.append("Inspect drive belt coupling, tachometer speed sensors, and check for possible belt slippage.")

            if ml_stable_anomaly and len(active_alerts) == 0:
                actions_set.append("Review recent 6-sensor telemetry trends and inspect conveyor if anomalous pattern persists.")

            if not actions_set:
                actions_set.append("Continue standard continuous telemetry monitoring and routine scheduled maintenance.")

            # Construct DecisionAction list
            suggested_actions = [
                DecisionAction(priority=action_priority, action=act)
                for act in actions_set[:3]
            ]

            return DecisionSummary(
                device_id=device_id,
                timestamp=timestamp_str,
                level=level,
                headline=headline,
                evidence_agreement=agreement,
                active_alert_count=active_alert_count,
                condition_level=overall_level,
                splice_level=splice_level,
                ml_status=ml_status,
                evidence=evidence_items,
                suggested_actions=suggested_actions,
            )


# Global singleton instance for the backend
decision_support_engine = DecisionSupportEngine()
