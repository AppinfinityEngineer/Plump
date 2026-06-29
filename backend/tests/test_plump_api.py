"""Plump backend API tests — tests both public /api/* and local /v1/* routes."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://plump-dev.preview.emergentagent.com").rstrip("/")
LOCAL_URL = "http://localhost:8001"


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- /api/* via PUBLIC ingress ----------
class TestPublicApi:
    def test_health(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "ok"
        assert body["service"] == "plump"
        assert "time" in body

    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=10)
        assert r.status_code == 200
        assert "Plump" in r.json().get("message", "")


# ---------- /v1/* via PUBLIC ingress (the app calls these) ----------
class TestV1PublicRouting:
    """These routes are mounted at root (not /api). Verify whether the public
    ingress actually forwards them to the backend — this is critical because
    the frontend uses EXPO_PUBLIC_BACKEND_URL/v1/... in production."""

    def test_v1_config_public(self, api_client):
        r = api_client.get(f"{BASE_URL}/v1/config", timeout=10)
        ctype = r.headers.get("content-type", "")
        assert r.status_code == 200, r.text
        assert "application/json" in ctype, (
            f"/v1/config not routed to backend via public ingress (got {ctype}). "
            "Frontend remote config call will silently fall back."
        )
        data = r.json()
        assert data["paywallVariant"] == "annual_hero_lifetime_alt"
        assert data["products"]["annual"] == "plump.annual"
        assert data["cardWatermark"] == "plump.app"

    def test_v1_events_public(self, api_client):
        r = api_client.post(f"{BASE_URL}/v1/events", json={"events": [{"name": "TEST_evt"}]}, timeout=10)
        assert r.status_code == 200, r.text
        assert "application/json" in r.headers.get("content-type", "")
        assert r.json()["accepted"] == 1


# ---------- /v1/* via LOCAL backend (sanity that endpoints work) ----------
class TestV1Local:
    def test_config(self, api_client):
        r = api_client.get(f"{LOCAL_URL}/v1/config", timeout=5)
        assert r.status_code == 200
        d = r.json()
        assert d["annualTrialDays"] == 3
        assert d["cardWatermark"] == "plump.app"
        assert set(d["products"].keys()) == {"monthly", "annual", "lifetime"}
        assert set(d["prices"].keys()) == {"monthly", "annual", "lifetime"}

    def test_events_accepts_batch(self, api_client):
        r = api_client.post(
            f"{LOCAL_URL}/v1/events",
            json={"events": [{"name": "TEST_a"}, {"name": "TEST_b", "props": {"x": 1}}]},
            timeout=5,
        )
        assert r.status_code == 200
        assert r.json()["accepted"] == 2

    def test_events_empty(self, api_client):
        r = api_client.post(f"{LOCAL_URL}/v1/events", json={"events": []}, timeout=5)
        assert r.status_code == 200
        assert r.json()["accepted"] == 0

    def test_sync(self, api_client):
        payload = {
            "device_id": "TEST_dev_1",
            "goals": [{"id": "g1", "name": "TEST_goal"}],
            "deposits": [{"id": "d1", "amount": 5}],
        }
        r = api_client.post(f"{LOCAL_URL}/v1/sync", json=payload, timeout=5)
        assert r.status_code == 200
        b = r.json()
        assert b["status"] == "ok"
        assert b["goals"] == 1
        assert b["deposits"] == 1

    def test_sync_empty_defaults(self, api_client):
        r = api_client.post(f"{LOCAL_URL}/v1/sync", json={}, timeout=5)
        assert r.status_code == 200
        assert r.json() == {"status": "ok", "goals": 0, "deposits": 0}

    def test_validate_transaction(self, api_client):
        r = api_client.post(
            f"{LOCAL_URL}/v1/validate-transaction",
            json={"receipt": "TEST_receipt", "productId": "plump.annual", "originalTransactionId": "tx_1"},
            timeout=5,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["productId"] == "plump.annual"
        assert d["status"] == "active"

    def test_app_store_notifications(self, api_client):
        r = api_client.post(
            f"{LOCAL_URL}/v1/app-store-notifications",
            json={"signedPayload": "TEST_jws"},
            timeout=5,
        )
        assert r.status_code == 200
        assert r.json()["received"] is True

    def test_app_store_notifications_invalid_json(self, api_client):
        r = requests.post(
            f"{LOCAL_URL}/v1/app-store-notifications",
            data="not-json",
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        # Endpoint catches JSON parse error and still returns 200 with {received: True}
        assert r.status_code == 200
        assert r.json()["received"] is True


# ---------- Validation ----------
class TestValidation:
    def test_events_bad_schema_returns_422(self, api_client):
        r = api_client.post(f"{LOCAL_URL}/v1/events", json={"events": "not-a-list"}, timeout=5)
        assert r.status_code == 422
