import json
from pathlib import Path

import pandas as pd

from app.schemas.prediction import PredictionRequest

MODEL_FEATURE_COLUMNS = [
    "carpet_area_sqft",
    "floor_num",
    "bathroom",
    "balcony",
    "location_grouped",
    "Furnishing",
    "Transaction",
    "Ownership",
    "facing",
]


def load_locations(path: Path) -> list[str]:
    locations = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(locations, list):
        raise ValueError("locations.json must contain a JSON array of strings")
    return [str(item) for item in locations]


def group_location(location: str, known_locations: list[str]) -> str:
    normalized = location.strip()
    known = {item.casefold(): item for item in known_locations}
    matched = known.get(normalized.casefold())
    if matched is not None:
        return matched
    return "other"


def request_to_dataframe(
    payload: PredictionRequest,
    known_locations: list[str],
) -> pd.DataFrame:
    row = {
        "carpet_area_sqft": payload.carpet_area_sqft,
        "floor_num": payload.floor_num,
        "bathroom": payload.bathroom,
        "balcony": payload.balcony,
        "location_grouped": group_location(payload.location, known_locations),
        "Furnishing": payload.furnishing,
        "Transaction": payload.transaction,
        "Ownership": payload.ownership,
        "facing": payload.facing,
    }
    return pd.DataFrame([row], columns=MODEL_FEATURE_COLUMNS)
