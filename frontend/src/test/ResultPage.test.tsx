import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResultPage } from '../pages/ResultPage'

const request = {
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

describe('ResultPage', () => {
  it('shows an intentional empty state when no prediction state exists', () => {
    render(
      <MemoryRouter initialEntries={['/result']}>
        <ResultPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Nothing estimated yet.' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Estimate my home/ })[1]).toHaveAttribute(
      'href',
      '/#prediction-form',
    )
  })

  it('renders the estimate and all submitted property details', () => {
    render(
      <MemoryRouter
        initialEntries={[{
          pathname: '/result',
          state: { request, predictedPrice: 11_713_155.78 },
        }]}
      >
        <ResultPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '₹1.17 Cr' })).toBeInTheDocument()
    expect(screen.getByText('₹1,17,13,156')).toBeInTheDocument()
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('1200 sqft')).toBeInTheDocument()
    expect(screen.getByText('Semi-Furnished')).toBeInTheDocument()
    expect(screen.getByText('Freehold')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Estimate another home/ })).toHaveAttribute(
      'href',
      '/#prediction-form',
    )
  })
})
