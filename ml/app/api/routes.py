"""FastAPI routes for predictions."""

from fastapi import APIRouter, Query

from app.models.schemas import (
    CenterRecommendRequest,
    CenterRecommendResponse,
    WaitTimePredictRequest,
    WaitTimePredictResponse,
)
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/api/v1", tags=["ml"])


@router.post("/wait-time/predict", response_model=WaitTimePredictResponse)
def predict_wait_time(req: WaitTimePredictRequest) -> WaitTimePredictResponse:
    """Predict estimated waiting time for a farmer at a center."""
    return prediction_service.predict_wait_time(req)


@router.post("/centers/recommend", response_model=CenterRecommendResponse)
def recommend_centers(req: CenterRecommendRequest) -> CenterRecommendResponse:
    """Rank candidate centers for a farmer."""
    return prediction_service.recommend_centers(req)


@router.get("/centers/recommendations", response_model=CenterRecommendResponse)
def live_recommendations(
    lat: float = Query(..., description="Farmer latitude"),
    lng: float = Query(..., description="Farmer longitude"),
    limit: int = Query(5, ge=1, le=20),
) -> CenterRecommendResponse:
    """Recommend centers from live database state."""
    return prediction_service.live_recommendations(lat, lng, limit)
