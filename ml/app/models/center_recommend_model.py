"""Smart Center Recommendation model.

Scores and ranks procurement centers based on weighted combination of:
- distance from farmer
- queue length / congestion
- predicted waiting time
- slot availability
- center operating status

When ML data is insufficient, uses a transparent weighted ranking. Once enough
historical preference data exists, it can be upgraded to a learning-to-rank model.
"""

import hashlib
import logging
import math
import os
from datetime import datetime
from typing import Any, Optional

import joblib
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Default weights for the recommendation score (can be tuned)
DEFAULT_WEIGHTS = {
    "distance": 0.35,
    "wait_time": 0.30,
    "queue": 0.15,
    "slot_availability": 0.12,
    "status": 0.08,
}


class CenterRecommendModel:
    """Ranks candidate centers and optionally trains a scoring model."""

    def __init__(self) -> None:
        self.weights: dict[str, float] = dict(DEFAULT_WEIGHTS)
        self.version = "center_recommend_v1.0"
        self.trained_at: Optional[datetime] = None
        self.metrics: dict[str, Any] = {}

    def set_weights(self, weights: dict[str, float]) -> None:
        """Override default score weights."""
        total = sum(weights.values())
        self.weights = {k: v / total for k, v in weights.items()}

    def rank(
        self,
        farmer_lat: float,
        farmer_lng: float,
        centers: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Rank a list of candidate centers.

        Each center dict should include:
            center_id, latitude, longitude,
            current_queue_length, predicted_wait_minutes,
            slot_available, is_open, [distance_km]
        """
        scored: list[dict[str, Any]] = []
        for center in centers:
            distance_km = center.get("distance_km")
            if distance_km is None:
                distance_km = self._haversine(
                    farmer_lat, farmer_lng, center["latitude"], center["longitude"]
                )

            score = self._score_center(center, distance_km)
            scored.append(
                {
                    **center,
                    "distance_km": round(distance_km, 2),
                    "score": round(score, 4),
                }
            )

        scored.sort(key=lambda c: c["score"], reverse=True)
        for rank, center in enumerate(scored, start=1):
            center["rank"] = rank

        return scored

    def _score_center(self, center: dict[str, Any], distance_km: float) -> float:
        w = self.weights

        # Distance score: closer is better (normalized by 50 km reference)
        distance_score = 1.0 - min(1.0, distance_km / 50.0)

        # Wait-time score: shorter wait is better (normalized by 120 min reference)
        wait = center.get("predicted_wait_minutes", 0)
        wait_score = 1.0 - min(1.0, wait / 120.0)

        # Queue score: fewer people ahead is better (normalized by 100 reference)
        queue = center.get("current_queue_length", 0)
        queue_score = 1.0 - min(1.0, queue / 100.0)

        # Slot availability: 1 if available, 0 otherwise
        slot_score = 1.0 if center.get("slot_available", True) else 0.0

        # Status score: 1 if open, 0 otherwise
        status_score = 1.0 if center.get("is_open", True) else 0.0

        score = (
            w["distance"] * distance_score
            + w["wait_time"] * wait_score
            + w["queue"] * queue_score
            + w["slot_availability"] * slot_score
            + w["status"] * status_score
        )
        return max(0.0, min(1.0, score))

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in kilometers."""
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = (
            math.sin(dphi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        )
        return 2 * r * math.asin(math.sqrt(a))

    def train(self, df: Optional[Any] = None) -> dict[str, Any]:
        """Placeholder for future learning-to-rank training.

        df would contain historical (farmer -> center chosen) interactions.
        Until sufficient data exists we keep the weighted ranking.
        """
        self.trained_at = datetime.utcnow()
        self.metrics = {
            "method": "weighted_ranking",
            "note": "Upgrade to ML ranking when historical preferences are available.",
        }
        logger.info("Center recommendation using weighted ranking. No ML training required yet.")
        return self.metrics

    def save(self, path: Optional[str] = None) -> str:
        path = path or settings.recommend_model_path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        payload = {
            "weights": self.weights,
            "version": self.version,
            "trained_at": self.trained_at,
            "metrics": self.metrics,
        }
        joblib.dump(payload, path)
        logger.info("Saved recommendation model to %s", path)
        return path

    def load(self, path: Optional[str] = None) -> None:
        path = path or settings.recommend_model_path
        if not os.path.exists(path):
            logger.warning("Recommendation model not found at %s; using defaults.", path)
            return
        payload = joblib.load(path)
        self.weights = payload["weights"]
        self.version = payload["version"]
        self.trained_at = payload["trained_at"]
        self.metrics = payload["metrics"]
        logger.info("Loaded recommendation model %s", self.version)
