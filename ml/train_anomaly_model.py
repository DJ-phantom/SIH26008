#!/usr/bin/env python3
"""
ml/train_anomaly_model.py

SIH26008 Conveyor Health Monitoring Platform - Step 12
Unsupervised Multivariate Anomaly Detection Training Script

Learns a NORMAL conveyor telemetry baseline using Isolation Forest on 6 numerical features:
- temperature
- vibration
- current
- speed
- alignment
- load

Scenario filter:
This script queries PostgreSQL for telemetry records WHERE scenario = 'NORMAL'.
The `scenario` field is synthetic dataset metadata used ONLY during training to filter baseline data.
It is NEVER fed into the model as an inference feature.
"""

import json
import math
import os
import sys
from datetime import datetime, timezone
import psycopg
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Add parent directory to sys.path to allow importing backend module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.db import get_connection_params

FEATURE_NAMES = [
    "temperature",
    "vibration",
    "current",
    "speed",
    "alignment",
    "load",
]

MIN_REQUIRED_SAMPLES = 200
CONTAMINATION_RATE = 0.03
N_ESTIMATORS = 200
RANDOM_STATE = 42

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "conveyor_anomaly_model.joblib")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "model_metadata.json")


def fetch_normal_telemetry() -> list[dict]:
    """Queries PostgreSQL for telemetry records representing the synthetic NORMAL baseline."""
    query = """
    SELECT temperature, vibration, current, speed, alignment, load
    FROM telemetry
    WHERE scenario = %s
    ORDER BY id ASC;
    """
    params = get_connection_params()
    with psycopg.connect(**params) as conn:
        with conn.cursor() as cur:
            cur.execute(query, ("NORMAL",))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(columns, row)) for row in rows]


def clean_training_data(raw_records: list[dict]) -> tuple[np.ndarray, int]:
    """Cleans raw dictionary records, rejecting rows with NULL, NaN, or Infinite values.
    
    Returns cleaned numpy array X of shape (N, 6) and usable sample count.
    """
    usable_rows = []
    for row in raw_records:
        vals = []
        valid = True
        for feat in FEATURE_NAMES:
            val = row.get(feat)
            if val is None or not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                valid = False
                break
            vals.append(float(val))
        if valid:
            usable_rows.append(vals)

    if not usable_rows:
        return np.empty((0, len(FEATURE_NAMES))), 0

    X = np.array(usable_rows, dtype=np.float64)
    return X, len(X)


def train_anomaly_model():
    print("=" * 70)
    print("SIH26008 STEP 12: UNSUPVISED MULTIVARIATE ANOMALY DETECTION TRAINING")
    print("=" * 70)

    # 1. Fetch raw NORMAL baseline telemetry
    print("[ML Train] Querying PostgreSQL for synthetic NORMAL baseline telemetry...")
    raw_records = fetch_normal_telemetry()
    total_found = len(raw_records)
    print(f"[ML Train] Total NORMAL rows found in database: {total_found}")

    # 2. Minimum data quantity check
    if total_found < MIN_REQUIRED_SAMPLES:
        print(f"[ML Train] ERROR: Insufficient NORMAL baseline telemetry.")
        print(f"[ML Train] Found {total_found} normal records, but minimum required is {MIN_REQUIRED_SAMPLES}.")
        print("[ML Train] Collect more normal telemetry first by running the conveyor sensor simulator.")
        sys.exit(1)

    # 3. Clean and validate dataset
    X, usable_count = clean_training_data(raw_records)
    print(f"[ML Train] Usable training rows after cleaning: {usable_count}")
    if usable_count < MIN_REQUIRED_SAMPLES:
        print(f"[ML Train] ERROR: Usable training rows ({usable_count}) below minimum threshold ({MIN_REQUIRED_SAMPLES}).")
        sys.exit(1)

    print(f"[ML Train] Ordered Feature Vector (6 Features): {FEATURE_NAMES}")

    # Compute baseline feature statistics (means and standard deviations)
    feature_stats = {}
    print("\nBaseline Feature Statistics (NORMAL Training Set):")
    for i, feat in enumerate(FEATURE_NAMES):
        col = X[:, i]
        mean_val = float(np.mean(col))
        std_val = float(np.std(col))
        # Ensure std is non-zero to avoid divide-by-zero during z-score evaluation
        if std_val < 1e-6:
            std_val = 1e-6
        feature_stats[feat] = {"mean": mean_val, "std": std_val}
        print(f"  - {feat:12s}: mean = {mean_val:8.3f}, std = {std_val:8.3f}")

    # 4. Construct and fit scikit-learn Pipeline
    print(f"\n[ML Train] Fitting Pipeline: StandardScaler -> IsolationForest(n_estimators={N_ESTIMATORS}, contamination={CONTAMINATION_RATE}, random_state={RANDOM_STATE})...")
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", IsolationForest(
            n_estimators=N_ESTIMATORS,
            contamination=CONTAMINATION_RATE,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])
    pipeline.fit(X)

    # 5. Evaluate decision scores on normal training baseline
    scores = pipeline.decision_function(X)
    score_mean = float(np.mean(scores))
    score_std = float(np.std(scores))
    score_min = float(np.min(scores))
    score_p5 = float(np.percentile(scores, 5))
    score_p95 = float(np.percentile(scores, 95))

    print("\nNormal Baseline Decision Score Summary:")
    print(f"  - Mean decision score : {score_mean:+.4f}")
    print(f"  - Std decision score  : {score_std:.4f}")
    print(f"  - Min decision score  : {score_min:+.4f}")
    print(f"  - 5th percentile      : {score_p5:+.4f}")
    print(f"  - 95th percentile     : {score_p95:+.4f}")

    # 6. Save model pipeline artifact
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[ML Train] Saved Isolation Forest pipeline artifact to:\n  {MODEL_PATH}")

    # 7. Save model metadata and calibration info
    metadata = {
        "model_type": "IsolationForest",
        "pipeline_components": ["StandardScaler", "IsolationForest"],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_sample_count": usable_count,
        "features": FEATURE_NAMES,
        "contamination": CONTAMINATION_RATE,
        "random_state": RANDOM_STATE,
        "n_estimators": N_ESTIMATORS,
        "feature_stats": feature_stats,
        "calibration": {
            "score_mean": score_mean,
            "score_std": score_std,
            "score_min": score_min,
            "score_p5": score_p5,
            "score_p95": score_p95,
        },
        "disclaimer": "Prototype Anomaly Detection baseline trained on synthetic NORMAL conveyor telemetry.",
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[ML Train] Saved metadata JSON to:\n  {METADATA_PATH}")

    print("\n[ML Train] Training complete successfully!")
    print("=" * 70)


if __name__ == "__main__":
    train_anomaly_model()
