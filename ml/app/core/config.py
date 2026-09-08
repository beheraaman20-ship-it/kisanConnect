"""ML Service Configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Smart Farmer Procurement ML Service"
    app_version: str = "1.0.0"

    # Database
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/kisanconnect"
    async_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kisanconnect"

    # Model storage
    model_dir: str = "saved_models"
    wait_time_model_path: str = "saved_models/wait_time_model.pkl"
    recommend_model_path: str = "saved_models/center_recommend_model.pkl"

    # XGBoost / model config
    random_state: int = 42
    test_size: float = 0.2

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
