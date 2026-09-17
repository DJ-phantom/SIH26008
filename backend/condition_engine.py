"""Transparent Multi-Sensor Condition Assessment Engine.

SCIENTIFIC DISCLAIMER:
This ConditionEngine calculates a PROTOTYPE RISK INDEX (0–100) and condition
summaries based on a rolling window of synthetic demonstration telemetry.
It is NOT machine learning, AI prediction, remaining useful life (RUL), failure
probability, or an experimentally calibrated industrial health percentage.

ABSOLUTE RULE:
This engine extracts numerical telemetry attributes ONLY.
It DOES NOT inspect or depend on `telemetry.scenario`.
"""

import logging
import threading
from collections import deque
from typing import Dict, Any, List, Optional

from backend.models import (
    TelemetryData,
    MetricRisk,
    OverallCondition,
    SpliceCondition,
    ConditionSummary,
)
from backend.monitoring_config import (
    PROTOTYPE_DEMO_THRESHOLDS,
    OVERALL_BELT_WEIGHTS,
    SPLICE_RISK_WEIGHTS,
)

logger = logging.getLogger("backend.condition_engine")

ROLLING_WINDOW_SIZE = 20  # 20 samples (~20 seconds at 1 Hz)
WARMUP_SAMPLE_THRESHOLD = 5  # warming_up = True until at least 5 samples exist


