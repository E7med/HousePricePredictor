import { NavLink } from 'react-router-dom'
import { CasaLensMark } from './CasaLensMark'

type AppHeaderProps = {
  overlay?: boolean
}

export function AppHeader({ overlay = false }: AppHeaderProps) {
  return (
    <header className={overlay ? 'site-header site-header-overlay' : 'site-header site-header-solid'}>
      <NavLink to="/" className="brand" aria-label="CasaLens home">
        <CasaLensMark />
        <span className="brand-wordmark">CasaLens</span>
      </NavLink>
      <nav className="site-nav" aria-label="Primary">
        <a className="nav-cta" href="/#prediction-form">
          Estimate my home
        </a>
      </nav>
    </header>
  )
}
