"""Prediction orchestration services."""

import logging

import pandas as pd

from app.data.pipeline import extract_center_data
from app.models.schemas import (
    CenterCandidate,
    CenterRecommendRequest,
    CenterRecommendResponse,
    RankedCenter,
    WaitTimePredictRequest,
    WaitTimePredictResponse,
)
from app.models.registry import registry

logger = logging.getLogger(__name__)


class PredictionService:
    """Handles wait-time prediction and center recommendation logic."""

    def predict_wait_time(self, req: WaitTimePredictRequest) -> WaitTimePredictResponse:
        model = registry.get_wait_time_model()

        features = {
            "center_id": req.center_id,
            "queue_length": req.queue_length,
            "active_counters": req.active_counters,
            "avg_processing_minutes": req.avg_processing_minutes,
            "time_of_day": req.time_of_day,
            "day_of_week": req.day_of_week,
            "commodity": req.commodity,
            "is_peak_hour": req.is_peak_hour,
            "slot_id": req.slot_id,
        }

        result = model.predict(features)

        return WaitTimePredictResponse(
            predicted_wait_minutes=result["predicted_wait_minutes"],
            confidence_low=result["confidence_low"],
            confidence_high=result["confidence_high"],
            baseline_wait_minutes=result["baseline_wait_minutes"],
            model_version=result["model_version"],
        )

    def recommend_centers(
        self, req: CenterRecommendRequest
    ) -> CenterRecommendResponse:
        model = registry.get_recommend_model()

        centers = [c.model_dump() for c in req.centers]
        ranked = model.rank(farmer_lat=req.farmer_lat, farmer_lng=req.farmer_lng, centers=centers)

        ranked_response = [
            RankedCenter(
                center_id=c["center_id"],
                name=c.get("name"),
                score=c["score"],
                rank=c["rank"],
                distance_km=c.get("distance_km"),
                predicted_wait_minutes=c.get("predicted_wait_minutes", 0),
            )
            for c in ranked
        ]

        return CenterRecommendResponse(
            ranked_centers=ranked_response,
            model_version=model.version,
        )

    def live_recommendations(
        self,
        farmer_lat: float,
        farmer_lng: float,
        limit: int = 5,
    ) -> CenterRecommendResponse:
        """Recommend from live DB center state (used by backend)."""
        model = registry.get_recommend_model()
        model.predict  # ensure loaded

        df = extract_center_data()
        if df.empty:
            return CenterRecommendResponse(ranked_centers=[], model_version=model.version)

        candidates = []
        for _, row in df.iterrows():
            candidates.append(
                {
                    "center_id": int(row["center_id"]),
                    "name": row.get("name"),
                    "latitude": float(row.get("latitude", 0)),
                    "longitude": float(row.get("longitude", 0)),
                    "current_queue_length": int(row.get("current_queue_length", 0)),
                    "predicted_wait_minutes": float(row.get("avg_processing_minutes", 15))
                    * max(1, int(row.get("current_queue_length", 0))),
                    "slot_available": True,
                    "is_open": bool(row.get("is_open") == "active" or row.get("is_open") is True),
                }
            )

        ranked = model.rank(farmer_lat, farmer_lng, candidates)[:limit]

        ranked_response = [
            RankedCenter(
                center_id=c["center_id"],
                name=c.get("name"),
                score=c["score"],
                rank=c["rank"],
                distance_km=c.get("distance_km"),
                predicted_wait_minutes=c.get("predicted_wait_minutes", 0),
            )
            for c in ranked
        ]

        return CenterRecommendResponse(
            ranked_centers=ranked_response,
            model_version=model.version,
        )


prediction_service = PredictionService()