class ConditionEngine:
    """Multi-sensor condition assessment engine maintaining a rolling numerical telemetry window."""

    def __init__(self, window_size: int = ROLLING_WINDOW_SIZE):
        self._window_size = window_size
        self._window: deque = deque(maxlen=window_size)
        self._lock = threading.Lock()
        self._latest_summary: Optional[ConditionSummary] = None

    def calculate_metric_risk(self, metric: str, value: float) -> float:
        """Computes a transparent 0-100 prototype risk contribution for a numerical metric value."""
        cfg = PROTOTYPE_DEMO_THRESHOLDS.get(metric)
        if not cfg:
            return 0.0

        mtype = cfg["type"]
        warn_val = float(cfg["warning"])
        crit_val = float(cfg["critical"])

        if mtype == "high":
            normal_max = float(cfg.get("normal_max", warn_val * 0.85))
            if value <= normal_max:
                risk = (max(0.0, value) / normal_max) * 20.0
            elif value <= warn_val:
                risk = 20.0 + ((value - normal_max) / (warn_val - normal_max)) * 20.0
            elif value <= crit_val:
                risk = 40.0 + ((value - warn_val) / (crit_val - warn_val)) * 40.0
            else:
                risk = 80.0 + min(20.0, ((value - crit_val) / (crit_val * 0.2)) * 20.0)

        elif mtype == "low":
            normal_min = float(cfg.get("normal_min", warn_val * 1.02))
            if value >= normal_min:
                risk = max(0.0, (1.90 - value) / (1.90 - normal_min)) * 20.0 if normal_min < 1.90 else 0.0
            elif value >= warn_val:
                risk = 20.0 + ((normal_min - value) / (normal_min - warn_val)) * 20.0
            elif value >= crit_val:
                risk = 40.0 + ((warn_val - value) / (warn_val - crit_val)) * 40.0
            else:
                risk = 80.0 + min(20.0, ((crit_val - value) / (crit_val * 0.1)) * 20.0)

        elif mtype == "abs_high":
            abs_v = abs(value)
            normal_max = float(cfg.get("normal_max", 2.0))
            if abs_v <= normal_max:
                risk = (abs_v / normal_max) * 20.0
            elif abs_v <= warn_val:
                risk = 20.0 + ((abs_v - normal_max) / (warn_val - normal_max)) * 20.0
            elif abs_v <= crit_val:
                risk = 40.0 + ((abs_v - warn_val) / (crit_val - warn_val)) * 40.0
            else:
                risk = 80.0 + min(20.0, ((abs_v - crit_val) / 2.0) * 20.0)
        else:
            risk = 0.0

        return max(0.0, min(100.0, round(risk, 2)))

    def process_telemetry(self, telemetry: TelemetryData) -> ConditionSummary:
        """Processes incoming numerical telemetry packet and updates condition summary.
        
        CRITICAL GUARANTEE:
        Extracts numerical measurement fields ONLY.
        Does NOT inspect `telemetry.scenario`.
        """
        # Extract numerical measurements strictly
        packet = {
            "device_id": telemetry.device_id,
            "timestamp": telemetry.timestamp,
            "temperature": float(telemetry.temperature),
            "vibration": float(telemetry.vibration),
            "current": float(telemetry.current),
            "speed": float(telemetry.speed),
            "alignment": float(telemetry.alignment),
            "load": float(telemetry.load),
        }

        with self._lock:
            self._window.append(packet)
            sample_count = len(self._window)
            warming_up = sample_count < WARMUP_SAMPLE_THRESHOLD

            # Compute smoothed metric averages over rolling window
            avg_measurements: Dict[str, float] = {}
            for metric in PROTOTYPE_DEMO_THRESHOLDS.keys():
                vals = [p[metric] for p in self._window if metric in p]
                avg_measurements[metric] = sum(vals) / len(vals) if vals else 0.0

            # Calculate individual metric risk scores
            metric_risks: Dict[str, float] = {}
            for metric, avg_val in avg_measurements.items():
                metric_risks[metric] = self.calculate_metric_risk(metric, avg_val)

            # 1. OVERALL BELT CONDITION FUSION
            raw_overall_risk = sum(
                metric_risks[m] * OVERALL_BELT_WEIGHTS[m]
                for m in OVERALL_BELT_WEIGHTS
                if m in metric_risks
            )
            overall_risk_index = round(max(0.0, min(100.0, raw_overall_risk)), 1)

            # Overall level classification
            if overall_risk_index < 20.0:
                overall_level = "NORMAL"
            elif overall_risk_index < 40.0:
                overall_level = "ATTENTION"
            elif overall_risk_index < 70.0:
                overall_level = "WARNING"
            else:
                overall_level = "CRITICAL"

            # Safeguard rules
            any_critical_metric = any(risk >= 80.0 for risk in metric_risks.values())
            warning_metrics_count = sum(1 for risk in metric_risks.values() if risk >= 40.0)

            if any_critical_metric:
                overall_level = "CRITICAL"
            elif warning_metrics_count >= 2 and overall_level in ("NORMAL", "ATTENTION"):
                overall_level = "WARNING"

            # 2. PROTOTYPE SPLICE CONDITION FUSION
            raw_splice_risk = sum(
                metric_risks[m] * SPLICE_RISK_WEIGHTS[m]
                for m in SPLICE_RISK_WEIGHTS
                if m in metric_risks
            )
            splice_risk_index = round(max(0.0, min(100.0, raw_splice_risk)), 1)

            # Splice condition level classification
            if splice_risk_index < 20.0:
                splice_level = "NORMAL"
            elif splice_risk_index < 40.0:
                splice_level = "WATCH"
            elif splice_risk_index < 70.0:
                splice_level = "ELEVATED"
            else:
                splice_level = "HIGH"

            # 3. TOP CONTRIBUTORS GENERATION
            sorted_metrics = sorted(
                metric_risks.items(), key=lambda item: item[1], reverse=True
            )

            all_metric_risks: List[MetricRisk] = [
                MetricRisk(
                    metric=m,
                    risk=round(r, 1),
                    value=round(avg_measurements[m], 2),
                    unit=PROTOTYPE_DEMO_THRESHOLDS[m]["unit"],
                )
                for m, r in sorted_metrics
            ]

            overall_top_contributors = all_metric_risks[:3]

            # Splice top contributors (filtered by splice metrics)
            splice_metric_keys = set(SPLICE_RISK_WEIGHTS.keys())
            splice_contributors = [
                mr for mr in all_metric_risks if mr.metric in splice_metric_keys
            ][:3]

            # 4. EXPLAINABLE EVIDENCE MESSAGE GENERATION
            top_splice_metrics = [c.metric for c in splice_contributors if c.risk >= 30.0]
            if not top_splice_metrics:
                splice_msg = "Prototype splice condition is within nominal limits based on multi-sensor telemetry window."
            else:
                joined_metrics = " and ".join(top_splice_metrics[:2])
                splice_msg = (
                    f"Prototype splice risk is {splice_level.lower()} due to combined {joined_metrics} behaviour. "
                    f"Physical joint inspection is recommended for demonstration purposes."
                )

            summary = ConditionSummary(
                device_id=telemetry.device_id,
                timestamp=telemetry.timestamp,
                sample_count=sample_count,
                warming_up=warming_up,
                overall=OverallCondition(
                    risk_index=overall_risk_index,
                    level=overall_level,
                    contributors=overall_top_contributors,
                ),
                splice=SpliceCondition(
                    risk_index=splice_risk_index,
                    level=splice_level,
                    contributors=splice_contributors,
                    message=splice_msg,
                ),
            )

            self._latest_summary = summary
            return summary

    def get_latest_summary(self) -> Optional[ConditionSummary]:
        with self._lock:
            return self._latest_summary


# Global singleton instance for backend
condition_engine = ConditionEngine()
