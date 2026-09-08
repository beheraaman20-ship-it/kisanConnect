"""Shared evaluation and utility helpers."""

import logging

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)


def evaluate_regression(y_true: pd.Series, y_pred: np.ndarray) -> dict[str, float]:
    """Compute standard regression metrics."""
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred)),
    }


def mean_absolute_percentage_error(y_true, y_pred) -> float:
    """MAPE, guarding against zero true values."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mask = y_true != 0
    if not np.any(mask):
        return float("inf")
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)
