"""
Backend basic test suite — ensure routes return expected status codes.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data


def test_register_and_login():
    # Register
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser99",
        "password": "TestPass1",
        "full_name": "Test User",
    })
    assert resp.status_code in (201, 409)  # 409 if already exists
    if resp.status_code == 201:
        token = resp.json()["access_token"]
        assert token

    # Login
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass1",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_protected_route_without_token():
    resp = client.get("/api/v1/detections/")
    assert resp.status_code == 403  # No credentials


def test_protected_route_invalid_token():
    resp = client.get("/api/v1/detections/", headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401
