import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHealth, getLocations, predictPrice } from '../api/predictionClient'
import type { PredictionRequest } from '../types/prediction'
import { formatLocationLabel } from '../utils/formatPrice'

const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Furnished']
const TRANSACTION_OPTIONS = ['Resale', 'New Property']
const OWNERSHIP_OPTIONS = [
  'Freehold',
  'Co-operative Society',
  'Leasehold',
  'Power Of Attorney',
]
const FACING_OPTIONS = [
  'East',
  'West',
  'North',
  'South',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
]

type FormFields = {
  location: string
  carpet_area_sqft: string
  floor_num: string
  bathroom: string
  balcony: string
  furnishing: string
  transaction: string
  ownership: string
  facing: string
}

type FieldErrors = Partial<Record<keyof FormFields, string>>

const emptyForm: FormFields = {
  location: '',
  carpet_area_sqft: '',
  floor_num: '',
  bathroom: '',
  balcony: '',
  furnishing: '',
  transaction: '',
  ownership: '',
  facing: '',
}

function parseRequiredNumber(value: string, label: string): { value?: number; error?: string } {
  if (value.trim() === '') {
    return { error: `${label} is required.` }
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a number.` }
  }
  return { value: parsed }
}

export function PredictionForm() {
  const navigate = useNavigate()
  const [fields, setFields] = useState<FormFields>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [locations, setLocations] = useState<string[]>([])
  const [locationsError, setLocationsError] = useState('')
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'down'>('checking')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoadingLocations(true)
      setLocationsError('')
      try {
        const [locationList, health] = await Promise.all([
          getLocations(),
          getHealth().catch(() => null),
        ])
        if (cancelled) {
          return
        }
        setLocations(locationList)
        setHealthStatus(health?.status === 'ok' ? 'ok' : 'down')
      } catch (error) {
        if (cancelled) {
          return
        }
        setHealthStatus('down')
        setLocationsError(
          error instanceof Error
            ? error.message
            : 'Could not load locations from the API.',
        )
      } finally {
        if (!cancelled) {
          setIsLoadingLocations(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const locationOptions = useMemo(
    () =>
      [...locations].sort((a, b) =>
        formatLocationLabel(a).localeCompare(formatLocationLabel(b)),
      ),
    [locations],
  )

  function updateField<K extends keyof FormFields>(name: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setSubmitError('')
  }

  function validate(): PredictionRequest | null {
    const nextErrors: FieldErrors = {}

    if (!fields.location) {
      nextErrors.location = 'Please choose a location.'
    }
    if (!fields.furnishing) {
      nextErrors.furnishing = 'Please choose a furnishing status.'
    }
    if (!fields.transaction) {
      nextErrors.transaction = 'Please choose a transaction type.'
    }
    if (!fields.ownership) {
      nextErrors.ownership = 'Please choose an ownership type.'
    }
    if (!fields.facing) {
      nextErrors.facing = 'Please choose a facing direction.'
    }

    const area = parseRequiredNumber(fields.carpet_area_sqft, 'Carpet area')
    if (area.error) {
      nextErrors.carpet_area_sqft = area.error
    } else if (area.value !== undefined && area.value <= 0) {
      nextErrors.carpet_area_sqft = 'Carpet area must be greater than 0.'
    }

    const floor = parseRequiredNumber(fields.floor_num, 'Floor number')
    if (floor.error) {
      nextErrors.floor_num = floor.error
    }

    const bathroom = parseRequiredNumber(fields.bathroom, 'Bathrooms')
    if (bathroom.error) {
      nextErrors.bathroom = bathroom.error
    } else if (bathroom.value !== undefined && bathroom.value < 0) {
      nextErrors.bathroom = 'Bathrooms cannot be negative.'
    }

    const balcony = parseRequiredNumber(fields.balcony, 'Balconies')
    if (balcony.error) {
      nextErrors.balcony = balcony.error
    } else if (balcony.value !== undefined && balcony.value < 0) {
      nextErrors.balcony = 'Balconies cannot be negative.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return null
    }

    return {
      location: fields.location,
      carpet_area_sqft: area.value as number,
      floor_num: floor.value as number,
      bathroom: bathroom.value as number,
      balcony: balcony.value as number,
      furnishing: fields.furnishing,
      transaction: fields.transaction,
      ownership: fields.ownership,
      facing: fields.facing,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = validate()
    if (!payload) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    try {
      const result = await predictPrice(payload)
      navigate('/result', {
        state: { request: payload, predictedPrice: result.predicted_price },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Prediction failed. Please try again in a moment.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="prediction-form" onSubmit={handleSubmit} noValidate>
      <div className="status-row">
        <span className={`health-badge health-${healthStatus}`}>
          {healthStatus === 'checking' && 'Checking API…'}
          {healthStatus === 'ok' && 'API connected'}
          {healthStatus === 'down' && 'API unavailable'}
        </span>
      </div>

      {locationsError ? (
        <p className="banner error" role="alert">
          {locationsError} Start the backend on port 8000 and refresh this page.
        </p>
      ) : null}

      <div className="field-grid">
        <label className="field field-wide">
          <span>Location</span>
          <select
            value={fields.location}
            onChange={(event) => updateField('location', event.target.value)}
            disabled={isLoadingLocations || Boolean(locationsError)}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? 'error-location' : undefined}
          >
            <option value="">
              {isLoadingLocations ? 'Loading locations…' : 'Select a location'}
            </option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {formatLocationLabel(location)}
              </option>
            ))}
          </select>
          {errors.location ? (
            <small className="field-error" id="error-location">
              {errors.location}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Carpet area (sqft)</span>
          <input
            type="number"
            min={0.01}
            step="any"
            inputMode="decimal"
            placeholder="1200"
            value={fields.carpet_area_sqft}
            onChange={(event) => updateField('carpet_area_sqft', event.target.value)}
            aria-invalid={Boolean(errors.carpet_area_sqft)}
          />
          {errors.carpet_area_sqft ? (
            <small className="field-error">{errors.carpet_area_sqft}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Floor number</span>
          <input
            type="number"
            step="1"
            placeholder="3"
            value={fields.floor_num}
            onChange={(event) => updateField('floor_num', event.target.value)}
            aria-invalid={Boolean(errors.floor_num)}
          />
          {errors.floor_num ? <small className="field-error">{errors.floor_num}</small> : null}
        </label>

        <label className="field">
          <span>Bathrooms</span>
          <input
            type="number"
            min={0}
            step="1"
            placeholder="2"
            value={fields.bathroom}
            onChange={(event) => updateField('bathroom', event.target.value)}
            aria-invalid={Boolean(errors.bathroom)}
          />
          {errors.bathroom ? <small className="field-error">{errors.bathroom}</small> : null}
        </label>

        <label className="field">
          <span>Balconies</span>
          <input
            type="number"
            min={0}
            step="1"
            placeholder="1"
            value={fields.balcony}
            onChange={(event) => updateField('balcony', event.target.value)}
            aria-invalid={Boolean(errors.balcony)}
          />
          {errors.balcony ? <small className="field-error">{errors.balcony}</small> : null}
        </label>

        <label className="field">
          <span>Furnishing</span>
          <select
            value={fields.furnishing}
            onChange={(event) => updateField('furnishing', event.target.value)}
            aria-invalid={Boolean(errors.furnishing)}
          >
            <option value="">Select furnishing</option>
            {FURNISHING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.furnishing ? <small className="field-error">{errors.furnishing}</small> : null}
        </label>

        <label className="field">
          <span>Transaction</span>
          <select
            value={fields.transaction}
            onChange={(event) => updateField('transaction', event.target.value)}
            aria-invalid={Boolean(errors.transaction)}
          >
            <option value="">Select transaction</option>
            {TRANSACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.transaction ? (
            <small className="field-error">{errors.transaction}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Ownership</span>
          <select
            value={fields.ownership}
            onChange={(event) => updateField('ownership', event.target.value)}
            aria-invalid={Boolean(errors.ownership)}
          >
            <option value="">Select ownership</option>
            {OWNERSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.ownership ? <small className="field-error">{errors.ownership}</small> : null}
        </label>

        <label className="field">
          <span>Facing</span>
          <select
            value={fields.facing}
            onChange={(event) => updateField('facing', event.target.value)}
            aria-invalid={Boolean(errors.facing)}
          >
            <option value="">Select facing</option>
            {FACING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.facing ? <small className="field-error">{errors.facing}</small> : null}
        </label>
      </div>

      {submitError ? (
        <p className="banner error" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        className={isSubmitting ? 'submit-button is-loading' : 'submit-button'}
        disabled={isSubmitting || Boolean(locationsError)}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Predicting…' : 'Predict price'}
      </button>
    </form>
  )
}
