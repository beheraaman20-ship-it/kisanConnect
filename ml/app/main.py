"""Main FastAPI application entrypoint for the ML service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as ml_router
from app.api.training_routes import router as training_router
from app.core.config import settings
from app.core.logging import app_logger
from app.models.registry import registry

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ML service for Smart Farmer Procurement Management System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ml_router)
app.include_router(training_router)


@app.on_event("startup")
def on_startup() -> None:
    app_logger.info("Loading ML models...")
    registry.ensure_loaded()
    app_logger.info("ML service ready.")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/")
def root() -> dict:
    return {"message": "Smart Farmer Procurement ML Service", "docs": "/docs"}
