import { expect, type Locator, type Page } from '@playwright/test'

type TextMatcher = RegExp | string

function matchesText(value: string, matcher: TextMatcher): boolean {
  if (matcher instanceof RegExp) {
    return matcher.test(value)
  }

  return value.includes(matcher)
}

function getFieldLabelAliases(label: TextMatcher): TextMatcher[] {
  const matcherText = label instanceof RegExp ? label.source : label
  const personalPropertyValueMatch = matcherText.match(/value of personal or other property item\s*(\d+)/i)

  if (!personalPropertyValueMatch) {
    return []
  }

  const itemNumber = personalPropertyValueMatch[1]
  return [
    new RegExp(`Item ${itemNumber} value at start of accounting`, 'i'),
    new RegExp(`Item ${itemNumber} value at end of accounting`, 'i')
  ]
}

async function getCurrentStepId(page: Page): Promise<string | null> {
  return currentCard(page).getAttribute('data-step-id').catch(() => null)
}

async function waitForCardChange(page: Page, previousStepId: string) {
  await expect.poll(async () => {
    const stepId = await getCurrentStepId(page)
    return stepId && stepId !== previousStepId ? stepId : previousStepId
  }).not.toBe(previousStepId)
  await expect(currentCardTitle(page)).toBeVisible()
}

async function isFinalSubmitStep(page: Page): Promise<boolean> {
  return await page.getByRole('button', { name: 'Submit' }).isVisible()
}

export async function gotoForm(page: Page) {
  await page.goto('/')
  await expect(page).toHaveTitle(/GuardianForm/i)
  await expect(page.getByRole('button', { name: 'GuardianForm home' })).toBeVisible()
  await page.getByRole('button', { name: /Start my report/i }).click()
  await expect(page.locator('.form-card-shell')).toBeVisible()
}

export function currentCard(page: Page): Locator {
  return page.locator('.form-card-shell:visible').last()
}

export function currentCardTitle(page: Page): Locator {
  return currentCard(page).locator('.form-page-header h2')
}

export function currentCardHeading(page: Page, name: TextMatcher): Locator {
  return currentCardTitle(page).getByText(name, { exact: typeof name === 'string' })
}

export function currentSubheading(page: Page, name: TextMatcher): Locator {
  return currentCard(page).locator('.form-subsection-title').getByText(name, {
    exact: typeof name === 'string'
  })
}

export async function expectCurrentCardTitle(page: Page, matcher: TextMatcher) {
  await expect(currentCardTitle(page)).toBeVisible()
  const title = (await currentCardTitle(page).textContent()) ?? ''
  expect(matchesText(title, matcher)).toBeTruthy()
}

export async function expectCurrentCardToContainText(page: Page, matcher: TextMatcher) {
  const text = (await currentCard(page).textContent()) ?? ''
  expect(matchesText(text, matcher)).toBeTruthy()
}

export async function expectCurrentCardNotToContainText(page: Page, matcher: TextMatcher) {
  const text = (await currentCard(page).textContent()) ?? ''
  expect(matchesText(text, matcher)).toBeFalsy()
}

export async function goToNextCard(page: Page) {
  await expect.poll(() => getCurrentStepId(page)).not.toBeNull()
  const previousStepId = await getCurrentStepId(page)
  if (!previousStepId) {
    throw new Error('Cannot navigate forward because no current form step is rendered')
  }

  await page.getByRole('button', { name: 'Next' }).click({ force: true })
  await waitForCardChange(page, previousStepId)
}

export async function drawHandwrittenSignature(page: Page) {
  const canvas = page.getByLabel('Draw your signature here')
  const bounds = await canvas.boundingBox()
  if (!bounds) {
    throw new Error('The handwritten signature canvas is not visible')
  }

  await page.mouse.move(bounds.x + bounds.width * 0.08, bounds.y + bounds.height * 0.6)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.23, bounds.y + bounds.height * 0.32, { steps: 4 })
  await page.mouse.move(bounds.x + bounds.width * 0.34, bounds.y + bounds.height * 0.72, { steps: 3 })
  await page.mouse.move(bounds.x + bounds.width * 0.49, bounds.y + bounds.height * 0.38, { steps: 4 })
  await page.mouse.move(bounds.x + bounds.width * 0.64, bounds.y + bounds.height * 0.64, { steps: 4 })
  await page.mouse.move(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.43, { steps: 4 })
  await page.mouse.up()
}

