import type {
  HealthResponse,
  LocationsResponse,
  PredictionRequest,
  PredictionResponse,
} from '../types/prediction'

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set. Add it to frontend/.env.')
  }
  return baseUrl.replace(/\/$/, '')
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') {
        detail = body.detail
      } else if (Array.isArray(body.detail)) {
        detail = 'The server rejected one or more fields. Check your inputs and try again.'
      }
    } catch {
      // Keep the status-based message when the body is not JSON.
    }
    throw new Error(detail)
  }

  return (await response.json()) as T
}

export async function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/health')
}

export async function getLocations(): Promise<string[]> {
  const data = await requestJson<LocationsResponse>('/locations')
  return data.locations
}

export async function predictPrice(
  payload: PredictionRequest,
): Promise<PredictionResponse> {
  return requestJson<PredictionResponse>('/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
