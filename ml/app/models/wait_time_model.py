"""Wait Time Prediction model using XGBoost regression.

Features:
- queue_length (people ahead)
- active_counters (operators working)
- avg_processing_minutes (historical per-farmer processing time)
- hour of day
- day of week
- is_peak_hour (derived)
- slot capacity pressure
- center historical load ratio

Baseline (fallback) formula per the master document:
    estimated_wait = (people_ahead * avg_processing_minutes) / active_counters
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

from app.core.config import settings

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "queue_length",
    "active_counters",
    "avg_processing_minutes",
    "hour",
    "day_of_week",
    "is_peak_hour",
    "center_load_ratio",
    "commodity_encoded",
]


class WaitTimeModel:
    """Wrapper around an XGBoost regressor for wait-time prediction."""

    def __init__(self) -> None:
        self.model: Optional[XGBRegressor] = None
        self.pipeline: Optional[Pipeline] = None
        self.feature_names: list[str] = FEATURE_COLUMNS
        self.version = "wait_time_v1.0"
        self.trained_at: Optional[datetime] = None
        self.metrics: dict[str, float] = {}

    def _build_pipeline(self) -> Pipeline:
        numeric_features = [
            "queue_length",
            "active_counters",
            "avg_processing_minutes",
            "hour",
            "day_of_week",
            "is_peak_hour",
            "center_load_ratio",
        ]
        categorical_features = ["commodity_encoded"]

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), numeric_features),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ]
        )

        model = XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=settings.random_state,
            objective="reg:squarederror",
        )

        return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])

    def train(self, df: pd.DataFrame) -> dict[str, float]:
        """Train the model on a DataFrame with the expected feature columns + 'wait_minutes' target."""
        required = set(self.feature_names) | {"wait_minutes"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Training data missing columns: {missing}")

        X = df[self.feature_names].copy()
        y = df["wait_minutes"].astype(float)

        pipeline = self._build_pipeline()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=settings.test_size, random_state=settings.random_state
        )

        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        self.pipeline = pipeline
        self.model = pipeline.named_steps["regressor"]
        self.trained_at = datetime.utcnow()

        self.metrics = {
            "mae": float(mean_absolute_error(y_test, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "r2": float(r2_score(y_test, y_pred)),
            "baseline_mae": float(self._baseline_mae(X_test, y_test)),
        }

        logger.info("Training complete. Metrics: %s", self.metrics)
        return self.metrics

    def _baseline_mae(self, X_test: pd.DataFrame, y_test: pd.Series) -> float:
        """Evaluate the simple baseline formula for comparison."""
        est = self._baseline_predict(X_test)
        return float(mean_absolute_error(y_test, est))

    def _baseline_predict(self, X: pd.DataFrame) -> np.ndarray:
        """Simple transparent baseline: people_ahead * avg_processing / active_counters."""
        est = (
            X["queue_length"] * X["avg_processing_minutes"]
        ) / np.maximum(X["active_counters"], 1)
        return est.values

    def predict(self, features: dict[str, Any]) -> dict[str, Any]:
        """Predict wait time for a single feature dict.

        Returns predicted value plus confidence bounds.
        """
        X = self._single_feature_frame(features)

        if self.pipeline is not None:
            pred = float(self.pipeline.predict(X)[0])
            baseline = float(self._baseline_predict(X)[0])
        else:
            pred = float(self._baseline_predict(X)[0])
            baseline = pred

        # Simple heuristic confidence interval based on model MAE
        std = self.metrics.get("mae", 5.0)
        low = max(0.0, pred - 1.5 * std)
        high = pred + 1.5 * std

        return {
            "predicted_wait_minutes": round(pred, 1),
            "baseline_wait_minutes": round(baseline, 1),
            "confidence_low": round(low, 1),
            "confidence_high": round(high, 1),
            "model_version": self.version,
        }

    def _single_feature_frame(self, features: dict[str, Any]) -> pd.DataFrame:
        hour = self._parse_hour(features.get("time_of_day"))
        peak = (
            features.get("is_peak_hour")
            if features.get("is_peak_hour") is not None
            else self._is_peak_hour(hour)
        )
        load_ratio = features.get(
            "center_load_ratio",
            min(1.0, features.get("queue_length", 0) / max(features.get("slot_capacity", 100), 1)),
        )
        commodity = features.get("commodity", "general")

        row = {
            "queue_length": float(features.get("queue_length", 0)),
            "active_counters": float(features.get("active_counters", 1)),
            "avg_processing_minutes": float(features.get("avg_processing_minutes", 15.0)),
            "hour": hour,
            "day_of_week": int(features.get("day_of_week", 0)),
            "is_peak_hour": int(peak),
            "center_load_ratio": float(load_ratio),
            "commodity_encoded": commodity,
        }
        return pd.DataFrame([row])

    @staticmethod
    def _parse_hour(time_of_day: Any) -> int:
        if isinstance(time_of_day, (int, float)):
            return int(time_of_day)
        if isinstance(time_of_day, str) and ":" in time_of_day:
            try:
                return int(time_of_day.split(":")[0])
            except ValueError:
                return 10
        return 10

    @staticmethod
    def _is_peak_hour(hour: int) -> bool:
        # Peak procurement hours in agricultural centers (morning)
        return (8 <= hour <= 11) or (16 <= hour <= 18)

    def save(self, path: Optional[str] = None) -> str:
        path = path or settings.wait_time_model_path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        payload = {
            "model": self.model,
            "pipeline": self.pipeline,
            "feature_names": self.feature_names,
            "version": self.version,
            "trained_at": self.trained_at,
            "metrics": self.metrics,
        }
        joblib.dump(payload, path)
        logger.info("Saved wait-time model to %s", path)
        return path

    def load(self, path: Optional[str] = None) -> None:
        path = path or settings.wait_time_model_path
        if not os.path.exists(path):
            logger.warning("Model not found at %s; using baseline only.", path)
            return
        payload = joblib.load(path)
        self.model = payload["model"]
        self.pipeline = payload["pipeline"]
        self.feature_names = payload["feature_names"]
        self.version = payload["version"]
        self.trained_at = payload["trained_at"]
        self.metrics = payload["metrics"]
        logger.info("Loaded wait-time model %s", self.version)
