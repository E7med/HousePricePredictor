import json
from pathlib import Path
from unittest.mock import MagicMock, call

import pandas as pd
import pytest

from app.schemas.prediction import PredictionRequest
from app.services import inference, preprocessing


class ParallelEstimator:
    def __init__(self, n_jobs: int = -1, **children) -> None:
        self.n_jobs = n_jobs
        self.named_steps = children

    def set_params(self, **params):
        self.n_jobs = params["n_jobs"]
        return self


class AssignmentFallbackEstimator:
    def __init__(self) -> None:
        self.n_jobs = -1

    def set_params(self, **_params):
        raise ValueError("unsupported parameter")


class UnassignableEstimator:
    @property
    def n_jobs(self):
        return -1

    @n_jobs.setter
    def n_jobs(self, _value):
        raise TypeError("read-only")

    def set_params(self, **_params):
        raise TypeError("unsupported parameter")


def test_constrain_parallelism_handles_none_and_nested_estimators() -> None:
    nested = ParallelEstimator()
    root = ParallelEstimator(stage=nested)
    root.regressor_ = nested
    root.estimator = nested

    inference.constrain_parallelism(None)
    inference.constrain_parallelism(root)

    assert root.n_jobs == 1
    assert nested.n_jobs == 1


def test_constrain_parallelism_falls_back_to_assignment() -> None:
    estimator = AssignmentFallbackEstimator()

    inference.constrain_parallelism(estimator)

    assert estimator.n_jobs == 1


def test_constrain_parallelism_ignores_unassignable_parallelism() -> None:
    inference.constrain_parallelism(UnassignableEstimator())


def test_load_model_rejects_missing_file(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="Model file not found"):
        inference.load_model(tmp_path / "missing.pkl")


def test_load_model_uses_mmap_and_constrains_loaded_model(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    model_path = tmp_path / "model.pkl"
    model_path.write_bytes(b"placeholder")
    loaded_model = ParallelEstimator()
    loader = MagicMock(return_value=loaded_model)
    monkeypatch.setattr(inference.joblib, "load", loader)

    result = inference.load_model(model_path)

    assert result is loaded_model
    loader.assert_called_once_with(model_path, mmap_mode="r")
    assert loaded_model.n_jobs == 1


def test_load_model_falls_back_when_mmap_load_fails(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    model_path = tmp_path / "model.pkl"
    model_path.write_bytes(b"placeholder")
    loaded_model = object()
    loader = MagicMock(side_effect=[OSError("mmap unavailable"), loaded_model])
    monkeypatch.setattr(inference.joblib, "load", loader)

    result = inference.load_model(model_path)

    assert result is loaded_model
    assert loader.call_args_list == [call(model_path, mmap_mode="r"), call(model_path)]


def test_predict_price_returns_float_from_model_prediction() -> None:
    model = MagicMock()
    model.predict.return_value = [123.5]
    features = pd.DataFrame({"value": [1]})

    result = inference.predict_price(model, features)

    assert result == 123.5
    model.predict.assert_called_once_with(features)


def test_load_locations_converts_items_to_strings(tmp_path: Path) -> None:
    locations_path = tmp_path / "locations.json"
    locations_path.write_text(json.dumps(["mumbai", 42]), encoding="utf-8")

    assert preprocessing.load_locations(locations_path) == ["mumbai", "42"]


def test_load_locations_rejects_non_list_json(tmp_path: Path) -> None:
    locations_path = tmp_path / "locations.json"
    locations_path.write_text(json.dumps({"locations": ["mumbai"]}), encoding="utf-8")

    with pytest.raises(ValueError, match="JSON array"):
        preprocessing.load_locations(locations_path)


def test_group_location_matches_case_insensitively_and_preserves_known_label() -> None:
    known_locations = ["Mumbai", "Pune"]

    assert preprocessing.group_location("  mUmBaI ", known_locations) == "Mumbai"
    assert preprocessing.group_location("unknown", known_locations) == "other"


def test_request_to_dataframe_preserves_model_schema() -> None:
    payload = PredictionRequest(
        location="mumbai",
        carpet_area_sqft=1200,
        floor_num=3,
        bathroom=2,
        balcony=1,
        furnishing="Semi-Furnished",
        transaction="Resale",
        ownership="Freehold",
        facing="East",
    )

    result = preprocessing.request_to_dataframe(payload, ["mumbai"])

    assert list(result.columns) == preprocessing.MODEL_FEATURE_COLUMNS
    assert result.shape == (1, len(preprocessing.MODEL_FEATURE_COLUMNS))
    assert result.loc[0, "location_grouped"] == "mumbai"
    assert result.loc[0, "carpet_area_sqft"] == 1200
