import { Link, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import type { ResultState } from '../types/prediction'
import { formatInrExact, formatInrPrice, formatLocationLabel } from '../utils/formatPrice'

export function ResultPage() {
  const location = useLocation()
  const state = location.state as ResultState | null

  if (!state || typeof state.predictedPrice !== 'number' || !state.request) {
    return (
      <main className="page result-page">
        <AppHeader />
        <section className="result-wrap">
          <div className="panel empty-card">
            <p className="eyebrow">Your result is waiting</p>
            <h1>Nothing estimated yet.</h1>
            <p className="lede">Submit a property profile first to see an estimated listing price.</p>
            <Link className="primary-button" to="/#prediction-form">
              Estimate my home <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const { request, predictedPrice } = state

  return (
    <main className="page result-page">
      <AppHeader />
      <section className="result-wrap">
        <div className="panel result-card">
          <p className="eyebrow">Your property estimate</p>
          <p className="result-kicker">
            Based on the profile for {formatLocationLabel(request.location)}
          </p>
          <h1 className="result-title">{formatInrPrice(predictedPrice)}</h1>
          <p className="exact-price">{formatInrExact(predictedPrice)}</p>

          <dl className="summary-grid">
            <div>
              <dt>Location</dt>
              <dd>{formatLocationLabel(request.location)}</dd>
            </div>
            <div>
              <dt>Carpet area</dt>
              <dd>{request.carpet_area_sqft} sqft</dd>
            </div>
            <div>
              <dt>Floor</dt>
              <dd>{request.floor_num}</dd>
            </div>
            <div>
              <dt>Bathrooms</dt>
              <dd>{request.bathroom}</dd>
            </div>
            <div>
              <dt>Balconies</dt>
              <dd>{request.balcony}</dd>
            </div>
            <div>
              <dt>Furnishing</dt>
              <dd>{request.furnishing}</dd>
            </div>
            <div>
              <dt>Transaction</dt>
              <dd>{request.transaction}</dd>
            </div>
            <div>
              <dt>Ownership</dt>
              <dd>{request.ownership}</dd>
            </div>
            <div>
              <dt>Facing</dt>
              <dd>{request.facing}</dd>
            </div>
          </dl>

          <Link className="submit-button secondary" to="/#prediction-form">
            Estimate another home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
