import { expect, test } from '@playwright/test'
import {
  currentCardTitle,
  fillTextField,
  goToCardWithText,
  goToNextCard,
  goToPreviousCard,
  gotoForm,
} from '../helpers/form-helpers'

test.describe('Core survey flow', () => {
  test.describe('General Information', () => {
    test('loads the first card and allows basic next/previous navigation', async ({ page }) => {
      await gotoForm(page)

      await expect(page.getByRole('heading', { name: /Guardian\/Conservator's Report/i })).toBeVisible()
      await expect(currentCardTitle(page)).toContainText(/Section A - General Information/i)

      await fillTextField(page, /county/i, 'King')
      await goToNextCard(page)
      await expect(currentCardTitle(page)).toContainText(/Section A - General Information/i)

      await goToPreviousCard(page)
      await expect(page.getByLabel(/county/i)).toHaveValue('King')
    })
  })

  test.describe('Reset behavior', () => {
    test('clear form resets answers and returns to the first card', async ({ page }) => {
      await gotoForm(page)

      await fillTextField(page, /county/i, 'Pierce')
      await goToNextCard(page)

      await page.getByRole('button', { name: 'Clear Form' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('dialog').getByRole('button', { name: 'Clear Form' }).click()

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(currentCardTitle(page)).toContainText(/Section A - General Information/i)
      await expect(page.getByLabel(/county/i)).toHaveValue('')
    })
  })

  test.describe('Conditional clearing', () => {
    test('changing a parent yes/no answer clears hidden child values', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

      await page.locator('.form-group.radio-group').filter({
        hasText: /Does the protected person have any Unblocked Liquid Assets/i,
      }).getByLabel('Yes', { exact: true }).check()

      await goToNextCard(page)
      await fillTextField(page, /last 4 digits for the interest checking account/i, '1234')

      await goToPreviousCard(page)
      await page.locator('.form-group.radio-group').filter({
        hasText: /Does the protected person have any Unblocked Liquid Assets/i,
      }).getByLabel('No', { exact: true }).check()

      await goToNextCard(page)
      await expect(page.getByText(/Financial Institutions Containing Unblocked Liquid Assets/i)).toHaveCount(0)

      await goToPreviousCard(page)
      await page.locator('.form-group.radio-group').filter({
        hasText: /Does the protected person have any Unblocked Liquid Assets/i,
      }).getByLabel('Yes', { exact: true }).check()

      await goToNextCard(page)
      await expect(page.getByLabel(/last 4 digits for the interest checking account/i)).toHaveValue('')
    })
  })

  test.describe('Review flow', () => {
    test('review screen summarizes answers and lets users jump back to edit a section', async ({ page }) => {
      await gotoForm(page)

      await fillTextField(page, /county/i, 'King')
      await fillTextField(page, /docket number/i, '24-4-00001-1')
      await goToCardWithText(page, /full name/i)
      await fillTextField(page, /full name/i, 'Alex Example')

      while (await page.getByRole('button', { name: 'Submit' }).count() === 0) {
        await goToNextCard(page)
      }

      const generalInformationReviewCard = page
        .locator('.review-section-card')
        .filter({ hasText: /Section A - General Information/i })

      await expect(page.getByRole('heading', { name: 'Review Your Answers' })).toBeVisible()
      await expect(generalInformationReviewCard).toContainText('King')
      await expect(generalInformationReviewCard).toContainText('24-4-00001-1')
      await expect(generalInformationReviewCard).toContainText('Alex Example')

      await generalInformationReviewCard.getByRole('button', { name: 'Edit' }).click()

      await expect(currentCardTitle(page)).toContainText(/Section A - General Information/i)
      await expect(page.getByLabel(/county/i)).toHaveValue('King')
      await expect(page.getByLabel(/docket number/i)).toHaveValue('24-4-00001-1')

      await fillTextField(page, /county/i, 'Pierce')
      await page.getByRole('button', { name: 'Back to Review' }).click()

      await expect(page.getByRole('heading', { name: 'Review Your Answers' })).toBeVisible()
      await expect(generalInformationReviewCard).toContainText('Pierce')
    })
  })
})
