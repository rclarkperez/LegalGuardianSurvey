import { expect, test } from '@playwright/test'

const scenarios = [
  { answers: {}, nextField: 'individualName' },
  { answers: { individualName: 'Alex Example' }, nextField: 'reportType' },
  { answers: { individualName: 'Alex Example', reportType: '12' }, nextField: 'guardianshipScope' },
]

for (const { answers, nextField } of scenarios) {
for (const initialStepId of [undefined, 'General Information:countyName|caseNumber', 'Verification:verificationSignature']) {
  test(`resume opens ${nextField} with marker ${initialStepId ?? 'missing'}`, async ({ page }) => {
    // Exercise the real form under main.tsx's StrictMode, without a live account.
    await page.route('**/src/App.tsx', async route => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          import React from '/node_modules/.vite/deps/react.js';
          import { TemplateForm } from '/src/components/TemplateForm.tsx';
          import { guardianShipFormTemplate } from '/src/templates/guardianShipForm.template.ts';
          window.savedSteps = [];
          const save = async (_, step) => { window.savedSteps.push(step); };
          export default function App() {
            const [started, setStarted] = React.useState(false);
            return started ? React.createElement(TemplateForm, {
              template: guardianShipFormTemplate,
              initialData: { countyName: 'King', caseNumber: 'RESUME-123', ...${JSON.stringify(answers)} },
              initialStepId: ${JSON.stringify(initialStepId) ?? 'undefined'},
              onDraftSave: save
            }) : React.createElement('button', {onClick: () => setStarted(true)}, 'Resume');
          }
        `,
      })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    const card = page.locator('.form-card-shell')
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('data-step-id', 'General Information:' + nextField)
    // Wait for the debounced autosave, including effects triggered by derived fields.
    await expect(page.getByRole('status')).toHaveText('Progress saved to your account.')
    await expect(card).toHaveAttribute('data-step-id', 'General Information:' + nextField)
    const savedSteps = await page.evaluate(() => (window as any).savedSteps as string[])
    expect(savedSteps.length).toBeGreaterThan(0)
    expect(savedSteps.every(step => !step.includes('countyName'))).toBe(true)
    for (let i = 0; i <= scenarios.findIndex(scenario => scenario.nextField === nextField); i++) {
      await page.getByRole('button', { name: 'Previous', exact: true }).click()
    }
    await expect(page.getByLabel(/county/i)).toHaveValue('King')
    await expect(page.getByLabel(/case or docket/i)).toHaveValue('RESUME-123')
  })
}
}
