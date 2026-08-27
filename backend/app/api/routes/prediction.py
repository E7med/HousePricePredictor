from fastapi import APIRouter, Request

from app.schemas.prediction import (
    HealthResponse,
    LocationsResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.inference import predict_price
from app.services.preprocessing import request_to_dataframe

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/locations", response_model=LocationsResponse)
def list_locations(request: Request) -> LocationsResponse:
    return LocationsResponse(locations=request.app.state.allowed_locations)


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    features = request_to_dataframe(payload, request.app.state.allowed_locations)
    predicted_price = predict_price(request.app.state.model, features)
    return PredictionResponse(predicted_price=predicted_price)
