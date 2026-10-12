import { expect, test } from '@playwright/test'

test('account entry explains whether online saving is configured', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const setupMessage = dialog.getByText('Account saving is not configured for this site yet.')
  if (await setupMessage.count()) {
    await expect(setupMessage).toBeVisible()
    await expect(dialog.getByLabel('Email address')).toHaveCount(0)
  } else {
    await expect(dialog.getByLabel('Email address')).toBeVisible()
    await dialog.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(dialog.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  }

  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
})

test('save progress button explains prototype limitations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Start my report/i }).click()
  await page.getByRole('button', { name: 'Save progress' }).click()

  const dialog = page.getByRole('dialog', { name: 'Save progress is in development' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/still autosaves to your account|not saved to an account/i)).toBeVisible()
  await dialog.getByRole('button', { name: 'Got it' }).click()
  await expect(dialog).toBeHidden()
})
