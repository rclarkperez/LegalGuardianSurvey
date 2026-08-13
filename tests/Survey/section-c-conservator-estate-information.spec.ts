import { test } from '@playwright/test'
import {
  currentCard,
  expectCurrentCardNotToContainText,
  goToCardWithText,
  gotoForm,
} from '../helpers/form-helpers'

test.describe('Section C - Conservator Estate Information', () => {
  test('skips the ending estate value question when conservatorship is not applicable', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /scope of conservatorship for the estate/i)

    await currentCard(page).getByLabel('Not applicable', { exact: true }).check()

    await goToCardWithText(page, /end date for the estate-information accounting period/i)
    await expectCurrentCardNotToContainText(page, /estimated ending market value of the estate/i)
  })

  test('hides additional estate expense amount fields unless other estate expenses are reported', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /other estate expense to report/i)

    await currentCard(page).getByLabel('No', { exact: true }).check()

    await expectCurrentCardNotToContainText(page, /Additional Expense Amount 1/i)
    await expectCurrentCardNotToContainText(page, /Additional Expense Amount 2/i)
    await expectCurrentCardNotToContainText(page, /Additional Expense Amount 3/i)
  })
})