export async function goToPreviousCard(page: Page) {
  await expect.poll(() => getCurrentStepId(page)).not.toBeNull()
  const previousStepId = await getCurrentStepId(page)
  if (!previousStepId) {
    throw new Error('Cannot navigate backward because no current form step is rendered')
  }

  await page.getByRole('button', { name: 'Previous' }).click({ force: true })
  await waitForCardChange(page, previousStepId)
}

export async function goToPreviousCardUntil(page: Page, matcher: TextMatcher, maxSteps = 200) {
  for (let index = 0; index < maxSteps; index += 1) {
    const title = (await currentCardTitle(page).textContent()) ?? ''
    const text = (await currentCard(page).textContent()) ?? ''
    const fieldIsVisible = await fieldInCurrentCard(page, matcher).isVisible().catch(() => false)
    if (fieldIsVisible || matchesText(title, matcher) || matchesText(text, matcher)) {
      return
    }

    if (!(await page.getByRole('button', { name: 'Previous' }).isEnabled())) {
      break
    }

    await goToPreviousCard(page)
  }

  throw new Error(`Unable to move backward to card matching ${String(matcher)}`)
}

export async function goToCardByTitle(page: Page, matcher: TextMatcher, maxSteps = 200) {
  for (let index = 0; index < maxSteps; index += 1) {
    const title = (await currentCardTitle(page).textContent()) ?? ''
    if (matchesText(title, matcher)) {
      return
    }

    if (await isFinalSubmitStep(page)) {
      break
    }

    await goToNextCard(page)
  }

  throw new Error(`Unable to find card title matching ${String(matcher)}`)
}

export async function goToCardWithText(page: Page, matcher: TextMatcher, maxSteps = 200) {
  for (let index = 0; index < maxSteps; index += 1) {
    const text = (await currentCard(page).textContent()) ?? ''
    if (matchesText(text, matcher)) {
      return
    }

    if (await isFinalSubmitStep(page)) {
      break
    }

    await goToNextCard(page)
  }

  throw new Error(`Unable to find card containing text matching ${String(matcher)}`)
}

export async function goToCardWithFieldLabel(page: Page, label: TextMatcher, maxSteps = 200) {
  for (let index = 0; index < maxSteps; index += 1) {
    if (await fieldInCurrentCard(page, label).isVisible().catch(() => false)) {
      return
    }

    if (await isFinalSubmitStep(page)) {
      break
    }

    await goToNextCard(page)
  }

  throw new Error(`Unable to find card with field label matching ${String(label)}`)
}

export async function goToNextCardUntil(page: Page, matcher: TextMatcher, maxSteps = 200) {
  for (let index = 0; index < maxSteps; index += 1) {
    await goToNextCard(page)

    const title = (await currentCardTitle(page).textContent()) ?? ''
    const text = (await currentCard(page).textContent()) ?? ''
    if (matchesText(title, matcher) || matchesText(text, matcher)) {
      return
    }

    if (await isFinalSubmitStep(page)) {
      break
    }
  }

  throw new Error(`Unable to advance to card matching ${String(matcher)}`)
}

export async function answerRadioQuestion(page: Page, question: TextMatcher, choice: 'Yes' | 'No') {
  const questionGroup = currentCard(page).locator('.form-group.radio-group').filter({ hasText: question }).first()
  await expect(questionGroup).toBeVisible()
  const option = questionGroup.getByLabel(choice, { exact: true })
  await option.click({ force: true })
}

export function fieldInCurrentCard(page: Page, label: TextMatcher): Locator {
  const primaryField = currentCard(page).getByLabel(label).first()
  return getFieldLabelAliases(label).reduce(
    (fieldLocator, alias) => fieldLocator.or(currentCard(page).getByLabel(alias).first()),
    primaryField
  ).first()
}

export async function fillTextField(page: Page, label: TextMatcher, value: string) {
  const field = fieldInCurrentCard(page, label)
  await expect(field).toBeVisible()
  if (await field.evaluate(element => element.tagName === 'SELECT')) {
    await field.selectOption(value)
    return
  }

  await field.fill(value)
}
