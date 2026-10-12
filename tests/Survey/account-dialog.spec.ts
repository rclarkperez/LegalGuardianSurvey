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

test('account dialog supports account creation and password reset paths', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()

  const dialog = page.getByRole('dialog')
  const setupMessage = dialog.getByText('Account saving is not configured for this site yet.')
  test.skip(await setupMessage.count() > 0, 'Firebase Authentication is not configured in this environment')

  await expect(dialog.getByRole('heading', { name: 'Sign in to GuardianForm' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Create an account' }).click()
  await expect(dialog.getByRole('heading', { name: 'Create your account' })).toBeVisible()

  await dialog.getByLabel('Email address').fill('new-user@example.com')
  await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill('password123')
  await dialog.getByLabel('Confirm password').fill('different123')
  await dialog.getByRole('button', { name: 'Create account' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('The passwords do not match.')

  await dialog.getByRole('button', { name: 'Back to sign in' }).click()
  await dialog.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(dialog.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Send reset link' })).toBeVisible()
})

test('save progress button explains account saving for signed-out users', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/save your progress.*resume at your next unanswered question/i)).toBeVisible()
  await page.getByRole('button', { name: /Start my report/i }).click()
  await page.getByRole('button', { name: 'Save progress' }).click()

  const prompt = page.getByRole('dialog', { name: 'Sign in to save progress' })
  await expect(prompt).toBeVisible()
  await expect(prompt).toContainText('must sign in before progress can be saved')
  await prompt.getByRole('button', { name: 'No, continue without saving' }).click()
  await expect(prompt).toBeHidden()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('button', { name: 'Save progress' }).click()
  await page.getByRole('dialog', { name: 'Sign in to save progress' })
    .getByRole('button', { name: 'Yes, sign me in' }).click()
  await expect(page.getByRole('dialog', { name: 'Sign in to GuardianForm' })).toBeVisible()
})

test('signed-in users can save progress without the sign-in prompt', async ({ page }) => {
  await page.route('**/src/App.tsx', async route => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from '/node_modules/.vite/deps/react.js';
        import { TemplateForm } from '/src/components/TemplateForm.tsx';
        import { guardianShipFormTemplate } from '/src/templates/guardianShipForm.template.ts';
        export default function App() {
          const save = async () => {};
          return React.createElement(TemplateForm, {
            template: guardianShipFormTemplate,
            onDraftSave: save
          });
        }
      `,
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Save progress' }).click()
  await expect(page.getByRole('status')).toHaveText('Progress saved to your account.')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
