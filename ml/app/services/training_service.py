"""Training service that exposes a retraining endpoint/job."""

import logging

from app.data.pipeline import extract_wait_time_training_data
from app.models.center_recommend_model import CenterRecommendModel
from app.models.registry import registry
from app.models.wait_time_model import WaitTimeModel

logger = logging.getLogger(__name__)


class TrainingService:
    """Retrain the ML models from historical data."""

    def retrain_wait_time(self, days: int = 90) -> dict:
        df = extract_wait_time_training_data(days=days)
        if df.empty:
            raise ValueError("No training data available.")

        model = WaitTimeModel()
        metrics = model.train(df)
        model.save()

        # Refresh the registry instance
        registry._wait_time = None
        logger.info("Wait-time model retrained and saved. Metrics: %s", metrics)
        return {"status": "ok", "model": model.version, "metrics": metrics}

    def retrain_recommend(self) -> dict:
        model = CenterRecommendModel()
        metrics = model.train()
        model.save()

        registry._recommend = None
        logger.info("Recommendation model saved.")
        return {"status": "ok", "model": model.version, "metrics": metrics}


training_service = TrainingService()
