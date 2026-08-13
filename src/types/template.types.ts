/**
 * PDF Template Mapping System Types
 * 
 * This architecture separates form field definitions from PDF coordinates,
 * allowing dynamic form generation and PDF rendering from a single schema.
 */

/** Field types supported by the form system */
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'email'
  | 'tel'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'signature'
  | 'file'

/** PDF coordinate system for field placement */
export interface PdfCoordinate {
  /** Page number (0-indexed) */
  page: number
  /** X coordinate in PDF points (1/72 inch) from left edge */
  x: number
  /** Y coordinate in PDF points (1/72 inch) from bottom edge */
  y: number
  /** Font size in points */
  fontSize?: number
  /** Maximum width for text wrapping */
  maxWidth?: number
  /** Maximum number of lines for text areas */
  maxLines?: number
}

export type PdfCoordinateOrigin = 'pdf-bottom-left' | 'ui-top-left'

/** Validation rules for form fields */
export interface FieldValidation {
  required?: boolean | string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  validate?: (value: any) => boolean | string
}

/** Radio/Select option */
export interface FieldOption {
  label: string
  value: string | number | boolean
}

/** Individual field definition in the template schema */
export interface TemplateField {
  /** Unique field identifier (used as form field name) */
  id: string
  /** Human-readable label for the form */
  label: string
  /** Field type determines input rendering */
  type: FieldType
  /** Help text or placeholder */
  description?: string
  /** Placeholder text for inputs */
  placeholder?: string
  /** Default value */
  defaultValue?: any
  /** Validation rules */
  validation?: FieldValidation
  /** Options for radio/select fields */
  options?: FieldOption[]
  /** Fillable PDF field names to populate before any coordinate fallback */
  pdfFieldNames?: string[]
  /** Keep the mapped value, but redraw it over the source widget at calibrated coordinates. */
  pdfCoordinateOverlay?: boolean
  /** PDF placement coordinates */
  pdf: PdfCoordinate
  /** Conditional rendering - show field only when condition is met */
  conditional?: {
    /** Field ID to check */
    fieldId: string
    /** Multiple field ids where any matching value should show the field */
    anyOfFieldIds?: string[]
    /** Any matching values for the checked field should show the field */
    anyOfValues?: any[]
    /** Value that triggers showing this field */
    equals?: any
    /** Or not equals */
    notEquals?: any
  }
  /** Section/category for grouping in form UI */
  section?: string
  /** Width of field in form layout (1-12 grid) */
  width?: number
  /** Whether this field should be included in PDF generation */
  includeInPdf?: boolean
  /** Whether this field should be shown in the form UI */
  includeInForm?: boolean
}

/** Template section for organizing fields */
export interface TemplateSection {
  id: string
  title: string
  description?: string
  fields: TemplateField[]
}

/** Complete PDF template schema */
export interface PdfTemplate {
  /** Unique template identifier */
  id: string
  /** Human-readable template name */
  name: string
  /** Template version for migration purposes */
  version: string
  /** Description of what this template is for */
  description?: string
  /** Path to the PDF template file */
  pdfPath: string
  /** Default font to use for PDF rendering */
  defaultFont?: 'Helvetica' | 'TimesRoman' | 'Courier' | 'Symbol' | 'ZapfDingbats'
  /** Page size of the PDF template */
  pageSize?: {
    width: number
    height: number
  }
  /** Coordinate normalization settings for the source mapping */
  coordinateConfig?: {
    /** Whether `page` values are zero-based pdf-lib indexes or human page numbers */
    pageNumberBase?: 0 | 1
    /** Whether Y coordinates are already in PDF space or still in UI top-left space */
    coordinateOrigin?: PdfCoordinateOrigin
    /** Draw field ids above rendered values for calibration/debugging */
    debugCoordinateLabels?: boolean
  }
  /** All fields in the template (flat list) */
  fields: TemplateField[]
  /** Organized sections for better UX */
  sections?: TemplateSection[]
  /** Template metadata */
  metadata?: {
    createdAt: string
    updatedAt: string
    createdBy?: string
    tags?: string[]
  }
}

/** Form data generated from a template */
export type TemplateFormData = Record<string, any>

/** Template submission record */
export interface TemplateSubmission {
  id: string
  templateId: string
  templateVersion: string
  formData: TemplateFormData
  generatedPdfUrl?: string
  submittedAt: string
  submittedBy?: string
}

/** Coordinate conversion utilities */
export interface CoordinateTransform {
  /** Convert UI coordinates (top-left origin) to PDF coordinates (bottom-left origin) */
  uiToPdf: (uiX: number, uiY: number, pageHeight: number) => { x: number; y: number }
  /** Convert PDF coordinates to UI coordinates */
  pdfToUi: (pdfX: number, pdfY: number, pageHeight: number) => { x: number; y: number }
}

/** Field mapper state for the visual editor */
export interface FieldMapperState {
  /** Currently selected template */
  template: PdfTemplate | null
  /** Fields being edited */
  selectedField: TemplateField | null
  /** Current page being viewed */
  currentPage: number
  /** Zoom level */
  zoom: number
  /** Whether we're in edit mode */
  isEditMode: boolean
  /** Temporary fields being created */
  draftFields: TemplateField[]
}
