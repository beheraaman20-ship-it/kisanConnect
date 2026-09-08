"""Pydantic schemas for prediction requests and responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WaitTimePredictRequest(BaseModel):
    """Input features for wait-time prediction."""

    center_id: int = Field(..., description="Procurement center id")
    queue_length: int = Field(..., ge=0, description="Number of farmers ahead in the queue")
    active_counters: int = Field(..., ge=1, description="Number of active processing counters")
    avg_processing_minutes: float = Field(..., ge=0, description="Average minutes to process one farmer")
    time_of_day: str = Field(..., description="HH:MM 24-hour format")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday ... 6=Sunday")
    slot_id: Optional[int] = None
    commodity: Optional[str] = None
    is_peak_hour: Optional[bool] = None


class WaitTimePredictResponse(BaseModel):
    """Wait time prediction result."""

    predicted_wait_minutes: float
    confidence_low: float
    confidence_high: float
    baseline_wait_minutes: float
    model_version: str
    predicted_at: datetime = Field(default_factory=datetime.utcnow)


class CenterRecommendRequest(BaseModel):
    """Inputs for center recommendation."""

    farmer_id: Optional[int] = None
    farmer_lat: float = Field(..., description="Farmer's latitude")
    farmer_lng: float = Field(..., description="Farmer's longitude")
    centers: list["CenterCandidate"] = Field(..., description="Candidate centers to rank")


class CenterCandidate(BaseModel):
    """A single candidate center for ranking."""

    center_id: int
    name: Optional[str] = None
    latitude: float
    longitude: float
    current_queue_length: int = 0
    predicted_wait_minutes: float = 0
    slot_available: bool = True
    is_open: bool = True
    distance_km: Optional[float] = None


class CenterRecommendResponse(BaseModel):
    """Ranked list of recommended centers."""

    ranked_centers: list["RankedCenter"]
    model_version: str
    predicted_at: datetime = Field(default_factory=datetime.utcnow)


class RankedCenter(BaseModel):
    """A center with its recommendation score."""

    center_id: int
    name: Optional[str] = None
    score: float
    rank: int
    distance_km: Optional[float]
    predicted_wait_minutes: float


class HealthResponse(BaseModel):
    """Service health status."""

    status: str
    app_name: str
    version: str
