/**
 * Template-Based PDF Generator
 * 
 * This engine uses the template schema to generate PDFs with form data.
 * It reads field coordinates from the template and places text accordingly.
 */

import {
  PDFDocument,
  degrees,
  drawLine,
  drawRectangle,
  rgb,
  StandardFonts
} from 'pdf-lib'
import type { PdfTemplate, TemplateField, TemplateFormData } from '../types/template.types'
import { deriveTemplateFormData } from './templateFormDerivations'
import type { PDFFont } from 'pdf-lib'

/**
 * Get the pdf-lib font for a given font name
 */
async function getFont(pdfDoc: PDFDocument, fontName: string = 'Helvetica'): Promise<PDFFont> {
  switch (fontName) {
    case 'TimesRoman':
      return await pdfDoc.embedFont(StandardFonts.TimesRoman)
    case 'Courier':
      return await pdfDoc.embedFont(StandardFonts.Courier)
    case 'Symbol':
      return await pdfDoc.embedFont(StandardFonts.Symbol)
    case 'ZapfDingbats':
      return await pdfDoc.embedFont(StandardFonts.ZapfDingbats)
    case 'Helvetica':
    default:
      return await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(
  text: string, 
  font: PDFFont, 
  fontSize: number, 
  maxWidth: number
): string[] {
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

function fitFontSizeToWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth?: number,
  minimumFontSize: number = 3.5
): number {
  if (!text || !maxWidth || maxWidth <= 0) {
    return fontSize
  }

  let resolvedFontSize = fontSize
  while (
    resolvedFontSize > minimumFontSize &&
    font.widthOfTextAtSize(text, resolvedFontSize) > maxWidth
  ) {
    resolvedFontSize -= 0.25
  }

  return resolvedFontSize
}

function normalizeMappedSingleLineValue(value: string): string {
  return value.replace(/\s*\r?\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function normalizeNumberLikeValue(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalized = value.replace(/[^0-9.-]/g, '')
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Format a field value for PDF display
 */
function formatFieldValue(field: TemplateField, value: any): string {
  if (value === undefined || value === null) return ''
  
  if (field.type === 'checkbox') return value ? 'X' : ''
  
  // Handle number fields (currency formatting)
  if (field.type === 'number') {
    const num = normalizeNumberLikeValue(value)
    return num === null ? '' : formatNumberValue(field, num)
  }
  
  // Handle date fields
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
  
  // Handle select fields
  if (field.type === 'select' && field.options) {
    const option = field.options.find(o => o.value === value)
    return option ? option.label : String(value)
  }
  
  return String(value)
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

function isCheckedValue(value: any): boolean {
  if (value === true) return true
  if (typeof value === 'number') return value !== 0

  if (typeof value === 'string') {
    return ['true', 'on', 'yes', 'y', '1', 'checked', 'x'].includes(
      value.trim().toLowerCase()
    )
  }

  if (Array.isArray(value)) {
    return value.some(isCheckedValue)
  }

  return false
}

export function uiToPdfY(uiY: number, pageHeight: number): number {
  return pageHeight - uiY
}

function resolvePageIndex(template: PdfTemplate, pageNumber: number): number {
  const pageNumberBase = template.coordinateConfig?.pageNumberBase ?? 0
  return pageNumberBase === 1 ? pageNumber - 1 : pageNumber
}

function resolvePdfY(template: PdfTemplate, y: number, pageHeight: number): number {
  const coordinateOrigin = template.coordinateConfig?.coordinateOrigin ?? 'pdf-bottom-left'
  return coordinateOrigin === 'ui-top-left' ? uiToPdfY(y, pageHeight) : y
}

function resolveFieldPlacement(
  template: PdfTemplate,
  field: TemplateField,
  page: any
) {
  return {
    pageIndex: resolvePageIndex(template, field.pdf.page),
    x: field.pdf.x,
    y: resolvePdfY(template, field.pdf.y, page.getHeight())
  }
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

function hasPdfCoordinates(field: TemplateField): boolean {
  return (
    field.pdf != null &&
    field.pdf.page != null &&
    field.pdf.x != null &&
    field.pdf.y != null
  )
}

function hasPdfFieldNames(field: TemplateField): boolean {
  return Array.isArray(field.pdfFieldNames) && field.pdfFieldNames.length > 0
}

function hasAnyAvailablePdfFieldName(
  field: TemplateField,
  availableFieldNames: Set<string>
): boolean {
  if (!hasPdfFieldNames(field)) {
    return false
  }

  return field.pdfFieldNames!.some(fieldName => availableFieldNames.has(fieldName))
}

function shouldUseCoordinateOnlyRendering(field: TemplateField): boolean {
  // Prefer real AcroForm fields whenever the template provides a mapping.
  return !hasPdfFieldNames(field)
}

function shouldRenderCoordinateOverlay(field: TemplateField): boolean {
  return field.pdfCoordinateOverlay === true && hasPdfFieldNames(field)
}

function splitTextIntoFieldValues(
  field: TemplateField,
  value: any,
  font: PDFFont
): string[] {
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

function getPdfFieldWidth(form: any, fieldName: string, fallback: number): number {
  try {
    const widget = form.getField(fieldName).acroField.getWidgets()[0]
    return widget.getRectangle().width || fallback
  } catch {
    return fallback
  }
}

/**
 * Split mapped multiline text using the widths of the actual PDF widgets.
 * Template widths describe the form UI; the source PDF often uses a narrow
 * inline widget followed by wider continuation widgets.
 */
export function splitTextIntoMappedFieldValues(
  form: any,
  field: TemplateField,
  value: unknown,
  font: PDFFont
): string[] {
  const displayValue = formatFieldValue(field, value)
  const fieldNames = field.pdfFieldNames ?? []

  if (!displayValue) return []
  if (field.type !== 'textarea' || fieldNames.length <= 1) {
    return splitTextIntoFieldValues(field, value, font)
  }

  const fontSize = field.pdf.fontSize || 10
  const fallbackWidth = field.pdf.maxWidth || 200
  const values: string[] = []
  let fieldIndex = 0

  for (const sourceLine of displayValue.split(/\r?\n/)) {
    if (fieldIndex >= fieldNames.length) break

    const width = getPdfFieldWidth(form, fieldNames[fieldIndex], fallbackWidth)
    const wrapped = sourceLine.trim()
      ? wrapText(sourceLine, font, fontSize, width)
      : ['']

    for (const line of wrapped) {
      if (fieldIndex >= fieldNames.length) break
      values.push(line)
      fieldIndex += 1
    }
  }

  return values
}

function fillPdfFormField(
  form: any,
  field: TemplateField,
  fieldName: string,
  value: string | boolean,
  fontSizeOverride?: number
): boolean {
  try {
    const pdfField = form.getField(fieldName)

    if (
      typeof pdfField.check === 'function' &&
      typeof pdfField.uncheck === 'function'
    ) {
      if (isCheckedValue(value)) {
        pdfField.check()
      } else {
        pdfField.uncheck()
      }
      if (typeof pdfField.updateAppearances === 'function') {
        pdfField.updateAppearances(createCheckboxXAppearance)
      }
      return true
    }

    if (typeof pdfField.setText === 'function') {
      if (typeof pdfField.setFontSize === 'function' && (fontSizeOverride || field.pdf.fontSize)) {
        pdfField.setFontSize(fontSizeOverride || field.pdf.fontSize)
      }
      pdfField.setText(String(value))
      return true
    }

    return false
  } catch (error) {
    console.warn(`Unable to fill PDF field "${fieldName}"`, error)
    return false
  }
}

function fillMappedPdfFields(
  form: any,
  availableFieldNames: Set<string>,
  field: TemplateField,
  value: any,
  font: PDFFont
): boolean {
  if (!hasPdfFieldNames(field)) return false

  if (field.type === 'checkbox' || field.type === 'radio') {
    if (!availableFieldNames.has(field.pdfFieldNames![0])) {
      return false
    }

    return fillPdfFormField(form, field, field.pdfFieldNames![0], value)
  }

  const values = splitTextIntoMappedFieldValues(form, field, value, font)
  if (values.length === 0) return false

  let filled = false
  field.pdfFieldNames!.forEach((fieldName, index) => {
    if (!availableFieldNames.has(fieldName)) {
      return
    }

    const lineValue = values[index] ?? ''
    if (!lineValue && field.type === 'textarea' && index >= values.length) {
      hidePdfFieldWidget(form, fieldName)
      return
    }

    // AcroForm widgets reserve a few points for internal left/right padding;
    // fitting against the outer rectangle can still clip the final letters.
    const mappedWidth = Math.max(
      1,
      getPdfFieldWidth(form, fieldName, field.pdf.maxWidth || 200) - 10
    )
    const baseFontSize = field.pdf.fontSize || 10
    const renderedValue = field.type === 'textarea' && field.pdfFieldNames!.length === 1
      ? normalizeMappedSingleLineValue(lineValue)
      : lineValue
    const renderedFontSize = fitFontSizeToWidth(
      renderedValue,
      font,
      baseFontSize,
      mappedWidth,
      3.5
    )
    filled = fillPdfFormField(form, field, fieldName, renderedValue, renderedFontSize) || filled
  })

  return filled
}

function hidePdfFieldWidget(form: any, fieldName: string): void {
  try {
    const pdfField = form.getField(fieldName)
    const widget = pdfField.acroField.getWidgets()[0]

    // Annotation flag 2 is Hidden. Keeping the AcroForm field registered
    // preserves its mapping while removing the unused visual row.
    widget.setFlagTo(2, true)
  } catch (error) {
    console.warn(`Unable to hide unused PDF field widget "${fieldName}"`, error)
  }
}

function hideMappedTextFieldWidget(form: any, field: TemplateField): void {
  if (!hasPdfFieldNames(field)) return

  field.pdfFieldNames!.forEach(fieldName => {
    if (!fieldName) return
    try {
      const pdfField = form.getField(fieldName)
      if (typeof pdfField.setText !== 'function') return
      const widget = pdfField.acroField.getWidgets()[0]
      widget.setFlagTo(2, true)
    } catch {
      // A conditional field may not exist in every source PDF revision.
    }
  })
}

function createCheckboxXAppearance(_checkBox: any, widget: any) {
  const { width, height } = widget.getRectangle()
  const borderWidth = 1
  const color = rgb(0, 0, 0)
  const background = rgb(1, 1, 1)
  const inset = Math.max(2, Math.min(width, height) * 0.22)

  const drawBox = () => drawRectangle({
    x: borderWidth / 2,
    y: borderWidth / 2,
    width: Math.max(width - borderWidth, 0),
    height: Math.max(height - borderWidth, 0),
    borderWidth,
    color: background,
    borderColor: color,
    rotate: degrees(0),
    xSkew: degrees(0),
    ySkew: degrees(0)
  })

  const drawX = () => [
    ...drawLine({
      start: { x: inset, y: inset },
      end: { x: width - inset, y: height - inset },
      thickness: 1.6,
      color
    }),
    ...drawLine({
      start: { x: inset, y: height - inset },
      end: { x: width - inset, y: inset },
      thickness: 1.6,
      color
    })
  ]

  return {
    normal: {
      on: [...drawBox(), ...drawX()],
      off: drawBox()
    },
    down: {
      on: [...drawBox(), ...drawX()],
      off: drawBox()
    }
  }
}

function renderFieldAtCoordinates(
  page: any,
  template: PdfTemplate,
  field: TemplateField,
  value: any,
  font: PDFFont
): boolean {
  if (!hasPdfCoordinates(field)) {
    return false
  }

  if (field.type === 'checkbox' || field.type === 'radio') {
    if (!isCheckedValue(value)) {
      return false
    }

    renderCheckboxFallbackMark(page, template, field, font)
    return true
  }

  const placement = resolveFieldPlacement(template, field, page)
  const fontSize = field.pdf.fontSize || 10
  const lineHeight = fontSize * 1.2
  const linesToRender = field.type === 'textarea'
    ? splitTextIntoFieldValues(field, value, font).slice(0, field.pdf.maxLines)
    : [
        formatFieldValue(field, value)
      ].filter(Boolean)

  linesToRender.forEach((line, index) => {
    const resolvedFontSize = fitFontSizeToWidth(
      line,
      font,
      fontSize,
      field.pdf.maxWidth
    )

    page.drawText(line, {
      x: placement.x,
      y: placement.y - index * lineHeight,
      size: resolvedFontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: field.pdf.maxWidth
    })
  })

  return linesToRender.length > 0
}

function renderDebugLabel(page: any, template: PdfTemplate, field: TemplateField, font: PDFFont): void {
  if (!template.coordinateConfig?.debugCoordinateLabels) return

  const placement = resolveFieldPlacement(template, field, page)

  page.drawText(field.id, {
    x: placement.x,
    y: placement.y + 8,
    size: 5,
    font,
    color: rgb(1, 0, 0)
  })
}

function renderCheckboxFallbackMark(
  page: any,
  template: PdfTemplate,
  field: TemplateField,
  font: PDFFont
): void {
  const placement = resolveFieldPlacement(template, field, page)

  page.drawText('X', {
    x: placement.x + 4,
    y: placement.y + 3,
    size: 13,
    font,
    color: rgb(0, 0, 0)
  })
}

/**
 * Generate a PDF from template and form data
 * 
 * @param template - The PDF template schema
 * @param formData - The form data to fill in
 * @param pdfBuffer - The base PDF template as ArrayBuffer
 * @returns A Blob of the filled PDF
 */
export async function generatePdfFromTemplate(
  template: PdfTemplate,
  formData: TemplateFormData,
  pdfBuffer: ArrayBuffer
): Promise<Blob> {
  try {
    // Load the PDF template
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    const form = pdfDoc.getForm()
    const availableFieldNames = new Set(
      form
        .getFields()
        .map((pdfField: any) =>
          typeof pdfField.getName === 'function' ? pdfField.getName() : null
        )
        .filter((fieldName: string | null): fieldName is string => Boolean(fieldName))
    )
    const resolvedFormData = deriveTemplateFormData(formData)

    // Get the font to use
    const fontName = template.defaultFont || 'Helvetica'
    const font = await getFont(pdfDoc, fontName)
    
    // Track how many fields were filled
    let fieldsFilled = 0
    const skippedFields: string[] = []
    
    // Process each field in the template
    for (const field of template.fields) {
      // Skip if field should not be included in PDF
      if (field.includeInPdf === false) {
        if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'signature' && field.type !== 'file') {
          hideMappedTextFieldWidget(form, field)
        }
        continue
      }

      if (!shouldRenderField(field, resolvedFormData)) {
        if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'signature' && field.type !== 'file') {
          hideMappedTextFieldWidget(form, field)
        }
        continue
      }
      
      // Get the value from form data
      const value = resolvedFormData[field.id]
      
      // Skip empty values
      if (value === undefined || value === null || value === '') continue
      
      // Skip unchecked checkboxes
      if (
        field.type === 'checkbox' &&
        !isCheckedValue(value)
      ) {
        continue
      }

      try {
        const pageIndex = resolvePageIndex(template, field.pdf.page)
        const page = pageIndex >= 0 && pageIndex < pages.length ? pages[pageIndex] : null

        if (template.coordinateConfig?.debugCoordinateLabels && page) {
          renderDebugLabel(page, template, field, font)
        }

        let filled = false
        const hasMappedPdfField = hasAnyAvailablePdfFieldName(field, availableFieldNames)

        const useCoordinateOnlyRendering = shouldUseCoordinateOnlyRendering(field)

        if (!useCoordinateOnlyRendering && hasPdfFieldNames(field)) {
          filled = fillMappedPdfFields(form, availableFieldNames, field, value, font)
        }

        // Some source widgets are intrinsically too narrow or have a different
        // internal text inset than their neighboring rows. Keep the AcroForm
        // value populated for extraction/tests, but use the calibrated layout
        // for the visible appearance.
        if (shouldRenderCoordinateOverlay(field) && page && filled) {
          hideMappedTextFieldWidget(form, field)
          renderFieldAtCoordinates(page, template, field, value, font)
        }

        if (
          !filled &&
          page &&
          (useCoordinateOnlyRendering || !hasPdfFieldNames(field) || !hasMappedPdfField)
        ) {
          filled = renderFieldAtCoordinates(page, template, field, value, font)
        }

        if (!filled) {
          console.warn(`Unable to render PDF field for ${field.id}`)
          skippedFields.push(field.id)
          continue
        }

        fieldsFilled++
      } catch (error) {
        console.error(`Error filling field ${field.id}:`, error)
        skippedFields.push(field.id)
      }
    }

    form.updateFieldAppearances(font)
    
    if (skippedFields.length > 0) {
      console.warn(`PDF generation skipped ${skippedFields.length} field(s) after filling ${fieldsFilled}`)
    }
    if (skippedFields.length > 0 && skippedFields.length < 10) {
      console.warn('Skipped fields:', skippedFields.join(', '))
    }
    
    // Save and return the PDF
    const pdfBytes = await pdfDoc.save()
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  } catch (error) {
    console.error('Error generating PDF from template:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate a PDF from template using a URL to fetch the template
 */
export async function generatePdfFromTemplateUrl(
  template: PdfTemplate,
  formData: TemplateFormData,
  templateUrl: string
): Promise<Blob> {
  try {
    // Fetch the PDF template
    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF template: ${response.statusText}`)
    }
    
    const pdfBuffer = await response.arrayBuffer()
    return await generatePdfFromTemplate(template, formData, pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF from URL:', error)
    throw error
  }
}

/**
 * Preview field positions on a PDF (draws outlines around field areas)
 * Useful for debugging and calibration
 */
export async function previewFieldPositions(
  template: PdfTemplate,
  pdfBuffer: ArrayBuffer
): Promise<Blob> {

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    const font = await getFont(pdfDoc, 'Helvetica')
    
    // Draw rectangles around each field position
    for (const field of template.fields) {
      if (!hasPdfCoordinates(field)) {
        console.warn(`Missing coordinates for ${field.id}`)
        continue
      }

      const pageIndex = resolvePageIndex(template, field.pdf.page)
      if (pageIndex < 0 || pageIndex >= pages.length) continue

      const page = pages[pageIndex]
      const { maxWidth, fontSize } = field.pdf
      const placement = resolveFieldPlacement(template, field, page)
      
      // Draw a semi-transparent rectangle
      page.drawRectangle({
        x: placement.x - 2,
        y: placement.y - (fontSize || 10) + 2,
        width: (maxWidth || 150) + 4,
        height: (fontSize || 10) * 1.5,
        borderColor: rgb(1, 0, 0), // Red border
        borderWidth: 1,
        color: rgb(1, 0.9, 0.9) // Light pink fill
      })

      page.drawLine({
        start: { x: placement.x - 5, y: placement.y },
        end: { x: placement.x + 5, y: placement.y },
        thickness: 1,
        color: rgb(1, 0, 0)
        })

        page.drawLine({
        start: { x: placement.x, y: placement.y - 5 },
        end: { x: placement.x, y: placement.y + 5 },
        thickness: 1,
        color: rgb(1, 0, 0)
        })
      
      // Draw field ID label
        page.drawText(`${field.id} (p${field.pdf.page})`, {
        x: placement.x,
        y: placement.y + 10,
        size: 5,
        font,
        color: rgb(1, 0, 0),
        })
    }
    
    const pdfBytes = await pdfDoc.save()
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  } catch (error) {
    console.error('Error creating field preview:', error)
    throw error
  }
}

/**
 * Export template schema as JSON for storage or sharing
 */
export function exportTemplateAsJson(template: PdfTemplate): string {
  return JSON.stringify(template, null, 2)
}

/**
 * Import template schema from JSON
 */
export function importTemplateFromJson(json: string): PdfTemplate {
  try {
    return JSON.parse(json) as PdfTemplate
  } catch (error) {
    throw new Error('Invalid template JSON')
  }
}

/**
 * Validate that all fields in a template have valid coordinates
 */
export function validateTemplateCoordinates(template: PdfTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const field of template.fields) {
    // Check required coordinate properties
    if (field.pdf.x === undefined || field.pdf.x < 0) {
      errors.push(`Field "${field.id}": Invalid X coordinate`)
    }
    if (field.pdf.y === undefined || field.pdf.y < 0) {
      errors.push(`Field "${field.id}": Invalid Y coordinate`)
    }
    if (field.pdf.page === undefined || field.pdf.page < 0) {
      errors.push(`Field "${field.id}": Invalid page number`)
    }
    
    // Warn about potentially problematic values
    if (field.pdf.fontSize !== undefined && (field.pdf.fontSize < 6 || field.pdf.fontSize > 24)) {
      console.warn(`Field "${field.id}": Unusual font size ${field.pdf.fontSize}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
