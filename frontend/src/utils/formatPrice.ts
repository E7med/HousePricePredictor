const LAC = 100_000
const CRORE = 10_000_000

export function formatInrPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    return '₹—'
  }

  if (amount >= CRORE) {
    const crore = amount / CRORE
    const digits = crore >= 10 ? 1 : 2
    return `₹${crore.toFixed(digits)} Cr`
  }

  const lac = amount / LAC
  const digits = lac >= 10 ? 1 : 2
  return `₹${lac.toFixed(digits)} Lac`
}

export function formatInrExact(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatLocationLabel(value: string): string {
  if (value === 'other') {
    return 'Other'
  }
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
