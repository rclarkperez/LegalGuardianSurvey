import { expect, test, type Page } from '@playwright/test'

type DownloadRecorderWindow = Window & {
  __testDownloadAttempts?: string[]
  __testDownloadStubInstalled?: boolean
}

async function gotoForm(page: Page) {
  await page.goto('/')
  await expect(page).toHaveTitle(/GuardianForm/i)
  await expect(page.getByRole('heading', { name: 'GuardianForm' })).toBeVisible()
  await page.getByRole('button', { name: /Get started/i }).click()
}

function currentCardLabel(page: Page) {
  return page.locator('.form-progress-meta span').first()
}

function currentCompletionLabel(page: Page) {
  return page.locator('.form-progress-meta span').nth(1)
}

async function getCompletionPercent(page: Page): Promise<number> {
  const completionText = await currentCompletionLabel(page).textContent()
  const match = completionText?.match(/(\d+)%\s+complete/i)

  if (!match) {
    throw new Error(`Unable to parse completion text: ${completionText}`)
  }

  return Number(match[1])
}

async function goToLastCard(page: Page) {
  for (let index = 0; index < 200; index += 1) {
    if (await page.getByRole('button', { name: 'Submit' }).isVisible()) {
      return
    }

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.form-card-shell')).toBeVisible()
  }

  throw new Error('Unable to reach the last card within 200 steps')
}

function firstVisibleTextField(page: Page) {
  return page.locator(
    '.form-card-content textarea, .form-card-content input[type="text"], .form-card-content input:not([type])'
  ).first()
}

async function installDownloadStub(page: Page) {
  await page.addInitScript(() => {
    const recorderWindow = window as DownloadRecorderWindow
    recorderWindow.__testDownloadAttempts = []

    if (recorderWindow.__testDownloadStubInstalled) {
      return
    }

    recorderWindow.__testDownloadStubInstalled = true
    const originalClick = HTMLAnchorElement.prototype.click

    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
      if (this.hasAttribute('download')) {
        const nextRecorderWindow = window as DownloadRecorderWindow
        nextRecorderWindow.__testDownloadAttempts ??= []
        nextRecorderWindow.__testDownloadAttempts.push(this.getAttribute('download') ?? '')
        return
      }

      return originalClick.call(this)
    }
  })
}

async function getRecordedDownloads(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const recorderWindow = window as DownloadRecorderWindow
    return recorderWindow.__testDownloadAttempts ?? []
  })
}

test.describe('GuardianForm cross-browser smoke test', () => {
  test('loads the form shell and first card', async ({ page, browserName }) => {
    await gotoForm(page)

    await expect(page.getByRole('heading', { name: /Guardian\/Conservator's Report/i })).toBeVisible()
    await expect(page.getByText(/Annual report form for guardians and conservators/i)).toBeVisible()
    await expect(currentCardLabel(page)).toContainText(/General Information/i)
    await expect(currentCompletionLabel(page)).toContainText(/% complete/i)
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear Form' })).toBeVisible()

    test.info().annotations.push({
      type: 'browser',
      description: `Smoke test passed in ${browserName}`,
    })
  })

  test('allows a basic input and next-step navigation', async ({ page }) => {
    await gotoForm(page)

    const initialCompletion = await getCompletionPercent(page)
    const textField = firstVisibleTextField(page)
    await expect(textField).toBeVisible()
    await textField.fill('King')
    await expect(textField).toHaveValue('King')

    await page.getByRole('button', { name: 'Next' }).click()

    await expect(await getCompletionPercent(page)).toBeGreaterThan(initialCompletion)
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible()
  })
})

test.describe('Confirmation modal behavior', () => {
  test.beforeEach(async ({ page }) => {
    await installDownloadStub(page)
  })

  test('clear form opens styled modal and cancel preserves answers', async ({ page }) => {
    await gotoForm(page)

    const textField = firstVisibleTextField(page)
    await expect(textField).toBeVisible()
    await textField.fill('Pierce')

    await page.getByRole('button', { name: 'Clear Form' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Clear Form?' })).toBeVisible()
    await expect(page.getByText(/Are you sure you want to clear your form/i)).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(textField).toHaveValue('Pierce')
    await expect(currentCardLabel(page)).toContainText(/General Information/i)
  })

  test('clicking the clear modal backdrop closes it without clearing data', async ({ page }) => {
    await gotoForm(page)

    const textField = firstVisibleTextField(page)
    await expect(textField).toBeVisible()
    await textField.fill('Snohomish')

    await page.getByRole('button', { name: 'Clear Form' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.locator('.confirmation-modal-backdrop').click({ position: { x: 12, y: 12 } })

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(textField).toHaveValue('Snohomish')
  })

  test('confirming clear form returns home and allows a clean form to start', async ({ page }) => {
    await gotoForm(page)

    const textField = firstVisibleTextField(page)
    await expect(textField).toBeVisible()
    await textField.fill('Clark')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(await getCompletionPercent(page)).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Clear Form' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Clear Form' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('button', { name: /Get started/i })).toBeVisible()

    await page.getByRole('button', { name: /Get started/i }).click()
    await expect(currentCardLabel(page)).toContainText(/General Information/i)
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(firstVisibleTextField(page)).toHaveValue('')
  })

  test('confirming the home-button clear request does not reopen the dialog on restart', async ({ page }) => {
    await gotoForm(page)

    const textField = firstVisibleTextField(page)
    await textField.fill('Clark')
    await page.getByRole('button', { name: 'GuardianForm home' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: 'Clear Form' }).click()
    await expect(page.getByRole('button', { name: /Get started/i })).toBeVisible()

    await page.getByRole('button', { name: /Get started/i }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(firstVisibleTextField(page)).toHaveValue('')
  })

  test('submit confirmation modal appears only on the final card and cancel keeps the user there', async ({ page }) => {
    await gotoForm(page)

    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0)

    await goToLastCard(page)

    const finalCompletion = await getCompletionPercent(page)
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Submit Form?' })).toBeVisible()
    await expect(page.getByText(/generate the PDF/i)).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expect(await getCompletionPercent(page)).toBe(finalCompletion)
    await expect.poll(() => getRecordedDownloads(page)).toEqual([])
  })

  test('review screen is the last card and submit confirmation still works there', async ({ page }) => {
    await gotoForm(page)
    await goToLastCard(page)

    await expect(page.getByRole('heading', { name: 'Review Your Answers' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Submit Form?' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Review Your Answers' })).toBeVisible()
  })

  test('confirming submit generates the pdf flow and resets back to the first card', async ({ page }) => {
    await gotoForm(page)
    await goToLastCard(page)

    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: 'Submit Form' }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText(/PDF generated and downloaded successfully/i)).toBeVisible()
    await expect(currentCardLabel(page)).toContainText(/General Information/i)
    await expect.poll(() => getRecordedDownloads(page)).toHaveLength(1)
    await expect.poll(async () => (await getRecordedDownloads(page))[0] ?? '').toMatch(/\.pdf$/i)
  })
})
