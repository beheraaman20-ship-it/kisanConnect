"""Model registry to load/save model instances shared across the service."""

from app.core.config import settings
from app.core.logging import app_logger
from app.models.center_recommend_model import CenterRecommendModel
from app.models.wait_time_model import WaitTimeModel


class ModelRegistry:
    """Holds live model instances and provides lazy loading."""

    def __init__(self) -> None:
        self._wait_time: WaitTimeModel | None = None
        self._recommend: CenterRecommendModel | None = None
        self._loaded = False

    def ensure_loaded(self) -> None:
        if self._loaded:
            return
        self.get_wait_time_model()
        self.get_recommend_model()
        self._loaded = True

    def get_wait_time_model(self) -> WaitTimeModel:
        if self._wait_time is None:
            self._wait_time = WaitTimeModel()
            self._wait_time.load(settings.wait_time_model_path)
        return self._wait_time

    def get_recommend_model(self) -> CenterRecommendModel:
        if self._recommend is None:
            self._recommend = CenterRecommendModel()
            self._recommend.load(settings.recommend_model_path)
        return self._recommend

    def save_all(self) -> None:
        if self._wait_time is not None:
            self._wait_time.save(settings.wait_time_model_path)
        if self._recommend is not None:
            self._recommend.save(settings.recommend_model_path)


registry = ModelRegistry()