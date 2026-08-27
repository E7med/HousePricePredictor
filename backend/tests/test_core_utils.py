import logging
from pathlib import Path

from app.core.config import BACKEND_ROOT, Settings
from app.utils.logging_config import setup_logging


def test_settings_normalize_cors_origins_and_resolve_paths() -> None:
    settings = Settings(
        cors_origins=" http://localhost:5173, ,http://127.0.0.1:5173 ",
        model_path=Path("models/custom.pkl"),
    )

    assert settings.cors_origin_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    assert settings.resolve_path(settings.model_path) == BACKEND_ROOT / "models/custom.pkl"
    assert settings.resolve_path(Path("D:/absolute/model.pkl")) == Path("D:/absolute/model.pkl")


def test_setup_logging_configures_root_logger() -> None:
    setup_logging(logging.DEBUG)

    root_logger = logging.getLogger()
    assert root_logger.level == logging.DEBUG
    assert root_logger.handlers
