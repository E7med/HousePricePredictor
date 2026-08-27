from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    location: str = Field(..., min_length=1, examples=["mumbai"])
    carpet_area_sqft: float = Field(..., gt=0, examples=[1200])
    floor_num: float = Field(..., examples=[3])
    bathroom: float = Field(..., ge=0, examples=[2])
    balcony: float = Field(..., ge=0, examples=[1])
    furnishing: str = Field(..., min_length=1, examples=["Semi-Furnished"])
    transaction: str = Field(..., min_length=1, examples=["Resale"])
    ownership: str = Field(..., min_length=1, examples=["Freehold"])
    facing: str = Field(..., min_length=1, examples=["East"])


class PredictionResponse(BaseModel):
    predicted_price: float


class HealthResponse(BaseModel):
    status: str


class LocationsResponse(BaseModel):
    locations: list[str]
