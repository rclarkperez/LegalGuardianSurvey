import { expect, test } from '@playwright/test'
import {
  currentCardTitle,
  goToCardWithFieldLabel,
  goToCardWithText,
  drawHandwrittenSignature,
  goToNextCard,
  goToPreviousCard,
  goToPreviousCardUntil,
  gotoForm
} from '../helpers/form-helpers'

const signatureCanvasLabel = /Draw your signature here/i

test.describe('Verification signature', () => {
  test('shows inputs for Food Stamps, HUD, and L&I benefits', async ({ page }) => {
    await gotoForm(page)

    for (const label of [
      /Food Stamps \/ Supplemental Nutrition Assistance Program/i,
      /Housing and Urban Development Assistance \(HUD\)/i,
      /Labor and Industries \(L&I\) Benefits/i
    ]) {
      await goToCardWithFieldLabel(page, label)
      await expect(page.getByLabel(label)).toBeVisible()
    }
  })

  test('requires a handwritten signature and preserves it when navigating away and back', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithFieldLabel(page, signatureCanvasLabel)

    await expect(page.getByLabel(/Type your full name as signature/i)).toHaveCount(0)
    await goToCardWithText(page, /Review Your Answers/i)
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(currentCardTitle(page)).toContainText(/Verification/i)
    await expect(page.getByRole('alert')).toContainText(/draw your handwritten signature/i)
    await expect(page.locator('input[name="verificationSignature"]')).toHaveValue('')

    await drawHandwrittenSignature(page)
    const signatureField = page.locator('input[name="verificationSignature"]')
    await expect(signatureField).toHaveValue(/^data:image\/png;base64,/)
    await goToNextCard(page)
    await goToPreviousCard(page)

    await expect(currentCardTitle(page)).toContainText(/Verification/i)
    await expect(signatureField).toHaveValue(/^data:image\/png;base64,/)

    const capturedSignature = await signatureField.inputValue()
    await goToCardWithText(page, /Review Your Answers/i)
    const signaturePreview = page.getByRole('img', { name: 'Your handwritten signature' })
    await expect(signaturePreview).toBeVisible()
    await expect(signaturePreview).toHaveAttribute('src', capturedSignature)
    await expect(page.locator('.review-sections')).not.toContainText('data:image/png;base64,')
  })

  test('captures a drawn signature and allows the user to clear it', async ({ page }) => {
    await gotoForm(page)
    await goToCardWithFieldLabel(page, signatureCanvasLabel)

    await drawHandwrittenSignature(page)

    const signatureField = page.locator('input[name="verificationSignature"]')
    await expect(signatureField).toHaveValue(/^data:image\/png;base64,/)
    const capturedSignature = await signatureField.inputValue()

    await goToCardWithText(page, /Review Your Answers/i)
    const signaturePreview = page.getByRole('img', { name: 'Your handwritten signature' })
    await expect(signaturePreview).toBeVisible()
    await expect(signaturePreview).toHaveAttribute('src', capturedSignature)
    await expect(page.locator('.review-sections')).not.toContainText('data:image/png;base64,')

    await page.getByRole('button', { name: 'Previous' }).click()
    await goToPreviousCardUntil(page, signatureCanvasLabel)
    await page.getByRole('button', { name: 'Clear signature' }).click()
    await expect(page.locator('input[name="verificationSignature"]')).toHaveValue('')
    await expect(page.getByLabel(signatureCanvasLabel)).toBeVisible()
  })
})
