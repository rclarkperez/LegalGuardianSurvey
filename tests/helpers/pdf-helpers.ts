import { expect, type Download, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { PdfTemplate, TemplateField, TemplateFormData } from '../../src/types/template.types'
import { deriveTemplateFormData } from '../../src/utils/templateFormDerivations'
import { splitTextIntoMappedFieldValues } from '../../src/utils/templatePdfGenerator'

const require = createRequire(import.meta.url)

export async function downloadGeneratedPdf(
  page: Page,
  targetPath: string
): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 90000 }),
    page.getByRole('dialog').getByRole('button', { name: 'Submit Form' }).click()
  ])

  await saveDownload(download, targetPath)
  return targetPath
}

async function saveDownload(download: Download, targetPath: string) {
  mkdirSync(path.dirname(targetPath), { recursive: true })
  await download.saveAs(targetPath)
}

export async function getPdfTextFieldValue(pdfPath: string, fieldName: string): Promise<string> {
  const pdfDoc = await loadPdf(pdfPath)
  const field = pdfDoc.getForm().getField(fieldName)

  if (typeof field.getText !== 'function') {
    throw new Error(`PDF field "${fieldName}" is not a text field`)
  }

  return (field.getText() ?? '').trim()
}

export async function getPdfFieldWidgetPages(pdfPath: string, fieldName: string): Promise<number[]> {
  const pdfDoc = await loadPdf(pdfPath)
  const field = pdfDoc.getForm().getField(fieldName)
  const pages = pdfDoc.getPages()

  return field.acroField
    .getWidgets()
    .map((widget: { P: () => unknown }) => pages.findIndex((page: { ref: unknown }) => page.ref === widget.P()) + 1)
    .filter((pageNumber: number) => pageNumber > 0)
}

export async function expectPdfTextFieldOnPage(
  pdfPath: string,
  fieldName: string,
  expectedValue: string,
  pageNumber: number
) {
  await expect
    .poll(() => getPdfTextFieldValue(pdfPath, fieldName), {
      message: `Expected PDF field "${fieldName}" to contain "${expectedValue}"`
    })
    .toBe(expectedValue)

  await expect
    .poll(() => getPdfFieldWidgetPages(pdfPath, fieldName), {
      message: `Expected PDF field "${fieldName}" to render on page ${pageNumber}`
    })
    .toContain(pageNumber)
}

export async function expectPdfCheckboxWidgetAt(
  pdfPath: string,
  fieldName: string,
  pageNumber: number,
  x: number,
  y: number
) {
  const pdfDoc = await loadPdf(pdfPath)
  const field = pdfDoc.getForm().getField(fieldName)

  if (typeof field.isChecked !== 'function') {
    throw new Error(`PDF field "${fieldName}" is not a checkbox`)
  }

  const widget = field.acroField.getWidgets()[0]
  const actualPage = pdfDoc.getPages().findIndex(
    (page: { ref: unknown }) => page.ref === widget.P()
  ) + 1
  const rect = widget.getRectangle()

  expect(actualPage, `Expected checkbox "${fieldName}" to render on page ${pageNumber}`).toBe(pageNumber)
  expect(rect.x, `Expected checkbox "${fieldName}" x-coordinate to match`).toBeCloseTo(x, 2)
  expect(rect.y, `Expected checkbox "${fieldName}" y-coordinate to match`).toBeCloseTo(y, 2)
}

export function renderPdfPages(pdfPath: string, outputRoot: string): string {
  mkdirSync(outputRoot, { recursive: true })

  execFileSync('swift', ['scripts/render-pdf-pages.swift', outputRoot, pdfPath], {
    cwd: process.cwd(),
    stdio: 'pipe'
  })

  const renderedDir = path.join(
    outputRoot,
    path.basename(pdfPath, path.extname(pdfPath)).split(' ').join('_')
  )

  if (!existsSync(renderedDir)) {
    throw new Error(`Expected rendered PDF directory at ${renderedDir}`)
  }

  return renderedDir
}

export function expectRenderedPdfPage(renderedDir: string, pageNumber: number) {
  const pagePath = path.join(renderedDir, `page-${String(pageNumber).padStart(2, '0')}.png`)

  expect(existsSync(pagePath)).toBeTruthy()
  expect(statSync(pagePath).size).toBeGreaterThan(0)

  return pagePath
}

async function loadPdf(pdfPath: string) {
  const bytes = readFileSync(pdfPath)
  const { PDFDocument } = require('pdf-lib')
  return PDFDocument.load(bytes)
}

