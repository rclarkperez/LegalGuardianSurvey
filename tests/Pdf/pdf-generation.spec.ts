import { expect, test } from '@playwright/test'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { guardianShipFormTemplate } from '../../src/templates/guardianShipForm.template'
import type { TemplateFormData } from '../../src/types/template.types'
import { buildWholePdfFixture } from '../fixtures/full-pdf-fixture'
import { pdfPageFourFixture } from '../fixtures/pdf-fixture'
import {
  answerRadioQuestion,
  currentCard,
  goToCardByTitle,
  goToCardWithFieldLabel,
  goToCardWithText,
  goToNextCard,
  gotoForm,
} from '../helpers/form-helpers'
import {
  downloadGeneratedPdf,
  expectCoordinateOnlyPdfFieldsToFitWithinBounds,
  expectMappedPdfFieldsToExist,
  expectNoCoordinateFallbackChoiceFields,
  expectPdfTextFieldOnPage,
  expectPdfTemplateTextMappingsToPopulateInputs,
} from '../helpers/pdf-helpers'
import process from 'node:process'
import { Buffer } from 'node:buffer'

const STABLE_PDF_ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'generated-pdfs')

test.describe('PDF generation regression coverage', () => {
  test('full fixture uses court-friendly county text and comma-separated multiline lists', () => {
    const formData = buildWholePdfFixture()
    const serviceLines = String(formData.servicesReceived).split('\n')
    const giftLines = String(formData.giftsReceived).split('\n')
    const professionalNameLines = String(formData.professionalNames).split('\n')

    expect(formData.countyName).toBe('King')
    expect(formData.individualName).toBe('Jordan Alvarez')
    expect(formData.guardianName).toBe('Maya Chen')
    expect(formData.individualAge).toBe('67')
    expect(formData.guardianAge).toBe('42')
    expect(formData.guardianName).not.toBe(formData.individualName)
    expect(String(formData.noticeParty1Address)).toMatch(/, [A-Za-z ]+, WA \d{5}$/)
    expect(String(formData.successorAddress)).toMatch(/, [A-Za-z ]+, WA \d{5}$/)
    expect(String(formData.eventTrigger)).not.toContain('\n')
    expect(serviceLines[0]).toMatch(/,$/)
    expect(giftLines[0]).toMatch(/,$/)
    expect(professionalNameLines[0]).toMatch(/,$/)
    expect(serviceLines[serviceLines.length - 1]).not.toMatch(/,$/)
    expect(giftLines[giftLines.length - 1]).not.toMatch(/,$/)
    expect(professionalNameLines[professionalNameLines.length - 1]).not.toMatch(/,$/)
  })

  test('page 4 fee answers are written into PDF input fields', async ({ page }, testInfo) => {
    await gotoForm(page)
    await goToCardByTitle(page, /Fees and Allowances/i)
    await fillPageFourFixture(page)

    await goToReviewPage(page)

    await expect(page.getByRole('heading', { name: 'Review Your Answers' })).toBeVisible()
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const pdfPath = path.join(testInfo.outputDir, 'generated-page-4-regression.pdf')
    await downloadGeneratedPdf(page, pdfPath)
    saveStablePdfArtifact(pdfPath, 'generated-page-4-regression.pdf')
    await expect(page.getByText(/PDF generated and downloaded successfully/i)).toBeVisible()

    await expectPdfTextFieldOnPage(
      pdfPath,
      'guardianconservator was authorized to receive a monthly advance in the amount of',
      '555.00',
      4
    )
    await expectPdfTextFieldOnPage(pdfPath, 'through', '06/23/2026', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'The', '07/01/2026', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'the amount of', '4,444.00', 4)
    await expectPdfTextFieldOnPage(
      pdfPath,
      'guardianconservator has attached to this report or has filed with this report a separate',
      '444.00',
      4
    )
    await expectPdfTextFieldOnPage(pdfPath, 'requesting that the amount of', '5,553.00', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'for the time period of', 'Clark & Example PLLC', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'be paid from guardianship assets Attached in', '3,535.00', 4)
    await expectPdfTextFieldOnPage(
      pdfPath,
      'this report or filed herewith is an itemized fee declaration that describes the legal',
      '06/24/2026',
      4
    )
    await expectPdfTextFieldOnPage(pdfPath, 'through_2', '06/14/2026', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_16', '335.00', 4)
  })

  test('whole generated pdf keeps mapped text values inside actual PDF input fields', async ({ browserName: _browserName }, testInfo) => {
    const { generatePdfFromTemplate } = await import('../../src/utils/templatePdfGenerator')
    const formData = buildWholePdfFixture()
    const pdfTemplatePath = path.join(process.cwd(), 'public', 'GuardianShipFormFillable2.pdf')
    const templateBytes = readFileSync(pdfTemplatePath)
    const pdfBlob = await generatePdfFromTemplate(
      guardianShipFormTemplate,
      formData,
      templateBytes.buffer.slice(
        templateBytes.byteOffset,
        templateBytes.byteOffset + templateBytes.byteLength
      )
    )
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
    const pdfPath = path.join(testInfo.outputDir, 'generated-full-pdf-regression.pdf')

    mkdirSync(path.dirname(pdfPath), { recursive: true })
    writeFileSync(pdfPath, pdfBuffer)
    saveStablePdfArtifact(pdfPath, 'generated-full-pdf-regression.pdf')

    await expectPdfTemplateTextMappingsToPopulateInputs(pdfPath, guardianShipFormTemplate, formData)
    await expectMappedPdfFieldsToExist(pdfPath, guardianShipFormTemplate)
    expectNoCoordinateFallbackChoiceFields(guardianShipFormTemplate)
    await expectCoordinateOnlyPdfFieldsToFitWithinBounds(guardianShipFormTemplate, formData)
    await expectPdfTextFieldOnPage(
      pdfPath,
      'services and other supports and services 1',
      'Supported decision-making coaching,',
      5
    )
  })

  test('derived account totals and changed bond amount are written into the PDF', async ({ browserName: _browserName }, testInfo) => {
    const { generatePdfFromTemplate } = await import('../../src/utils/templatePdfGenerator')
    const pdfTemplatePath = path.join(process.cwd(), 'public', 'GuardianShipFormFillable2.pdf')
    const templateBytes = readFileSync(pdfTemplatePath)
    const formData: TemplateFormData = {
      bondInPlace: 'yes',
      bondRecommendation: 'change',
      newBondAmount: '12345',
      realPropertyWorth1: '400',
      realPropertyWorth2: '300',
      realPropertyWorth3: '300',
      receivableWorth1: '120',
      receivableWorth2: '80',
      undefined_21: '100',
      undefined_22: '110',
      undefined_23: '200',
      undefined_24: '220',
      undefined_25: '300',
      undefined_26: '330',
      undefined_29: '400',
      undefined_30: '440',
      undefined_31: '500',
      undefined_32: '550',
      undefined_33: '600',
      undefined_34: '660',
      undefined_37: '50',
      undefined_38: '55',
      undefined_39: '70',
      undefined_40: '75',
      undefined_43: '10',
      undefined_44: '11',
      undefined_45: '20',
      undefined_46: '22',
      undefined_47: '30',
      undefined_48: '33',
      undefined_49: '40',
      undefined_50: '44',
      fill_10: '1000',
      fill_12: '200',
      fill_14: '300',
      fill_16: '400',
      fill_18: '500',
      fill_20: '600',
      fill_22: '700',
      fill_24: '100',
      fill_26: '200',
      fill_28: '300',
      fill_29: '400',
      fill_31: '500',
      fill_33: '600',
      fill_35: '700',
      fill_37: '800',
      undefined_60: '3500'
    }

    const pdfBlob = await generatePdfFromTemplate(
      guardianShipFormTemplate,
      formData,
      templateBytes.buffer.slice(
        templateBytes.byteOffset,
        templateBytes.byteOffset + templateBytes.byteLength
      )
    )
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
    const pdfPath = path.join(testInfo.outputDir, 'generated-derived-bond-regression.pdf')

    mkdirSync(path.dirname(pdfPath), { recursive: true })
    writeFileSync(pdfPath, pdfBuffer)
    saveStablePdfArtifact(pdfPath, 'generated-derived-bond-regression.pdf')

    await expectPdfTextFieldOnPage(pdfPath, 'undefined_14', '660', 3)
    await expectPdfTextFieldOnPage(pdfPath, 'The total assets in blocked accounts is', '1,650', 3)
    await expectPdfTextFieldOnPage(pdfPath, 'The bond should    remain or    should be changed to', '12,345.00', 4)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_27', '600.00', 9)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_28', '660.00', 9)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_35', '1,500.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_36', '1,650.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_41', '3,420.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_42', '3,640.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_51', '100.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_52', '110.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_53', '3,320.00', 10)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_54', '3,530.00', 10)
  })

  test('derived proposed-budget totals are written into the PDF', async ({ browserName: _browserName }, testInfo) => {
    const { generatePdfFromTemplate } = await import('../../src/utils/templatePdfGenerator')
    const pdfTemplatePath = path.join(process.cwd(), 'public', 'GuardianShipFormFillable2.pdf')
    const templateBytes = readFileSync(pdfTemplatePath)
    const formData: TemplateFormData = {
      undefined_67: '100',
      undefined_68: '110',
      undefined_69: '200',
      undefined_70: '220',
      undefined_71: '300',
      undefined_72: '330',
      undefined_73: '400',
      undefined_74: '440',
      undefined_75: '500',
      undefined_76: '550',
      undefined_77: '600',
      undefined_78: '660',
      undefined_79: '700',
      undefined_80: '770'
    }

    const pdfBlob = await generatePdfFromTemplate(
      guardianShipFormTemplate,
      formData,
      templateBytes.buffer.slice(
        templateBytes.byteOffset,
        templateBytes.byteOffset + templateBytes.byteLength
      )
    )
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
    const pdfPath = path.join(testInfo.outputDir, 'generated-derived-budget-regression.pdf')

    mkdirSync(path.dirname(pdfPath), { recursive: true })
    writeFileSync(pdfPath, pdfBuffer)
    saveStablePdfArtifact(pdfPath, 'generated-derived-budget-regression.pdf')

    await expectPdfTextFieldOnPage(pdfPath, 'undefined_81', '2,800.00', 13)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_82', '3,080.00', 13)
    await expectPdfTextFieldOnPage(pdfPath, 'undefined_83', '36,960.00', 13)
  })

})

