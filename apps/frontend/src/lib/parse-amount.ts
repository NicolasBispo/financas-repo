/** Parse amounts typed with either `,` or `.` as decimal separator (and `1.234,56`). */
export function parseFlexibleAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '')
  if (!cleaned) return Number.NaN

  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Brazilian / European: 1.234,56 -> 1234.56
    return Number(cleaned.replace(/\./g, '').replace(',', '.'))
  }

  if (cleaned.includes(',')) {
    return Number(cleaned.replace(',', '.'))
  }

  return Number(cleaned)
}

/** Normalize typed/pasted amount text to a single `.` decimal separator. */
export function normalizeAmountInput(raw: string): string {
  const cleaned = raw.trim().replace(/\s/g, '')
  if (!cleaned) return ''

  // Pasted Brazilian / European format: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return cleaned.replace(/\./g, '').replace(',', '.')
  }

  const withDot = cleaned.replace(/,/g, '.')
  let seenDot = false
  let result = ''

  for (const char of withDot) {
    if (char >= '0' && char <= '9') {
      result += char
      continue
    }
    if (char === '.' && !seenDot) {
      seenDot = true
      result += char
    }
  }

  return result
}
