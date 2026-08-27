import heroImage from '../assets/hero.jpg'
import { AppHeader } from '../components/AppHeader'
import { PredictionForm } from '../components/PredictionForm'

export function HomePage() {
  return (
    <main className="page home-main">
      <a className="skip-link" href="#prediction-form">
        Skip to estimate form
      </a>
      <section className="hero">
        <img
          className="hero-photo"
          src={heroImage}
          alt="A modern villa at dusk with warm interior lighting reflected in a still pool"
        />
        <div className="hero-scrim" />
        <AppHeader overlay />
        <div className="hero-content">
          <p className="eyebrow">House price estimates</p>
          <h1>
            Find the value
            <br />
            behind <em>every address.</em>
          </h1>
          <p className="hero-description">
            Get a listing-price estimate for an Indian home using its location, area, and
            everyday property details.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#prediction-form">
              Estimate my home <span aria-hidden="true">❯</span>
            </a>
          </div>
        </div>
      </section>

      <section className="trust-row" aria-label="Why CasaLens">
        <div className="trust-item">
          <strong>Built on real listings</strong>
          <span>Trained on 187,000+ Indian property records.</span>
        </div>
        <div className="trust-item">
          <strong>Transparent inputs</strong>
          <span>You choose location, area, and living details.</span>
        </div>
        <div className="trust-item">
          <strong>Quick estimate</strong>
          <span>Get a result in seconds.</span>
        </div>
      </section>

      <section className="form-section" id="prediction-form">
        <div className="section-heading">
          <p className="eyebrow">Your property profile</p>
          <h2>Let’s get to know the space.</h2>
          <p>Enter the home details and we’ll return an estimate in seconds.</p>
        </div>
        <div className="panel">
          <PredictionForm />
        </div>
      </section>
    </main>
  )
}
