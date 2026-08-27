import { describe, expect, it } from 'vitest'
import {
  formatInrExact,
  formatInrPrice,
  formatLocationLabel,
} from '../utils/formatPrice'

describe('formatInrPrice', () => {
  it('formats crore values', () => {
    expect(formatInrExact(11_713_155.78)).toBe('₹1,17,13,156')
  })

  it('formats smaller values in lakhs', () => {
    expect(formatInrPrice(1_200_000)).toBe('₹12.0 Lac')
  })

  it('handles zero', () => {
    expect(formatInrPrice(0)).toBe('₹0.00 Lac')
  })

  it('handles invalid and negative values', () => {
    expect(formatInrPrice(-100)).toBe('₹—')
    expect(formatInrPrice(Number.NaN)).toBe('₹—')
    expect(formatInrPrice(Number.POSITIVE_INFINITY)).toBe('₹—')
  })
})

describe('formatInrExact', () => {
  it('formats an exact INR amount without decimals', () => {
    expect(formatInrExact(11_713_155.78)).toBe('₹1,17,13,156')
  })
})

describe('formatLocationLabel', () => {
  it('converts other to a readable label', () => {
    expect(formatLocationLabel('other')).toBe('Other')
  })

  it('converts hyphenated locations to title case', () => {
    expect(formatLocationLabel('south-mumbai')).toBe('South Mumbai')
  })

  it('preserves normal location names', () => {
    expect(formatLocationLabel('Mumbai')).toBe('Mumbai')
  })
})