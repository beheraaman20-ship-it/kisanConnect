"""ML Service Configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Smart Farmer Procurement ML Service"
    app_version: str = "1.0.0"

    # Database
    # Default: read the backend's SQLite database directly (no install needed).
    # For a PostgreSQL deployment, set DATABASE_URL to a postgresql+psycopg2:// URL.
    database_url: str = "sqlite:///C:/KisanConnectBackend/data/kisanconnect.db"
    async_database_url: str = "sqlite+aiosqlite:///C:/KisanConnectBackend/data/kisanconnect.db"

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
