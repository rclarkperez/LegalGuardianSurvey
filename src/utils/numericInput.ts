import type { FieldInputFormat } from '../types/template.types'

export function sanitizeNumericText(
  value: string,
  format: FieldInputFormat,
  maxLength?: number
): string {
  if (format === 'digits') {
    const digits = value.replace(/\D/g, '')
    return maxLength ? digits.slice(0, maxLength) : digits
  }

  if (format === 'postal-code') {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    return digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits
  }

  const phoneCharacters = value.replace(/[^\d\s().-]/g, '')
  return value.trimStart().startsWith('+')
    ? `+${phoneCharacters.trimStart()}`
    : phoneCharacters
}
