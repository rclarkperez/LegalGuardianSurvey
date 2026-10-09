import { expect, test } from '@playwright/test'
import { guardianShipFormTemplate } from '../../src/templates/guardianShipForm.template'
import { sanitizeNumericText } from '../../src/utils/numericInput'

test.describe('Numeric-only field input', () => {
  test('sanitizes digit, postal-code, and phone input formats', () => {
    expect(sanitizeNumericText('00a12-3', 'digits', 4)).toBe('0012')
    expect(sanitizeNumericText('98ab7654321', 'postal-code')).toBe('98765-4321')
    expect(sanitizeNumericText('206CALL1234', 'phone')).toBe('2061234')
  })

  test('all account last-four fields require exactly four digits', () => {
    const fields = guardianShipFormTemplate.fields.filter(field =>
      field.label.startsWith('What are the last 4 digits')
    )

    expect(fields).toHaveLength(6)
    for (const field of fields) {
      expect(field.inputFormat).toBe('digits')
      expect(field.validation?.maxLength).toBe(4)
      expect(field.validation?.pattern?.test('0123')).toBe(true)
      expect(field.validation?.pattern?.test('12a3')).toBe(false)
    }
  })

  test('ZIP, phone, and fax fields are configured to reject letters', () => {
    const fields = guardianShipFormTemplate.fields
    const postalFields = fields.filter(field => field.inputFormat === 'postal-code')
    const phoneFields = fields.filter(field => /phone number|fax number/i.test(field.label))

    expect(postalFields.length).toBeGreaterThanOrEqual(6)
    for (const field of postalFields) {
      expect(field.inputFormat).toBe('postal-code')
      expect(field.validation?.pattern?.test('98101')).toBe(true)
      expect(field.validation?.pattern?.test('98A01')).toBe(false)
    }

    expect(phoneFields).toHaveLength(4)
    for (const field of phoneFields) {
      expect(field.inputFormat).toBe('phone')
      expect(field.validation?.pattern?.test('(206) 555-0123')).toBe(true)
      expect(field.validation?.pattern?.test('CALL-ME')).toBe(false)
    }
  })
})