function saveStablePdfArtifact(sourcePath: string, filename: string) {
  mkdirSync(STABLE_PDF_ARTIFACT_DIR, { recursive: true })
  copyFileSync(sourcePath, path.join(STABLE_PDF_ARTIFACT_DIR, filename))
}

async function fillPageFourFixture(page: Parameters<typeof gotoForm>[0]) {
  await goToCardWithText(page, /Fees Amount \(\$\)/i)
  await fillNthTextField(page, /Fees Amount \(\$\)/i, 0, pdfPageFourFixture.guardianFeesAmount)
  await fillNthTextField(page, /From Date/i, 0, pdfPageFourFixture.guardianFeesFromDate)

  await goToCardWithText(page, /To Date/i)
  await expect(currentCard(page)).toContainText(/Fees and Allowances/i)
  await fillNthTextField(page, /To Date/i, 0, pdfPageFourFixture.guardianFeesToDate)
  await fillNthTextField(page, /Monthly Advance Amount \(\$\)/i, 0, pdfPageFourFixture.monthlyAdvanceAmount)

  await goToCardWithText(page, /receive fees during this accounting period/i)
  await expect(currentCard(page)).toContainText(/Fees and Allowances/i)
  await answerRadioQuestion(page, /receive fees during this accounting period/i, 'Yes')
  await goToNextCard(page)
  await expect(currentCard(page)).toContainText(/Fees and Allowances/i)
  await fillNthTextField(page, /How much did you receive in fees/i, 0, pdfPageFourFixture.feesReceivedAmount)
  await fillNthTextField(page, /Amount to Disburse from Assets/i, 0, pdfPageFourFixture.disburseAmount)

  await goToCardByTitle(page, /Attorney Fees/i)
  await goToCardWithText(page, /Law Office Name/i)
  await fillNthTextField(page, /Law Office Name/i, 0, pdfPageFourFixture.attorneyLawOffice)

  await goToCardWithText(page, /Attorney Fees Amount/i)
  await expect(currentCard(page)).toContainText(/Attorney Fees/i)
  await fillNthTextField(page, /Attorney Fees Amount/i, 0, pdfPageFourFixture.attorneyFeesAmount)

  await goToCardWithText(page, /From Date/i)
  await expect(currentCard(page)).toContainText(/Attorney Fees/i)
  await fillNthTextField(page, /From Date/i, 0, pdfPageFourFixture.attorneyFeesFromDate)
  await fillNthTextField(page, /To Date/i, 0, pdfPageFourFixture.attorneyFeesToDate)

  await goToCardByTitle(page, /Monthly Allowance/i)
  await goToCardWithText(page, /Previous Period Fees Total/i)
  await fillNthTextField(page, /Previous Period Fees Total/i, 0, pdfPageFourFixture.previousPeriodFeesTotal)
  await fillNthTextField(page, /Monthly Average/i, 0, pdfPageFourFixture.monthlyAverage)

  await goToCardWithText(page, /Previous Monthly Allowance/i)
  await expect(currentCard(page)).toContainText(/Monthly Allowance/i)
  await fillNthTextField(page, /Previous Monthly Allowance/i, 0, pdfPageFourFixture.previousMonthlyAllowance)

  await goToCardWithText(page, /Requested Monthly Allowance/i)
  await expect(currentCard(page)).toContainText(/Monthly Allowance/i)
  await fillNthTextField(page, /Requested Monthly Allowance/i, 0, pdfPageFourFixture.requestedMonthlyAllowance)

  await goToCardWithFieldLabel(page, /Effective Date/i)
  await expect(currentCard(page)).toContainText(/Monthly Allowance/i)
  await fillNthTextField(page, /Effective Date/i, 0, pdfPageFourFixture.allowanceEffectiveDate)
}

async function fillNthTextField(
  page: Parameters<typeof gotoForm>[0],
  label: RegExp,
  index: number,
  value: string
) {
  const field = currentCard(page).getByLabel(label).nth(index)
  await expect(field).toBeVisible()
  await field.fill(value)
}

async function goToReviewPage(page: Parameters<typeof gotoForm>[0]) {
  for (let index = 0; index < 200; index += 1) {
    if (await page.getByRole('button', { name: 'Submit' }).isVisible()) {
      return
    }

    await goToNextCard(page)
  }

  throw new Error('Unable to reach the review page within 200 steps')
}
