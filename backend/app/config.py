from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./zoom_clone.db"
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    frontend_origin: str = "http://localhost:3000"
    environment: str = "development"
    default_host_name: str = "Rohan"

    # Authentication
    jwt_secret: str = "orbitmeet-secure-default-jwt-secret-key-32chars"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    google_client_id: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