function shouldRenderField(field: TemplateField, formData: TemplateFormData): boolean {
  if (!field.conditional) return true

  if (field.conditional.anyOfFieldIds && field.conditional.anyOfFieldIds.length > 0) {
    const expectedValue = field.conditional.equals !== undefined ? field.conditional.equals : true
    return field.conditional.anyOfFieldIds.some(fieldId => formData[fieldId] === expectedValue)
  }

  const watchedValue = formData[field.conditional.fieldId]

  if (field.conditional.equals !== undefined) {
    return watchedValue === field.conditional.equals
  }

  if (field.conditional.notEquals !== undefined) {
    return watchedValue !== field.conditional.notEquals
  }

  return true
}

function hasPdfFieldNames(field: TemplateField): boolean {
  return Array.isArray(field.pdfFieldNames) && field.pdfFieldNames.length > 0
}

const COORDINATE_ONLY_SECTIONS = new Set([
  'Conservator Balance Sheet',
  'Conservator Estate Information',
  'Conservator Explanations & Plan',
  'Conservator Proposed Budget'
])

function shouldUseCoordinateOnlyRendering(field: TemplateField): boolean {
  if (field.type === 'checkbox' || field.type === 'radio') {
    return false
  }

  return field.section !== undefined && COORDINATE_ONLY_SECTIONS.has(field.section)
}

function isCurrencyNumberField(field: TemplateField): boolean {
  const label = field.label.toLowerCase()

  return (
    field.id === 'feesReceivedAmount' ||
    field.label.includes('$') ||
    label.includes('amount')
  )
}

function formatNumberValue(field: TemplateField, num: number): string {
  if (isCurrencyNumberField(field)) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return num.toLocaleString('en-US')
}

