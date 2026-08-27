export interface PredictionRequest {
  location: string
  carpet_area_sqft: number
  floor_num: number
  bathroom: number
  balcony: number
  furnishing: string
  transaction: string
  ownership: string
  facing: string
}

export interface PredictionResponse {
  predicted_price: number
}

export interface HealthResponse {
  status: string
}

export interface LocationsResponse {
  locations: string[]
}

export interface ResultState {
  request: PredictionRequest
  predictedPrice: number
}
