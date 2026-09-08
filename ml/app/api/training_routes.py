"""FastAPI routes for training / admin."""

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from app.services.training_service import training_service

router = APIRouter(prefix="/api/v1/admin/ml", tags=["admin"])


class TrainRequest(BaseModel):
    days: int = 90


class TrainResponse(BaseModel):
    status: str
    model: str
    metrics: dict


@router.post("/train/wait-time", response_model=TrainResponse)
def train_wait_time(req: TrainRequest) -> TrainResponse:
    """Retrain the wait-time prediction model."""
    try:
        result = training_service.retrain_wait_time(days=req.days)
        return TrainResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/train/recommend", response_model=TrainResponse)
def train_recommend() -> TrainResponse:
    """Retrain/refresh the center recommendation model."""
    result = training_service.retrain_recommend()
    return TrainResponse(**result)
