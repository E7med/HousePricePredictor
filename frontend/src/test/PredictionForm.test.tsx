import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PredictionForm } from '../components/PredictionForm'

const apiMocks = vi.hoisted(() => ({
  getHealth: vi.fn(),
  getLocations: vi.fn(),
  predictPrice: vi.fn(),
}))

vi.mock('../api/predictionClient', () => apiMocks)

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PredictionForm />} />
        <Route path="/result" element={<div>Prediction result route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'mumbai' } })
  fireEvent.change(screen.getByLabelText('Carpet area (sqft)'), { target: { value: '1200' } })
  fireEvent.change(screen.getByLabelText('Floor number'), { target: { value: '3' } })
  fireEvent.change(screen.getByLabelText('Bathrooms'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Balconies'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Furnishing'), { target: { value: 'Semi-Furnished' } })
  fireEvent.change(screen.getByLabelText('Transaction'), { target: { value: 'Resale' } })
  fireEvent.change(screen.getByLabelText('Ownership'), { target: { value: 'Freehold' } })
  fireEvent.change(screen.getByLabelText('Facing'), { target: { value: 'East' } })
}

describe('PredictionForm', () => {
  beforeEach(() => {
    apiMocks.getLocations.mockResolvedValue(['mumbai', 'pune'])
    apiMocks.getHealth.mockResolvedValue({ status: 'ok' })
    apiMocks.predictPrice.mockReset()
  })

  it('renders API status and loaded location options', async () => {
    renderForm()

    expect(await screen.findByText('API connected')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mumbai' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Pune' })).toBeInTheDocument()
  })

  it('shows a degraded API badge when health is unavailable', async () => {
    apiMocks.getHealth.mockRejectedValue(new Error('Health endpoint unavailable.'))
    renderForm()

    expect(await screen.findByText('API unavailable')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mumbai' })).toBeInTheDocument()
  })

  it('shows a location-loading error and disables submission when locations fail', async () => {
    apiMocks.getLocations.mockRejectedValue(new Error('Locations endpoint unavailable.'))
    renderForm()

    expect(await screen.findByText(/Locations endpoint unavailable\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Predict price' })).toBeDisabled()
  })

  it('shows required-field errors without calling the API', async () => {
    renderForm()
    await screen.findByText('API connected')

    fireEvent.click(screen.getByRole('button', { name: 'Predict price' }))

    expect(await screen.findByText('Please choose a location.')).toBeInTheDocument()
    expect(screen.getByText('Carpet area is required.')).toBeInTheDocument()
    expect(screen.getByText('Please choose a facing direction.')).toBeInTheDocument()
    expect(apiMocks.predictPrice).not.toHaveBeenCalled()
  })

  it('rejects non-positive area and negative counts', async () => {
    renderForm()
    await screen.findByText('API connected')
    fireEvent.change(screen.getByLabelText('Carpet area (sqft)'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Bathrooms'), { target: { value: '-1' } })
    fireEvent.change(screen.getByLabelText('Balconies'), { target: { value: '-2' } })

    fireEvent.click(screen.getByRole('button', { name: 'Predict price' }))

    expect(await screen.findByText('Carpet area must be greater than 0.')).toBeInTheDocument()
    expect(screen.getByText('Bathrooms cannot be negative.')).toBeInTheDocument()
    expect(screen.getByText('Balconies cannot be negative.')).toBeInTheDocument()
    expect(apiMocks.predictPrice).not.toHaveBeenCalled()
  })

  it('submits a typed payload, shows loading, and navigates on success', async () => {
    let resolvePrediction: (value: { predicted_price: number }) => void = () => undefined
    apiMocks.predictPrice.mockImplementation(
      () => new Promise((resolve) => { resolvePrediction = resolve }),
    )
    renderForm()
    await screen.findByText('API connected')
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Predict price' }))
    expect(await screen.findByRole('button', { name: /Predicting/ })).toBeDisabled()

    expect(apiMocks.predictPrice).toHaveBeenCalledWith({
      location: 'mumbai',
      carpet_area_sqft: 1200,
      floor_num: 3,
      bathroom: 2,
      balcony: 1,
      furnishing: 'Semi-Furnished',
      transaction: 'Resale',
      ownership: 'Freehold',
      facing: 'East',
    })

    resolvePrediction({ predicted_price: 11_713_155.78 })
    expect(await screen.findByText('Prediction result route')).toBeInTheDocument()
  })

  it('renders API errors and re-enables submission', async () => {
    apiMocks.predictPrice.mockRejectedValue(new Error('Prediction service unavailable.'))
    renderForm()
    await screen.findByText('API connected')
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Predict price' }))

    expect(await screen.findByText('Prediction service unavailable.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Predict price' })).toBeEnabled())
  })
})
