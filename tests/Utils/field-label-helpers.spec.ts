import { expect, test } from '@playwright/test'
import { getDisplayLabel } from '../../src/utils/fieldLabelHelpers'

test.describe('field label helpers', () => {
  test('replaces protected person references with the entered name', async () => {
    expect(getDisplayLabel('How is the protected person doing overall?', 'Mia Chen')).toBe('How is Mia Chen doing overall?')
    expect(getDisplayLabel('Briefly describe the protected person’s overall well-being', 'Mia Chen'))
      .toBe('Briefly describe Mia Chen’s overall well-being')
    expect(getDisplayLabel('Do you want to list a service or support the protected person receives?', 'Mia Chen'))
      .toBe('Do you want to list a service or support Mia Chen receives?')
  })

  test('keeps the protected person name question unchanged', async () => {
    expect(getDisplayLabel('What is the protected person’s full name?', 'Mia Chen', 'individualName'))
      .toBe('What is the protected person’s full name?')
  })

  test('still supports legacy individual wording', async () => {
    expect(getDisplayLabel('How is the individual doing overall?', 'Mia Chen')).toBe('How is Mia Chen doing overall?')
  })
})
