import os
from pydantic import model_validator
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

    @model_validator(mode="after")
    def validate_production_security(self):
        env = (os.getenv("ENVIRONMENT") or self.environment or os.getenv("RAILWAY_ENVIRONMENT") or "development").lower()
        self.environment = env
        KNOWN_INSECURE_DEFAULT = "orbitmeet-secure-default-jwt-secret-key-32chars"
        if env == "production":
            if not self.jwt_secret or self.jwt_secret.strip() == "":
                raise ValueError("FATAL: JWT_SECRET must be explicitly configured in production environment!")
            if self.jwt_secret == KNOWN_INSECURE_DEFAULT:
                raise ValueError("FATAL: Insecure default JWT_SECRET is forbidden in production environment!")
        return self


settings = Settings()

