from pathlib import Path

from app.core.thread_limits import apply_thread_limits

apply_thread_limits()

import joblib
import pandas as pd


def constrain_parallelism(estimator) -> None:
    if estimator is None:
        return
    if hasattr(estimator, "n_jobs"):
        try:
            estimator.set_params(n_jobs=1)
        except (ValueError, TypeError):
            try:
                estimator.n_jobs = 1
            except Exception:
                pass
    for attr in ("regressor_", "regressor", "estimator_", "estimator"):
        inner = getattr(estimator, attr, None)
        if inner is not None and inner is not estimator:
            constrain_parallelism(inner)
    named_steps = getattr(estimator, "named_steps", None)
    if named_steps:
        for step in named_steps.values():
            constrain_parallelism(step)


def load_model(path: Path):
    model_path = Path(path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    try:
        model = joblib.load(model_path, mmap_mode="r")
    except Exception:
        model = joblib.load(model_path)
    constrain_parallelism(model)
    return model


def predict_price(model, features: pd.DataFrame) -> float:
    prediction = model.predict(features)
    return float(prediction[0])
