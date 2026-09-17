import collections
import json
import logging
import os
import threading
from typing import Optional

import joblib
import numpy as np

from backend.models import AnomalyAssessment, DeviationMetric, TelemetryData

logger = logging.getLogger("backend.anomaly")

FEATURE_ORDER = [
    "temperature",
    "vibration",
    "current",
    "speed",
    "alignment",
    "load",
]

DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
DEFAULT_MODEL_PATH = os.path.join(DEFAULT_MODEL_DIR, "conveyor_anomaly_model.joblib")
DEFAULT_METADATA_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model_metadata.json")


class AnomalyEngine:
    """Step 12 Unsupervised Multivariate Anomaly Detection Engine using Isolation Forest.
    
    Learns normal conveyor telemetry baseline and detects unusual telemetry patterns.
    Uses ONLY the six numerical sensor measurements: temperature, vibration, current, speed, alignment, load.
    Does NOT use scenario, alert severity, timestamps, device IDs, or condition indices as ML input features.
    """

    def __init__(
        self,
        model_path: str = DEFAULT_MODEL_PATH,
        metadata_path: str = DEFAULT_METADATA_PATH,
        window_size: int = 5,
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self._window_size = window_size

        self._pipeline = None
        self._metadata: Optional[dict] = None
        self._is_available = False

        self._recent_predictions = collections.deque(maxlen=window_size)
        self._latest_assessment: Optional[AnomalyAssessment] = None
        self._lock = threading.Lock()

        # Attempt initial model load
        self.load_model()

    def load_model(self) -> bool:
        """Loads the trained scikit-learn Isolation Forest pipeline and metadata JSON.
        
        Returns True if successfully loaded, False if model is unavailable.
        Does not crash backend if model file is missing or invalid.
        """
        with self._lock:
            if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
                print(f"[AnomalyEngine] WARNING: Model artifact not found at {self.model_path}. Anomaly engine running in UNAVAILABLE mode.")
                self._pipeline = None
                self._metadata = None
                self._is_available = False
                return False

            try:
                pipeline = joblib.load(self.model_path)
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    metadata = json.load(f)

                # Verify expected feature order matches model metadata
                saved_features = metadata.get("features", [])
                if saved_features != FEATURE_ORDER:
                    print(f"[AnomalyEngine] ERROR: Feature order mismatch. Expected {FEATURE_ORDER}, found {saved_features}.")
                    self._pipeline = None
                    self._metadata = None
                    self._is_available = False
                    return False

                self._pipeline = pipeline
                self._metadata = metadata
                self._is_available = True
                print(f"[AnomalyEngine] Successfully loaded Isolation Forest model ({metadata.get('model_type')}) trained on {metadata.get('training_sample_count')} NORMAL samples.")
                return True
            except Exception as e:
                print(f"[AnomalyEngine] WARNING: Failed to load model artifact: {e}. Running in UNAVAILABLE mode.")
                self._pipeline = None
                self._metadata = None
                self._is_available = False
                return False

    def is_available(self) -> bool:
        with self._lock:
            return self._is_available

    def process_telemetry(self, telemetry: TelemetryData) -> AnomalyAssessment:
        """Processes incoming numerical telemetry reading, runs Isolation Forest inference,
        updates rolling stability window, calculates prototype anomaly index, and computes top baseline deviations.
        """
        with self._lock:
            if not self._is_available or self._pipeline is None or self._metadata is None:
                fallback = AnomalyAssessment(
                    available=False,
                    is_anomaly=False,
                    stable_anomaly=False,
                    decision_score=0.0,
                    anomaly_index=0.0,
                    status="MODEL_UNAVAILABLE",
                    recent_anomaly_count=0,
                    window_size=self._window_size,
                    top_deviations=[],
                    model_type="IsolationForest",
                    training_sample_count=0,
                )
                self._latest_assessment = fallback
                return fallback

            # 1. ABSOLUTE INFERENCE RULE: Extract ONLY the 6 numerical features in fixed order
            feature_vector = [
                float(telemetry.temperature),
                float(telemetry.vibration),
                float(telemetry.current),
                float(telemetry.speed),
                float(telemetry.alignment),
                float(telemetry.load),
            ]
            X = np.array([feature_vector], dtype=np.float64)

            # 2. Isolation Forest Inference
            # predict returns 1 for inlier (NORMAL), -1 for outlier (ANOMALOUS)
            pred = int(self._pipeline.predict(X)[0])
            is_anomaly = (pred == -1)
            raw_score = float(self._pipeline.decision_function(X)[0])

            # 3. Transparent Prototype Anomaly Index Calibration (0 - 100)
            calib = self._metadata.get("calibration", {})
            score_mean = calib.get("score_mean", 0.05)

            if raw_score >= score_mean:
                # Highly normal score -> index close to 0
                raw_index = max(0.0, 10.0 * (1.0 - (raw_score - score_mean) / (abs(score_mean) + 0.1)))
            elif raw_score >= 0.0:
                # Mild deviation -> index 10 to 50
                denom = score_mean if score_mean > 0 else 0.05
                raw_index = 10.0 + 40.0 * (1.0 - (raw_score / denom))
            else:
                # Negative score (Outlier) -> index 50 to 100
                abs_negative = abs(raw_score)
                raw_index = 50.0 + 50.0 * min(1.0, abs_negative / 0.15)

            anomaly_index = round(float(np.clip(raw_index, 0.0, 100.0)), 1)

            # 4. Rolling Window Stability (5 predictions, majority vote >= 3)
            self._recent_predictions.append(is_anomaly)
            recent_count = sum(1 for x in self._recent_predictions if x)
            stable_anomaly = (recent_count >= 3)
            status_str = "ANOMALOUS_PATTERN" if stable_anomaly else "NORMAL_PATTERN"

            # 5. Top Baseline Deviations Calculation (|x - mean| / std)
            feature_stats = self._metadata.get("feature_stats", {})
            deviations_list = []
            for i, feat in enumerate(FEATURE_ORDER):
                val = feature_vector[i]
                stats = feature_stats.get(feat, {"mean": val, "std": 1.0})
                mean_val = stats.get("mean", val)
                std_val = stats.get("std", 1.0)
                if std_val < 1e-6:
                    std_val = 1e-6

                z_score = abs(val - mean_val) / std_val
                deviations_list.append({
                    "metric": feat,
                    "value": round(val, 2),
                    "deviation": round(z_score, 1),
                })

            # Sort by z-score deviation descending and pick top 3
            deviations_list.sort(key=lambda d: d["deviation"], reverse=True)
            top_deviations = [
                DeviationMetric(
                    metric=d["metric"],
                    value=d["value"],
                    deviation=d["deviation"],
                )
                for d in deviations_list[:3]
            ]

            assessment = AnomalyAssessment(
                available=True,
                is_anomaly=is_anomaly,
                stable_anomaly=stable_anomaly,
                decision_score=round(raw_score, 4),
                anomaly_index=anomaly_index,
                status=status_str,
                recent_anomaly_count=recent_count,
                window_size=self._window_size,
                top_deviations=top_deviations,
                model_type=self._metadata.get("model_type", "IsolationForest"),
                training_sample_count=self._metadata.get("training_sample_count", 0),
            )
            self._latest_assessment = assessment
            return assessment

    def get_latest_assessment(self) -> Optional[AnomalyAssessment]:
        with self._lock:
            if not self._is_available:
                return AnomalyAssessment(
                    available=False,
                    is_anomaly=False,
                    stable_anomaly=False,
                    decision_score=0.0,
                    anomaly_index=0.0,
                    status="MODEL_UNAVAILABLE",
                    recent_anomaly_count=0,
                    window_size=self._window_size,
                    top_deviations=[],
                    model_type="IsolationForest",
                    training_sample_count=0,
                )
            return self._latest_assessment


# Global singleton instance for the backend
anomaly_engine = AnomalyEngine()
