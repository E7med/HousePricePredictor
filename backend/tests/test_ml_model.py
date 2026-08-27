from pathlib import Path

import numpy as np
import pytest
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from pydantic import ValidationError

from app.schemas.prediction import PredictionRequest
from app.services.inference import load_model, predict_price
from app.services.preprocessing import (
    MODEL_FEATURE_COLUMNS,
    load_locations,
    request_to_dataframe,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "house_price.pkl"
CANONICAL_MODEL_PATH = PROJECT_ROOT / "models" / "house_price.pkl"
LOCATIONS_PATH = PROJECT_ROOT / "backend" / "models" / "locations.json"


@pytest.fixture(scope="module")
def real_model():
    """Load the exported model once for the real-pipeline tests."""
    return load_model(MODEL_PATH)


@pytest.fixture(scope="module")
def known_locations() -> list[str]:
    return load_locations(LOCATIONS_PATH)


def make_request(**overrides) -> PredictionRequest:
    values = {
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
    values.update(overrides)
    return PredictionRequest(**values)


def test_model_artifacts_exist_and_are_consistent() -> None:
    assert MODEL_PATH.is_file()
    assert CANONICAL_MODEL_PATH.is_file()
    assert MODEL_PATH.stat().st_size == CANONICAL_MODEL_PATH.stat().st_size
    assert MODEL_PATH.stat().st_size > 50_000_000


def test_real_model_has_expected_pipeline_and_feature_schema(real_model) -> None:
    assert isinstance(real_model, TransformedTargetRegressor)
    assert isinstance(real_model.regressor_, Pipeline)
    assert list(real_model.regressor_.named_steps) == ["preprocessor", "regressor"]
    assert isinstance(real_model.regressor_.named_steps["regressor"], RandomForestRegressor)
    assert list(real_model.regressor_.feature_names_in_) == MODEL_FEATURE_COLUMNS
    assert real_model.regressor_.named_steps["regressor"].n_jobs == 1


@pytest.mark.parametrize(
    "overrides",
    [
        {},
        {
            "location": "pune",
            "carpet_area_sqft": 850,
            "floor_num": 1,
            "bathroom": 1,
            "balcony": 0,
            "furnishing": "Unfurnished",
            "transaction": "New Property",
            "ownership": "Freehold",
            "facing": "North",
        },
    ],
)
def test_real_model_predicts_finite_positive_price(real_model, known_locations, overrides) -> None:
    features = request_to_dataframe(make_request(**overrides), known_locations)

    prediction = predict_price(real_model, features)

    assert isinstance(prediction, float)
    assert np.isfinite(prediction)
    assert prediction > 0


def test_unknown_location_falls_back_to_other_and_still_predicts(real_model, known_locations) -> None:
    features = request_to_dataframe(make_request(location="not-a-real-location"), known_locations)

    assert features.loc[0, "location_grouped"] == "other"
    prediction = predict_price(real_model, features)
    assert np.isfinite(prediction)
    assert prediction > 0


def test_preprocessing_preserves_model_feature_order(real_model, known_locations) -> None:
    features = request_to_dataframe(make_request(), known_locations)

    assert list(features.columns) == MODEL_FEATURE_COLUMNS
    assert np.isfinite(predict_price(real_model, features))


def test_invalid_area_is_rejected_before_model_inference() -> None:
    with pytest.raises(ValidationError):
        make_request(carpet_area_sqft=0)


def test_model_rejects_missing_feature_column(real_model, known_locations) -> None:
    features = request_to_dataframe(make_request(), known_locations).drop(columns="facing")

    with pytest.raises((KeyError, ValueError)):
        real_model.predict(features)
