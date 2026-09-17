"""Centralized Prototype Monitoring Configuration for Conveyor Health Platform.

SCIENTIFIC DISCLAIMER:
All thresholds, baseline ranges, and weights in this configuration are
PROTOTYPE DEMONSTRATION PARAMETERS selected for software evaluation against
synthetic operating profiles. They are NOT validated NMDC operating limits,
OEM safety limits, or experimentally calibrated industrial failure limits.
"""

from typing import Dict, Any

# Threshold & Measurement Configuration Shared by Alert Engine and Condition Engine
PROTOTYPE_DEMO_THRESHOLDS: Dict[str, Dict[str, Any]] = {
    "temperature": {
        "warning": 44.5,
        "critical": 48.0,
        "unit": "°C",
        "type": "high",
        "normal_max": 44.0,
        "title_warning": "High Temperature Warning",
        "title_critical": "Critical Temperature Alert",
        "msg_warning": "Temperature exceeded prototype warning threshold (44.5 °C).",
        "msg_critical": "Temperature exceeded prototype critical threshold (48.0 °C).",
    },
    "vibration": {
        "warning": 0.40,
        "critical": 0.60,
        "unit": "g",
        "type": "high",
        "normal_max": 0.35,
        "title_warning": "High Vibration Warning",
        "title_critical": "Critical Vibration Alert",
        "msg_warning": "Vibration exceeded prototype warning threshold (0.40 g).",
        "msg_critical": "Vibration exceeded prototype critical threshold (0.60 g).",
    },
    "current": {
        "warning": 4.70,
        "critical": 5.50,
        "unit": "A",
        "type": "high",
        "normal_max": 4.50,
        "title_warning": "High Motor Current Warning",
        "title_critical": "Critical Motor Current Alert",
        "msg_warning": "Motor current exceeded prototype warning threshold (4.70 A).",
        "msg_critical": "Motor current exceeded prototype critical threshold (5.50 A).",
    },
    "speed": {
        "warning": 1.68,
        "critical": 1.58,
        "unit": "m/s",
        "type": "low",
        "normal_min": 1.70,
        "title_warning": "Low Belt Speed Warning",
        "title_critical": "Critical Low Belt Speed Alert",
        "msg_warning": "Belt speed dropped below prototype warning threshold (1.68 m/s).",
        "msg_critical": "Belt speed dropped below prototype critical threshold (1.58 m/s).",
    },
    "alignment": {
        "warning": 3.0,
        "critical": 5.0,
        "unit": "mm",
        "type": "abs_high",
        "normal_max": 2.0,
        "title_warning": "Belt Misalignment Warning",
        "title_critical": "Critical Belt Misalignment Alert",
        "msg_warning": "Belt lateral displacement exceeded prototype warning threshold (3.0 mm).",
        "msg_critical": "Belt lateral displacement exceeded prototype critical threshold (5.0 mm).",
    },
    "load": {
        "warning": 75.0,
        "critical": 85.0,
        "unit": "%",
        "type": "high",
        "normal_max": 70.0,
        "title_warning": "High Load Warning",
        "title_critical": "Critical Load Alert",
        "msg_warning": "Conveyor load exceeded prototype warning threshold (75.0 %).",
        "msg_critical": "Conveyor load exceeded prototype critical threshold (85.0 %).",
    },
}

# Prototype Heuristic Weights for Overall Conveyor Belt Condition (Sum = 1.00)
OVERALL_BELT_WEIGHTS: Dict[str, float] = {
    "vibration": 0.25,
    "current": 0.20,
    "temperature": 0.15,
    "speed": 0.15,
    "alignment": 0.15,
    "load": 0.10,
}

# Prototype Heuristic Weights for Prototype Splice Risk Assessment (Sum = 1.00)
SPLICE_RISK_WEIGHTS: Dict[str, float] = {
    "vibration": 0.50,
    "alignment": 0.25,
    "current": 0.15,
    "speed": 0.10,
}
