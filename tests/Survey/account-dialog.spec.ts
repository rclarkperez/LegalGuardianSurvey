import { expect, test } from '@playwright/test'

test('account entry explains whether online saving is configured', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const setupMessage = dialog.getByText(/Firebase Authentication is not configured for this deployment/i)
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
  const setupMessage = dialog.getByText(/Firebase Authentication is not configured for this deployment/i)
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

test('unknown sign-in account prompts the user to create an account', async ({ page }) => {
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 400, message: 'EMAIL_NOT_FOUND' } })
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const dialog = page.getByRole('dialog')
  const setupMessage = dialog.getByText('Account saving is not configured for this site yet.')
  test.skip(await setupMessage.count() > 0, 'Firebase Authentication is not configured in this environment')

  await dialog.getByLabel('Email address').fill('missing@example.com')
  await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill('password123')
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click()

  const prompt = dialog.getByRole('alertdialog', { name: 'Account not found' })
  await expect(prompt).toBeVisible()
  await expect(prompt).toContainText('Would you like to create one?')
  await prompt.getByRole('button', { name: 'No, try again' }).click()
  await expect(prompt).toBeHidden()

  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(dialog.getByRole('alertdialog', { name: 'Account not found' })).toBeVisible()
  await dialog.getByRole('alertdialog', { name: 'Account not found' })
    .getByRole('button', { name: 'Yes, create account' }).click()
  await expect(dialog.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

test('save progress button explains account saving for signed-out users', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Create an account to save your progress and resume later.')).toBeVisible()
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

test('account settings validates password changes and account deletion', async ({ page }) => {
  await page.route('**/src/App.tsx', async route => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from '/node_modules/.vite/deps/react.js';
        import { AccountSettingsDialog } from '/src/components/AccountSettingsDialog.tsx';
        import '/src/App.css';
        export default function App() {
          const user = { email: 'user@example.com', uid: 'test-user' };
          return React.createElement(AccountSettingsDialog, {
            user,
            onClose: () => {},
            onDeleted: () => {}
          });
        }
      `,
    })
  })

  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: 'Account settings' })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('textbox', { name: 'New password', exact: true }).fill('password123')
  await dialog.getByRole('textbox', { name: 'Confirm new password', exact: true }).fill('different123')
  await dialog.getByRole('textbox', { name: 'Current password', exact: true }).nth(1).fill('current-password')
  await dialog.getByRole('button', { name: 'Update password' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('The new passwords do not match.')
  await expect(dialog.getByRole('textbox', { name: 'Confirm new password', exact: true })).toHaveAttribute('aria-invalid', 'true')

  await dialog.getByLabel('Type DELETE to confirm').click()
  await dialog.getByLabel('Type DELETE to confirm').fill('delete')
  await dialog.getByRole('textbox', { name: 'Current password', exact: true }).last().fill('current-password')
  await dialog.getByRole('button', { name: 'Delete account' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Type DELETE to confirm account deletion.')
  await expect(dialog.getByLabel('Type DELETE to confirm')).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByLabel('Type DELETE to confirm')).toHaveAttribute('autocomplete', 'new-password')
  await expect(dialog.getByRole('alert')).toHaveCSS('color', 'rgb(155, 44, 32)')
})
