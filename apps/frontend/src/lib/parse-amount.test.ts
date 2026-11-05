import { describe, expect, it } from 'vitest'
import { normalizeAmountInput, parseFlexibleAmount } from './parse-amount'

describe('parseFlexibleAmount', () => {
  it('parses dot decimals', () => {
    expect(parseFlexibleAmount('12.34')).toBe(12.34)
  })

  it('parses comma decimals', () => {
    expect(parseFlexibleAmount('12,34')).toBe(12.34)
  })

  it('parses brazilian thousands format', () => {
    expect(parseFlexibleAmount('1.234,56')).toBe(1234.56)
  })
})

describe('normalizeAmountInput', () => {
  it('converts comma to dot while typing', () => {
    expect(normalizeAmountInput('12,3')).toBe('12.3')
  })

  it('normalizes pasted brazilian values', () => {
    expect(normalizeAmountInput('1.234,56')).toBe('1234.56')
  })
})
