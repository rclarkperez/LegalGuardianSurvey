import { expect, test } from '@playwright/test'

test('saved draft offers resume and delete actions', async ({ page }) => {
  await page.route('**/src/App.tsx', async route => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from '/node_modules/.vite/deps/react.js';
        import { SavedDraftRow } from '/src/components/SavedDraftRow.tsx';
        import '/src/App.css';

        export default function App() {
          const [draft, setDraft] = React.useState({
            id: 'current',
            title: 'In-progress annual report',
            templateId: 'guardian',
            templateVersion: '1',
            formData: {},
            updatedAt: '2026-10-13T19:00:00.000Z'
          });
          const [resumed, setResumed] = React.useState(false);

          return React.createElement(React.Fragment, null,
            draft && React.createElement(SavedDraftRow, {
              draft,
              onResume: () => setResumed(true),
              onDelete: () => setDraft(null)
            }),
            resumed && React.createElement('p', { role: 'status' }, 'Draft resumed'),
            !draft && React.createElement('p', { role: 'status' }, 'Draft deleted')
          );
        }
      `,
    })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Continue your report' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()

  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('status')).toHaveText('Draft resumed')

  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Draft deleted', { exact: true })).toBeVisible()
})
