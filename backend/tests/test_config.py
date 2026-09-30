import pytest
import os
from pydantic import ValidationError
from app.config import Settings


def test_production_missing_jwt_secret_rejected():
    with pytest.raises((ValueError, ValidationError)) as exc_info:
        Settings(
            environment="production",
            jwt_secret=""
        )
    assert "FATAL: JWT_SECRET must be explicitly configured" in str(exc_info.value)


def test_production_default_jwt_secret_rejected():
    known_default = "orbitmeet-secure-default-jwt-secret-key-32chars"
    with pytest.raises((ValueError, ValidationError)) as exc_info:
        Settings(
            environment="production",
            jwt_secret=known_default
        )
    assert "FATAL: Insecure default JWT_SECRET is forbidden" in str(exc_info.value)


def test_production_strong_jwt_secret_accepted():
    strong_secret = "super-secure-production-random-jwt-key-9999"
    cfg = Settings(
        environment="production",
        jwt_secret=strong_secret
    )
    assert cfg.environment == "production"
    assert cfg.jwt_secret == strong_secret


def test_development_default_jwt_secret_allowed():
    cfg = Settings(
        environment="development",
        jwt_secret="orbitmeet-secure-default-jwt-secret-key-32chars"
    )
    assert cfg.environment == "development"
    assert cfg.jwt_secret == "orbitmeet-secure-default-jwt-secret-key-32chars"
