from unittest.mock import patch
import pytest
from app.models.user import User


def test_register_success(client, db_session):
    payload = {
        "email": "alice@example.com",
        "password": "Password123!",
        "display_name": "Alice Tester"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert "token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["display_name"] == "Alice Tester"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]

    # Verify password hash in db is not plaintext
    user = db_session.query(User).filter(User.email == "alice@example.com").first()
    assert user is not None
    assert user.password_hash.startswith("$2b$")
    assert "Password123!" not in user.password_hash


def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "display_name": "Dup One"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert res2.json()["detail"] == "An account with this email already exists"


def test_register_invalid_email(client):
    payload = {
        "email": "not-an-email",
        "password": "Password123!",
        "display_name": "Invalid Email"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 422


def test_register_short_password(client):
    payload = {
        "email": "short@example.com",
        "password": "short",
        "display_name": "Short Password"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 422


def test_login_success(client):
    register_payload = {
        "email": "bob@example.com",
        "password": "Password123!",
        "display_name": "Bob Builder"
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "BOB@EXAMPLE.COM",  # Case insensitive test
        "password": "Password123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "bob@example.com"


def test_login_wrong_password(client):
    register_payload = {
        "email": "charlie@example.com",
        "password": "Password123!",
        "display_name": "Charlie"
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "charlie@example.com",
        "password": "WrongPassword999!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client):
    res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "anypassword"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"


def test_get_me_authenticated(client):
    reg = client.post("/api/auth/register", json={
        "email": "dave@example.com",
        "password": "Password123!",
        "display_name": "Dave"
    }).json()
    token = reg["token"]

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "dave@example.com"
    assert res.json()["display_name"] == "Dave"


def test_get_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_logout(client):
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_google_login_new_user(client, db_session):
    mock_idinfo = {
        "sub": "google_sub_123456789",
        "email": "googler@example.com",
        "name": "Google User Name",
        "picture": "https://lh3.googleusercontent.com/avatar.png"
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_idinfo):
        res = client.post("/api/auth/google", json={"credential": "mock_valid_token_string"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["email"] == "googler@example.com"
        assert data["user"]["display_name"] == "Google User Name"
        assert data["user"]["avatar_url"] == "https://lh3.googleusercontent.com/avatar.png"
        assert "token" in data

        user = db_session.query(User).filter(User.google_sub == "google_sub_123456789").first()
        assert user is not None
        assert user.password_hash is None


def test_google_login_existing_user(client):
    mock_idinfo = {
        "sub": "google_sub_repeat_999",
        "email": "repeat@example.com",
        "name": "Repeat User",
        "picture": "https://avatar.png"
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_idinfo):
        res1 = client.post("/api/auth/google", json={"credential": "mock_token_1"})
        assert res1.status_code == 200
        user_id_1 = res1.json()["user"]["id"]

        res2 = client.post("/api/auth/google", json={"credential": "mock_token_2"})
        assert res2.status_code == 200
        user_id_2 = res2.json()["user"]["id"]
        assert user_id_1 == user_id_2


def test_google_login_account_collision_with_password_user(client):
    # Register with password first
    client.post("/api/auth/register", json={
        "email": "collision@example.com",
        "password": "Password123!",
        "display_name": "Collision User"
    })

    # Attempt Google sign-in with same email but new Google sub
    mock_idinfo = {
        "sub": "google_sub_different_attacker",
        "email": "collision@example.com",
        "name": "Attacker Name",
        "picture": None
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_idinfo):
        res = client.post("/api/auth/google", json={"credential": "mock_collision_token"})
        assert res.status_code == 409
        assert res.json()["detail"] == "ACCOUNT_EXISTS_WITH_DIFFERENT_METHOD"


def test_google_login_invalid_token(client):
    with patch("google.oauth2.id_token.verify_oauth2_token", side_effect=ValueError("Token expired")):
        res = client.post("/api/auth/google", json={"credential": "expired_token_123"})
        assert res.status_code == 401
        assert "Invalid Google ID token" in res.json()["detail"]
