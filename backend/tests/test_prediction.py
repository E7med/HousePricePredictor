from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

VALID_PAYLOAD = {
    "location": "mumbai",
    "carpet_area_sqft": 1200,
    "floor_num": 3,
    "bathroom": 2,
    "balcony": 1,
    "furnishing": "Semi-Furnished",
    "transaction": "Resale",
    "ownership": "Freehold",
    "facing": "East",
}


@pytest.fixture
def dummy_model() -> MagicMock:
    model = MagicMock()
    model.predict.return_value = [1_500_000.0]
    return model


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, dummy_model: MagicMock):
    monkeypatch.setattr("app.main.load_model", lambda path: dummy_model)
    monkeypatch.setattr(
        "app.main.load_locations",
        lambda path: ["mumbai", "pune", "other"],
    )
    with TestClient(app) as test_client:
        yield test_client


def test_health_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_happy_path(client: TestClient) -> None:
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    assert response.json() == {"predicted_price": 1_500_000.0}


def test_unknown_location_maps_to_other(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "location": "not-a-real-city"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    features = client.app.state.model.predict.call_args.args[0]
    assert features.loc[0, "location_grouped"] == "other"


def test_invalid_area_returns_422(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "carpet_area_sqft": 0}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_locations_endpoint(client: TestClient) -> None:
    response = client.get("/locations")
    assert response.status_code == 200
    assert response.json() == {"locations": ["mumbai", "pune", "other"]}
