import { expect, test } from '@playwright/test'
import { goToCardWithFieldLabel, gotoForm } from '../helpers/form-helpers'

test('ZIP and phone inputs discard alphabetic characters as entered', async ({ page }) => {
  await gotoForm(page)

  await goToCardWithFieldLabel(page, /protected person’s ZIP code/i)
  const zipCode = page.getByLabel(/protected person’s ZIP code/i)
  await zipCode.fill('98ab7654321')
  await expect(zipCode).toHaveValue('98765-4321')

  await goToCardWithFieldLabel(page, /protected person’s phone number/i)
  const phoneNumber = page.getByLabel(/protected person’s phone number/i)
  await phoneNumber.fill('206CALL1234')
  await expect(phoneNumber).toHaveValue('2061234')
})
