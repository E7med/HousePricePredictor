import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHealth, getLocations, predictPrice } from '../api/predictionClient'
import type { PredictionRequest } from '../types/prediction'

const payload: PredictionRequest = {
  location: 'mumbai',
  carpet_area_sqft: 1200,
  floor_num: 3,
  bathroom: 2,
  balcony: 1,
  furnishing: 'Semi-Furnished',
  transaction: 'Resale',
  ownership: 'Freehold',
  facing: 'East',
}

describe('prediction API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('loads health and locations from the configured API base URL', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ locations: ['mumbai', 'pune'] }), { status: 200 }))

    await expect(getHealth()).resolves.toEqual({ status: 'ok' })
    await expect(getLocations()).resolves.toEqual(['mumbai', 'pune'])

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8000/health',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/locations',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    )
  })

  it('sends the prediction payload and parses the response', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ predicted_price: 11_713_155.78 }), { status: 200 }),
    )

    await expect(predictPrice(payload)).resolves.toEqual({ predicted_price: 11_713_155.78 })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/predict',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )
  })

  it('uses server detail for a failed JSON request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Model is unavailable.' }), { status: 503 }),
    )

    await expect(getHealth()).rejects.toThrow('Model is unavailable.')
  })

  it('uses a friendly validation message for structured server errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: [{ type: 'missing' }] }), { status: 422 }),
    )

    await expect(getLocations()).rejects.toThrow(
      'The server rejected one or more fields. Check your inputs and try again.',
    )
  })

  it('falls back to the status when an error response is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('temporarily unavailable', { status: 500 }))

    await expect(getHealth()).rejects.toThrow('Request failed with status 500')
  })
})
