import { expect, test } from '@playwright/test'
import {
  answerRadioQuestion,
  expectCurrentCardToContainText,
  expectCurrentCardNotToContainText,
  fieldInCurrentCard,
  fillTextField,
  goToCardWithFieldLabel,
  goToCardWithText,
  goToNextCard,
  goToPreviousCardUntil,
  gotoForm,
} from '../helpers/form-helpers'

test.describe('Proposed Budget and Disclosures', () => {
  test.describe('Conservator Explanations', () => {
    test('skips the first large-expenditure detail when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /need to explain a large or unusual expenditure, adjustment, or purchase/i)

      await answerRadioQuestion(
        page,
        /need to explain a large or unusual expenditure, adjustment, or purchase/i,
        'No'
      )
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(
        page,
        /Describe a large or unusual expenditure, adjustment, or purchase/i
      )
      await expectCurrentCardToContainText(page, /list a service or support the protected person receives/i)
    })

    test('skips the first services-received detail when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /list a service or support the protected person receives/i)

      await answerRadioQuestion(page, /list a service or support the protected person receives/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /Describe a service or support the protected person receives/i)
      await expectCurrentCardToContainText(page, /another conservator-plan deviation to describe/i)
    })
  })

  test.describe('Other Budget Items', () => {
    test('skips the second other budget item fields when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /any "other" budget items to report/i)

      await answerRadioQuestion(page, /any "other" budget items to report/i, 'Yes')
      await goToNextCard(page)

      await answerRadioQuestion(page, /another "other" budget item to add/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /What is the second "other" budget item\?/i)
      await expectCurrentCardNotToContainText(page, /Describe the second "other" budget item/i)
    })

    test('shows the second other budget item fields when the user answers yes', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /any "other" budget items to report/i)

      await answerRadioQuestion(page, /any "other" budget items to report/i, 'Yes')
      await goToNextCard(page)

      await answerRadioQuestion(page, /another "other" budget item to add/i, 'Yes')
      await goToNextCard(page)

      await expect(fieldInCurrentCard(page, /What is the second "other" budget item/i)).toBeVisible()
      await expect(fieldInCurrentCard(page, /Describe the second "other" budget item/i)).toBeVisible()
      await expect(fieldInCurrentCard(page, /Current monthly amount for the second "other" budget item/i)).toBeVisible()
      await expect(
        fieldInCurrentCard(page, /monthly amount are you proposing for the second "other" budget item/i)
      ).toBeVisible()
      await expect(fieldInCurrentCard(page, /Comments for the second "other" budget item/i)).toBeVisible()
      await expectCurrentCardToContainText(page, /third "other" budget item to add/i)
    })
  })

  test.describe('Gift Disclosures', () => {
    test('skips gift detail cards when the user answers no', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /gifts received from the protected person/i)

      await answerRadioQuestion(page, /gifts received from the protected person/i, 'No')
      await goToNextCard(page)

      await expectCurrentCardNotToContainText(page, /Describe the first gift received from the protected person/i)
      await expectCurrentCardToContainText(
        page,
        /business relationships or benefits received from the protected person or estate/i
      )
    })

    test('shows the gift detail fields when the user answers yes', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /gifts received from the protected person/i)

      await answerRadioQuestion(page, /gifts received from the protected person/i, 'Yes')
      await goToNextCard(page)

      await expect(fieldInCurrentCard(page, /Describe the first gift received from the protected person/i)).toBeVisible()
      await expectCurrentCardNotToContainText(page, /another gift entry to add/i)

      await goToNextCard(page)
      await expectCurrentCardToContainText(page, /another gift entry to add/i)
    })
  })

  test.describe('Business Benefit Disclosures', () => {
    test('shows business-benefit fields when the user answers yes', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /business relationships or benefits received from the protected person or estate/i)

      await answerRadioQuestion(
        page,
        /business relationships or benefits received from the protected person or estate/i,
        'Yes'
      )
      await goToNextCard(page)

      await expect(fieldInCurrentCard(page, /Describe the first business relationship or benefit/i)).toBeVisible()
      await expectCurrentCardToContainText(page, /another business-benefit entry to add/i)

      await answerRadioQuestion(page, /another business-benefit entry to add/i, 'Yes')
      await goToNextCard(page)

      await expect(fieldInCurrentCard(page, /Describe the second business relationship or benefit/i)).toBeVisible()
    })

    test('clears a second gift entry when the add-another branch turns back off', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /gifts received from the protected person/i)

      await answerRadioQuestion(page, /gifts received from the protected person/i, 'Yes')
      await goToNextCard(page)
      await goToNextCard(page)
      await answerRadioQuestion(page, /another gift entry to add/i, 'Yes')
      await goToNextCard(page)
      await fillTextField(page, /Describe the second gift received from the protected person/i, 'Birthday cash gift')

      await goToPreviousCardUntil(page, /another gift entry to add/i)
      await answerRadioQuestion(page, /another gift entry to add/i, 'No')
      await goToNextCard(page)
      await expectCurrentCardNotToContainText(page, /Describe the second gift received from the protected person/i)

      await goToPreviousCardUntil(page, /another gift entry to add/i)
      await answerRadioQuestion(page, /another gift entry to add/i, 'Yes')
      await goToNextCard(page)
      await expect(fieldInCurrentCard(page, /Describe the second gift received from the protected person/i)).toHaveValue('')
    })
  })

  test('uses the entered protected person name in later field labels', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithText(page, /What is the protected person’s full name/i)

    await fillTextField(page, /What is the protected person’s full name/i, 'Mia Chen')
    await goToCardWithFieldLabel(page, /How is Mia Chen doing overall/i)

    await expectCurrentCardToContainText(page, /How is Mia Chen doing overall/i)
  })

  test.describe('Budget Card Layout', () => {
    test('keeps medical or dental insurance comments with the proposed amount card', async ({ page }) => {
      await gotoForm(page)
      await goToCardWithText(page, /What monthly medical or dental insurance amount are you proposing/i)

      await expect(
        fieldInCurrentCard(page, /What monthly medical or dental insurance amount are you proposing/i)
      ).toBeVisible()
      await expect(fieldInCurrentCard(page, /Comments for medical or dental insurance/i)).toBeVisible()
    })
  })
})
