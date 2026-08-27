from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=(),
    )

    app_name: str = "House Price Prediction API"
    model_path: Path = BACKEND_ROOT / "models" / "house_price.pkl"
    locations_path: Path = BACKEND_ROOT / "models" / "locations.json"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def resolve_path(self, path: Path) -> Path:
        return path if path.is_absolute() else (BACKEND_ROOT / path)



settings = Settings()
