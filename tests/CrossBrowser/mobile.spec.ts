import { expect, test } from '@playwright/test'
import {
  answerRadioQuestion,
  currentCard,
  currentSubheading,
  expectCurrentCardNotToContainText,
  goToCardWithText,
  goToNextCard,
  gotoForm,
  fieldInCurrentCard,
  expectCurrentCardTitle,
} from '../helpers/form-helpers'

test.describe('GuardianForm mobile responsive coverage', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('renders the first card and mobile action bar cleanly', async ({ page }) => {
    await gotoForm(page)

    await expectCurrentCardTitle(page, /Court and Case/i)
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear Form' })).toBeVisible()
    await expect(currentCard(page)).toBeVisible()
  })

  test('supports navigating through cards on a narrow viewport', async ({ page }) => {
    await gotoForm(page)

    await page.getByLabel(/county/i).fill('King')
    await goToNextCard(page)
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible()
    await expectCurrentCardTitle(page, /Court and Case/i)
  })

  test('keeps the unblocked liquid-asset institution card hidden after choosing no', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

    await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'No')
    await goToNextCard(page)

    await expectCurrentCardNotToContainText(page, /Financial Institutions Containing Unblocked Liquid Assets/i)
    await expect(currentSubheading(page, 'Blocked Liquid Asset Institutions')).toBeVisible()
  })

  test('shows the first unblocked liquid-asset institution card after choosing yes', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

    await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'Yes')
    await goToNextCard(page)

    await expect(currentSubheading(page, 'Financial Institutions Containing Unblocked Liquid Assets (e.g. Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)')).toBeVisible()
    await expect(fieldInCurrentCard(page, /interest checking account/i)).toBeVisible()
  })
})
