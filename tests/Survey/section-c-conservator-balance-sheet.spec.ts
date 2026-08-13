import { expect, test } from '@playwright/test'
import {
  answerRadioQuestion,
  currentSubheading,
  expectCurrentCardToContainText,
  expectCurrentCardNotToContainText,
  expectCurrentCardTitle,
  fieldInCurrentCard,
  fillTextField,
  goToCardWithText,
  goToNextCard,
  goToNextCardUntil,
  goToPreviousCard,
  goToPreviousCardUntil,
  gotoForm,
} from '../helpers/form-helpers'

test.describe('Section C - Conservator Balance Sheet', () => {
  test.describe('Unblocked Liquid Assets', () => {
    test('skips the first financial institution card when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

      await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /Financial Institutions Containing Unblocked Liquid Assets/i)
      await expect(currentSubheading(page, 'Blocked Liquid Asset Institutions')).toBeVisible()
    })

    test('shows the first financial institution card when the user answers yes', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

      await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'Yes')
      await goToNextCard(page)

      await expect(currentSubheading(page, 'Financial Institutions Containing Unblocked Liquid Assets (e.g. Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)')).toBeVisible()
      await expect(fieldInCurrentCard(page, /interest checking account/i)).toBeVisible()
    })

    test('skips the second unblocked institution card when the user answers no', async ({ page }) => {
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

    test('clears the first unblocked institution values after toggling yes back to no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Does the protected person have any Unblocked Liquid Assets/i)

      await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'Yes')
      await goToNextCard(page)
      await fillTextField(page, /last 4 digits for the interest checking account/i, '9876')

      await goToPreviousCard(page)
      await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'No')
      await goToNextCard(page)
      await expectCurrentCardNotToContainText(page, /Financial Institutions Containing Unblocked Liquid Assets/i)

      await goToPreviousCard(page)
      await answerRadioQuestion(page, /Does the protected person have any Unblocked Liquid Assets/i, 'Yes')
      await goToNextCard(page)
      await expect(fieldInCurrentCard(page, /last 4 digits for the interest checking account/i)).toHaveValue('')
    })
  })

  test.describe('Blocked Liquid Asset Institutions', () => {
    test('skips blocked institution detail cards when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Do you have a blocked liquid-asset institution to add/i)

      await answerRadioQuestion(page, /Do you have a blocked liquid-asset institution to add/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /Blocked Liquid Asset Institution 1/i)
      await expectCurrentCardTitle(page, /Personal and Other Property Subject to Control/i)
    })

    test('shows blocked institution 1 followed by the explicit same-institution follow-up', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Do you have a blocked liquid-asset institution to add/i)

      await answerRadioQuestion(page, /Do you have a blocked liquid-asset institution to add/i, 'Yes')
      await goToNextCard(page)
      await expect(currentSubheading(page, 'Blocked Liquid Asset Institution 1')).toBeVisible()

      await goToNextCard(page)
      await expectCurrentCardToContainText(page, /Do you have another blocked account at this same institution\?/i)

      await answerRadioQuestion(page, /Do you have another blocked account at this same institution\?/i, 'Yes')
      await goToNextCard(page)
      await expect(currentSubheading(page, 'Second Blocked Account at This Institution')).toBeVisible()
    })

    test('skips blocked institution 2 when the second blocked institution answer is no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Do you have a blocked liquid-asset institution to add/i)

      await answerRadioQuestion(page, /Do you have a blocked liquid-asset institution to add/i, 'Yes')
      await goToNextCard(page)
      await goToNextCard(page)
      await expectCurrentCardToContainText(page, /Do you have another blocked account at this same institution\?/i)

      await answerRadioQuestion(page, /Do you have another blocked account at this same institution\?/i, 'No')
      await goToNextCardUntil(page, /Personal and Other Property Subject to Control/i)

      await expectCurrentCardNotToContainText(page, /Second Blocked Account at This Institution/i)
      await expectCurrentCardTitle(page, /Personal and Other Property Subject to Control/i)
    })
  })

  test.describe('Mortgages, Liens, and Other Liabilities', () => {
    test('shows liability fields only when the user answers yes', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /mortgages, liens, notes payable, or other liabilities/i)

      await answerRadioQuestion(page, /mortgages, liens, notes payable, or other liabilities/i, 'Yes')
      await goToNextCard(page)

      await expect(currentSubheading(page, 'Mortgages, Liens, Notes Payable, and Other Liabilities')).toBeVisible()
      await expect(fieldInCurrentCard(page, /Liability 1 description/i)).toBeVisible()
    })

    test('clears liability values when the user changes the trigger back to no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /mortgages, liens, notes payable, or other liabilities/i)

      await answerRadioQuestion(page, /mortgages, liens, notes payable, or other liabilities/i, 'Yes')
      await goToNextCard(page)
      await fillTextField(page, /Liability 1 description/i, 'Mortgage Balance')

      await goToPreviousCard(page)
      await answerRadioQuestion(page, /mortgages, liens, notes payable, or other liabilities/i, 'No')
      await goToNextCard(page)
      await expectCurrentCardNotToContainText(page, /Mortgages, Liens, Notes Payable, and Other Liabilities/i)
      await expect(fieldInCurrentCard(page, /Liability 1 description/i)).toHaveCount(0)
    })
  })

  test.describe('Personal and Other Property', () => {
    test('skips all property item cards when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Do you have any personal or other property subject to your control to list/i)

      await answerRadioQuestion(page, /Do you have any personal or other property subject to your control to list/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /personal or other property item 1/i)
      await expectCurrentCardTitle(page, /Mortgages, Liens, Notes Payable, and Other Liabilities/i)
    })

    test('shows item 1, asks about another item, and skips re-asking once item 2 has already been answered', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /Do you have any personal or other property subject to your control to list/i)

      await answerRadioQuestion(page, /Do you have any personal or other property subject to your control to list/i, 'Yes')
      await goToNextCard(page)
      await expectCurrentCardToContainText(page, /Describe personal or other property item 1/i)
      await expectCurrentCardNotToContainText(page, /Remove this personal or other property item 2/i)

      await goToNextCard(page)
      await expectCurrentCardToContainText(page, /Do you have another personal or other property item to add\?/i)

      await answerRadioQuestion(page, /Do you have another personal or other property item to add\?/i, 'Yes')
      await goToNextCard(page)
      await expect(currentSubheading(page, 'Second Personal or Other Property Item')).toBeVisible()
      await expectCurrentCardNotToContainText(page, /Remove this personal or other property item 2/i)

      await fillTextField(page, /Describe personal or other property item 2/i, 'Brokerage Account')

      await goToNextCard(page)
      await expectCurrentCardNotToContainText(page, /Do you have another personal or other property item to add\?/i)

      await goToPreviousCardUntil(page, /Second Personal or Other Property Item/i)
      await expect(currentSubheading(page, 'Second Personal or Other Property Item')).toBeVisible()
      await expect(fieldInCurrentCard(page, /Describe personal or other property item 2/i)).toHaveValue('Brokerage Account')
    })
  })
})