function formatFieldValue(field: TemplateField, value: unknown): string {
  if (value === undefined || value === null) return ''

  if (field.type === 'checkbox') return value ? 'X' : ''

  if (field.type === 'number' && typeof value === 'string') {
    const num = parseFloat(value)
    if (!Number.isNaN(num)) {
      return formatNumberValue(field, num)
    }
  }

  if (field.type === 'date' && typeof value === 'string') {
    const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch
      return `${month}/${day}/${year}`
    }

    try {
      const date = new Date(value)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return value
    }
  }

  if (field.type === 'select' && field.options) {
    const option = field.options.find(candidate => candidate.value === value)
    return option ? option.label : String(value)
  }

  return String(value)
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text || text.length === 0) return []

  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function fitSingleLineTextToWidth(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string {
  if (!text || font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    return text
  }

  const ellipsis = '...'
  if (font.widthOfTextAtSize(ellipsis, fontSize) >= maxWidth) {
    return ''
  }

  let fitted = text
  while (fitted.length > 0) {
    fitted = fitted.slice(0, -1).trimEnd()
    if (font.widthOfTextAtSize(`${fitted}${ellipsis}`, fontSize) <= maxWidth) {
      return `${fitted}${ellipsis}`
    }
  }

  return ''
}

function normalizeMappedSingleLineValue(value: string): string {
  return value.replace(/\s*\r?\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function splitTextIntoFieldValues(field: TemplateField, value: unknown, font: any): string[] {
  const maxWidth = field.pdf.maxWidth || 200
  const fontSize = field.pdf.fontSize || 10
  const displayValue = formatFieldValue(field, value)

  if (!displayValue) return []

  if (field.type !== 'textarea') {
    const fieldCount = field.pdfFieldNames?.length ?? 1
    return Array.from({ length: fieldCount }, () => displayValue)
  }

  if ((field.pdfFieldNames?.length ?? 0) === 1) {
    return [displayValue]
  }

  return displayValue
    .split(/\r?\n/)
    .flatMap(line => wrapText(line, font, fontSize, maxWidth))
}

export async function expectMappedPdfFieldsToExist(
  pdfPath: string,
  template: PdfTemplate
) {
  const pdfDoc = await loadPdf(pdfPath)
  const form = pdfDoc.getForm()
  const availableFieldNames = new Set(
    form
      .getFields()
      .map((pdfField: { getName?: () => string }) =>
        typeof pdfField.getName === 'function' ? pdfField.getName() : null
      )
      .filter((fieldName: string | null): fieldName is string => Boolean(fieldName))
  )

  const candidateFields = template.fields.filter(field => {
    if (field.includeInPdf === false) return false
    if (!hasPdfFieldNames(field)) return false
    if (shouldUseCoordinateOnlyRendering(field)) return false
    return true
  })

  expect(candidateFields.length).toBeGreaterThan(0)

  for (const field of candidateFields) {
    const missingFieldNames = field.pdfFieldNames!.filter(fieldName => !availableFieldNames.has(fieldName))

    expect(
      missingFieldNames,
      `Expected template field "${field.id}" to reference only real PDF fields`
    ).toEqual([])
  }
}

export function expectNoCoordinateFallbackChoiceFields(template: PdfTemplate) {
  const candidateFields = template.fields.filter(field => {
    if (field.includeInPdf === false) return false
    if (field.type !== 'checkbox' && field.type !== 'radio') return false
    return !hasPdfFieldNames(field) && !field.pdfCoordinateOverlay
  })

  expect(
    candidateFields.map(field => field.id),
    'Expected every PDF checkbox/radio to have a mapped widget or an explicit coordinate overlay'
  ).toEqual([])
}

export async function expectPdfTemplateTextMappingsToPopulateInputs(
  pdfPath: string,
  template: PdfTemplate,
  formData: TemplateFormData
) {
  const pdfDoc = await loadPdf(pdfPath)
  const form = pdfDoc.getForm()
  const resolvedFormData = deriveTemplateFormData(formData)
  const font = await pdfDoc.embedFont('Helvetica')

  const candidateFields = template.fields.filter(field => {
    if (field.includeInPdf === false) return false
    if (!hasPdfFieldNames(field)) return false
    if (shouldUseCoordinateOnlyRendering(field)) return false
    if (!shouldRenderField(field, resolvedFormData)) return false
    if (field.type === 'select') return false
    if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'signature' || field.type === 'file') {
      return false
    }

    const value = resolvedFormData[field.id]
    return value !== undefined && value !== null && value !== ''
  })

  expect(candidateFields.length).toBeGreaterThan(0)

  for (const field of candidateFields) {
    const expectedValues = splitTextIntoMappedFieldValues(form, field, resolvedFormData[field.id], font)
      .map(value => field.type === 'textarea' && field.pdfFieldNames!.length === 1
        ? normalizeMappedSingleLineValue(value)
        : value)
    expect(expectedValues.length, `Expected test value for "${field.id}" to produce text`).toBeGreaterThan(0)

    for (const [index, fieldName] of field.pdfFieldNames!.entries()) {
      const pdfField = form.getField(fieldName)

      if (typeof pdfField.getText !== 'function') {
        throw new Error(`PDF field "${fieldName}" for template field "${field.id}" is not a text input`)
      }

      const actualValue = (pdfField.getText() ?? '').trim()
      const expectedValue = (expectedValues[index] ?? '').trim()

      expect(
        actualValue,
        `Expected template field "${field.id}" to populate PDF field "${fieldName}"`
      ).toBe(expectedValue)
    }
  }
}

export async function expectCoordinateOnlyPdfFieldsToFitWithinBounds(
  template: PdfTemplate,
  formData: TemplateFormData
) {
  const resolvedFormData = deriveTemplateFormData(formData)
  const { PDFDocument } = require('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont('Helvetica')

  const candidateFields = template.fields.filter(field => {
    if (field.includeInPdf === false) return false
    if (!shouldUseCoordinateOnlyRendering(field)) return false
    if (!shouldRenderField(field, resolvedFormData)) return false
    if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'signature' || field.type === 'file') {
      return false
    }

    const value = resolvedFormData[field.id]
    return value !== undefined && value !== null && value !== ''
  })

  expect(candidateFields.length).toBeGreaterThan(0)

  for (const field of candidateFields) {
    if (field.type === 'textarea') {
      const lines = splitTextIntoFieldValues(field, resolvedFormData[field.id], font)
      const maxLines = field.pdf.maxLines ?? lines.length

      expect(
        lines.length,
        `Expected coordinate-only textarea field "${field.id}" to stay within ${maxLines} line(s)`
      ).toBeLessThanOrEqual(maxLines)

      continue
    }

    const fontSize = field.pdf.fontSize || 10
    const maxWidth = field.pdf.maxWidth

    if (!maxWidth || maxWidth <= 0) {
      continue
    }

    const displayValue = fitSingleLineTextToWidth(
      formatFieldValue(field, resolvedFormData[field.id]),
      font,
      fontSize,
      maxWidth
    )

    expect(
      font.widthOfTextAtSize(displayValue, fontSize),
      `Expected coordinate-only field "${field.id}" to fit within ${maxWidth}px of PDF width`
    ).toBeLessThanOrEqual(maxWidth)
  }
}
