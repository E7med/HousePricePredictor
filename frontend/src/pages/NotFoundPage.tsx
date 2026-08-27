import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'

export function NotFoundPage() {
  return (
    <main className="page result-page">
      <AppHeader />
      <section className="result-wrap">
        <div className="panel empty-card">
          <p className="eyebrow">Page not found</p>
          <h1>That address does not exist.</h1>
          <p className="lede">Return home to estimate another property.</p>
          <Link className="primary-button" to="/">
            Estimate my home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
