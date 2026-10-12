import { expect, test } from '@playwright/test'
import {
  answerRadioQuestion,
  currentCard,
  currentSubheading,
  expectCurrentCardNotToContainText,
  expectCurrentCardTitle,
  fieldInCurrentCard,
  fillTextField,
  goToCardWithText,
  goToNextCard,
  goToPreviousCard,
  gotoForm,
} from '../helpers/form-helpers'

test.describe('GuardianForm tablet responsive coverage', () => {
  test.use({ viewport: { width: 820, height: 1180 } })

  test('renders the first card with tablet-friendly navigation controls', async ({ page }) => {
    await gotoForm(page)

    await expect(currentCard(page)).toBeVisible()
    await expectCurrentCardTitle(page, /Court and Case/i)
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear Form' })).toBeVisible()
  })

  test('preserves field values when moving backward and forward on tablet', async ({ page }) => {
    await gotoForm(page)

    await fillTextField(page, /county/i, 'Pierce')
    await goToNextCard(page)
    await goToPreviousCard(page)

    await expect(page.getByLabel(/county/i)).toHaveValue('Pierce')
  })

  test('skips the second unblocked institution card when the tablet user answers no', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

    await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'Yes')
    await goToNextCard(page)
    await goToNextCard(page)

    await answerRadioQuestion(page, /second unblocked liquid-asset institution/i, 'No')
    await goToNextCard(page)

    await expectCurrentCardNotToContainText(page, /Second Financial Institution Containing Unblocked Liquid Assets/i)
    await expect(currentSubheading(page, 'Blocked Liquid Asset Institutions')).toBeVisible()
  })

  test('shows liability detail fields only when the tablet user answers yes', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /mortgages, liens, notes payable, or other liabilities/i)

    await answerRadioQuestion(page, /mortgages, liens, notes payable, or other liabilities/i, 'Yes')
    await goToNextCard(page)

    await expect(currentSubheading(page, 'Mortgages, Liens, Notes Payable, and Other Liabilities')).toBeVisible()
    await expect(fieldInCurrentCard(page, /Liability 1 description/i)).toBeVisible()
  })
})
