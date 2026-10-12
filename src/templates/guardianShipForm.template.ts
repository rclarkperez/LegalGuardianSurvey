/**
 * Guardian Ship Form Template Schema
 * 
 * This template defines the field mapping for the GuardianShipForm.pdf
 * All coordinates are calibrated for the specific PDF layout.
 */

import type { PdfTemplate, TemplateField } from '../types/template.types'

const supplementalSectionByPage: Record<number, string> = {
  8: 'Conservator Balance Sheet',
  9: 'Conservator Balance Sheet',
  10: 'Conservator Balance Sheet',
  11: 'Conservator Estate Information',
  12: 'Conservator Explanations & Plan',
  13: 'Conservator Proposed Budget',
  14: 'Verification'
}

function slugifySupplementalFieldName(value: string, index: number): string {
  const base = value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .map((part, partIndex) =>
      partIndex === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join('')

  return `${base || 'supplementalField'}${index + 1}`
}

function humanizeSupplementalFieldName(value: string): string {
  return value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

type SupplementalFieldOverride = {
  id?: string
  label?: string
  type?: TemplateField['type']
  inputFormat?: TemplateField['inputFormat']
  validation?: TemplateField['validation']
  includeInForm?: boolean
  includeInPdf?: boolean
  pdfFieldNames?: string[]
  pdfCoordinateOverlay?: boolean
  section?: string
  conditional?: TemplateField['conditional']
  pdf?: Partial<TemplateField['pdf']>
  width?: number
  fontSize?: number
}

const SUPPLEMENTAL_FIELD_OVERRIDES: Record<string, SupplementalFieldOverride> = {
  '8|Date': {
    id: 'balanceSheetStartDate',
    label: 'What date does this balance sheet start?'
  },
  '8|Date_2': {
    id: 'balanceSheetEndDate',
    label: 'What date does this balance sheet end?'
  },
  '8|1_6': {
    id: 'realPropertyItem1',
    label: 'What personal property item should be listed first?',
    conditional: { fieldId: 'hasRealPropertyAssets', equals: 'yes' }
  },
  '8|2_6': {
    id: 'realPropertyItem2',
    label: 'What personal property item should be listed second?'
  },
  '8|3_5': {
    id: 'realPropertyItem3',
    label: 'What personal property item should be listed third?'
  },
  '8|1   2   3': {
    id: 'realPropertyOtherValue',
    label: 'Total personal property value ($)',
    includeInForm: false,
    includeInPdf: false
  },
  '8|undefined_19': {
    id: 'receivableItem1',
    label: 'What is the name of receivable item 1?',
    conditional: { fieldId: 'hasReceivables', equals: 'yes' }
  },
  '8|undefined_20': {
    id: 'receivableItem2',
    label: 'What is the name of receivable item 2?'
  },
  '8|1   2': {
    id: 'receivableOtherValue',
    label: 'Total receivables value ($)',
    includeInForm: false,
    includeInPdf: false
  },
  '9|3_6': {
    id: 'receivableItem3',
    label: 'What is the name of receivable item 3?',
    pdfFieldNames: [],
    includeInPdf: true,
    pdf: { page: 9, x: 84.24, y: 711.24, fontSize: 10, maxWidth: 122.88 }
  },
  '9|Account No last 4 digits': {
    label: 'What are the last 4 digits for the interest checking account?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|undefined_21': {
    id: 'undefined_21',
    label: 'What was the interest checking account value at the start of accounting?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|undefined_22': {
    id: 'undefined_22',
    label: 'What was the interest checking account value at the end of accounting?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|Balance as of': {
    label: 'What date is the interest checking account balance dated?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|Account No last 4 digits_2': {
    label: 'What are the last 4 digits for the savings account?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|undefined_23': {
    id: 'undefined_23',
    label: 'What was the savings account value at the start of accounting?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|undefined_24': {
    id: 'undefined_24',
    label: 'What was the savings account value at the end of accounting?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|Balance as of_2': {
    label: 'What date is the savings account balance dated?',
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
  },
  '9|Account No last 4 digits_3': {
    label: 'What are the last 4 digits for this unblocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|Interest Rate': {
    label: 'What is the interest rate for this unblocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|Maturity Date': {
    label: 'What is the maturity date for this unblocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|undefined_25': {
    id: 'undefined_25',
    label: 'What was this unblocked certificate of deposit value at the start of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|undefined_26': {
    id: 'undefined_26',
    label: 'What was this unblocked certificate of deposit value at the end of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|Balance as of_3': {
    label: 'What date is this unblocked certificate of deposit balance dated?',
    conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
  },
  '9|undefined_27': {
    id: 'undefined_27',
    label: 'Total unblocked liquid assets at start of accounting ($)',
    includeInForm: false,
    pdfFieldNames: ['undefined_27']
  },
  '9|undefined_28': {
    id: 'undefined_28',
    label: 'Total unblocked liquid assets at end of accounting ($)',
    includeInForm: false,
    pdfFieldNames: ['undefined_28']
  },
  '9|Account No last 4 digits_4': {
    label: 'What are the last 4 digits for the first blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '9|Interest Rate_2': {
    label: 'What is the interest rate for the first blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '9|Maturity Date_2': {
    label: 'What is the maturity date for the first blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '9|undefined_29': {
    id: 'undefined_29',
    label: 'What was the first blocked certificate of deposit value at the start of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '9|undefined_30': {
    id: 'undefined_30',
    label: 'What was the first blocked certificate of deposit value at the end of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '9|Balance as of_4': {
    label: 'What date is the first blocked certificate of deposit balance dated?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '10|hasAdditionalBlockedAccountUnderInstitution1': {
    label: 'Do you have another blocked account at this same institution?',
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
  },
  '11|undefined_55': {
    id: 'estateBeginningBalanceSummary',
    label: 'Total estate value at the beginning of the accounting period (line 31a)',
    includeInForm: false,
    pdfFieldNames: ['undefined_55']
  },
  '11|undefined_56': {
    id: 'estateReceiptsTotalSummary',
    label: 'Total receipts during the accounting period (line 31b)',
    includeInForm: false,
    pdfFieldNames: ['undefined_56']
  },
  '11|Social Security SSA': { label: 'Social Security / SSA row label', includeInForm: false, includeInPdf: false },
  '11|SSI': { label: 'SSI row label', includeInForm: false, includeInPdf: false },
  '11|VARailroadCSA Pension': {
    label: 'VA / Railroad / CSA Pension row label',
    includeInForm: false,
    includeInPdf: false
  },
  '11|Retirement Pension': { label: 'Retirement / pension row label', includeInForm: false, includeInPdf: false },
  '11|Wages': { label: 'Wages row label', includeInForm: false, includeInPdf: false },
  '11|Interest and Dividends': {
    label: 'Interest and dividends row label',
    includeInForm: false,
    includeInPdf: false
  },
  '11|fill_10': { id: 'fill_10', label: 'Social Security / SSA Amount' },
  '11|fill_12': { id: 'fill_12', label: 'SSI Amount' },
  '11|fill_14': { id: 'fill_14', label: 'VA / Railroad / CSA Pension Amount' },
  '11|fill_16': { id: 'fill_16', label: 'Retirement / Pension Amount' },
  '11|fill_18': { id: 'fill_18', label: 'Wages Amount' },
  '11|fill_20': { id: 'fill_20', label: 'Interest / Dividends Amount' },
  '11|Other_2': {
    label: 'Describe the other estate income source',
    conditional: { fieldId: 'hasOtherEstateIncome', equals: 'yes' }
  },
  '11|fill_22': {
    id: 'fill_22',
    label: 'Amount for the other estate income source',
    conditional: { fieldId: 'hasOtherEstateIncome', equals: 'yes' }
  },
  '11|undefined_57': {
    id: 'estateDisbursementsTotalSummary',
    label: 'Total disbursements during the accounting period (line 31c)',
    includeInForm: false,
    pdfFieldNames: ['undefined_57']
  },
  '11|Personal Funds': { label: 'Personal funds row label', includeInForm: false, includeInPdf: false },
  '11|Entertainment  Travel': {
    label: 'Entertainment / travel row label',
    includeInForm: false,
    includeInPdf: false
  },
  '11|fill_24': { id: 'fill_24', label: 'Personal Funds Amount' },
  '11|fill_26': { id: 'fill_26', label: 'Entertainment / Travel Amount' },
  '11|fill_28': { id: 'fill_28', label: 'Medical / Dental Amount' },
  '11|fill_29': { id: 'fill_29', label: "Conservator's Fees Amount" },
  '11|Medical and Dental': {
    label: 'Medical and dental row label',
    includeInForm: false,
    includeInPdf: false
  },
  '11|fill_31': {
    id: 'fill_31',
    label: 'Additional Expense Amount 1',
    conditional: { fieldId: 'hasOtherEstateExpense', equals: 'yes' }
  },
  '11|Conservator Fees if allowed': {
    label: "Conservator fees row label",
    includeInForm: false,
    includeInPdf: false
  },
  '11|fill_33': {
    id: 'fill_33',
    label: 'Additional Expense Amount 2',
    conditional: { fieldId: 'hasOtherEstateExpense', equals: 'yes' }
  },
  '11|fill_35': {
    id: 'fill_35',
    label: 'Additional Expense Amount 3',
    conditional: { fieldId: 'hasOtherEstateExpense', equals: 'yes' }
  },
  '11|Other_3': {
    label: 'Describe the other estate expense',
    conditional: { fieldId: 'hasOtherEstateExpense', equals: 'yes' }
  },
  '11|fill_37': {
    id: 'fill_37',
    label: 'Amount for the other estate expense',
    conditional: { fieldId: 'hasOtherEstateExpense', equals: 'yes' }
  },
  '11|undefined_58': {
    id: 'estateAdjustmentsTotalSummary',
    label: 'Adjustments to the market value of the estate (line 31d)',
    includeInForm: false,
    pdfFieldNames: ['undefined_58']
  },
  '11|undefined_59': {
    id: 'estateEndingMarketValueSummary',
    label: 'Ending market value at the close of the accounting period (line 31e)',
    type: 'number',
    includeInForm: false,
    pdfFieldNames: ['undefined_59']
  },
  '11|undefined_60': {
    id: 'undefined_60',
    label: 'What is the estimated ending market value of the estate?',
    type: 'number',
    conditional: { fieldId: 'conservatorshipScope', notEquals: 'none' },
    pdfFieldNames: ['undefined_60']
  },
  '12|undefined_61': {
    id: 'estateWorksheetLine31b',
    label: 'Worksheet carry-forward for line 31b',
    includeInForm: false,
    pdfFieldNames: ['undefined_61']
  },
  '12|undefined_62': {
    id: 'estateWorksheetAfterReceipts',
    label: 'Worksheet subtotal after adding lines 31a and 31b',
    includeInForm: false,
    pdfFieldNames: ['undefined_62']
  },
  '12|undefined_63': {
    id: 'estateWorksheetLine31c',
    label: 'Worksheet carry-forward for line 31c',
    includeInForm: false,
    pdfFieldNames: ['undefined_63']
  },
  '12|plus or minus amount in line 31d': {
    id: 'estateWorksheetAfterDisbursements',
    label: 'Worksheet subtotal after subtracting line 31c',
    includeInForm: false,
    pdfFieldNames: ['plus or minus amount in line 31d']
  },
  '12|Should equal 31e': {
    id: 'estateWorksheetLine31d',
    label: 'Worksheet carry-forward for line 31d',
    includeInForm: false,
    pdfFieldNames: ['Should equal 31e']
  },
  '12|If the last line does not equal line 31e your account does not balance The account': {
    id: 'estateCalculatedEndingBalance',
    label: 'Calculated ending balance should equal line 31e',
    includeInForm: false
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 1': {
    label: 'Describe a large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasLargeExpenditureExplanation1', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 2': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation2', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 3': {
    label: 'Describe one more large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation3', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 4': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation4', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 5': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation5', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 6': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation6', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 7': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation7', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 8': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation8', equals: 'yes' }
  },
  '12|Explain any large or unusual expenditures adjustments or purchases 9': {
    label: 'Describe another large or unusual expenditure, adjustment, or purchase',
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation9', equals: 'yes' }
  },
  '12|the protected person receives the following services 1': {
    label: 'Describe a service or support the protected person receives',
    conditional: { fieldId: 'hasServicesReceived1', equals: 'yes' }
  },
  '12|the protected person receives the following services 2': {
    label: 'Describe another service or support the protected person receives',
    conditional: { fieldId: 'hasAdditionalServicesReceived2', equals: 'yes' }
  },
  '12|undefined_64': {
    label: 'Describe one more service or support the protected person receives',
    pdfCoordinateOverlay: true,
    pdf: { y: 284.2, fontSize: 9, maxWidth: 423.12 },
    conditional: { fieldId: 'hasAdditionalServicesReceived3', equals: 'yes' }
  },
  '12|Recommended changes in scope of the conservators authority': {
    id: 'conservatorScopeChangeDetailsSource',
    label: 'Describe the recommended change in scope of authority',
    includeInPdf: false,
    conditional: { fieldId: 'conservatorScopeChangeRecommended', equals: 'yes' }
  },
  '12|changed as follows 1_2': {
    id: 'conservatorScopeChangeDetails1',
    label: 'Describe the first recommended change to the conservator plan',
    includeInForm: false,
    conditional: { fieldId: 'conservatorScopeChangeRecommended', equals: 'yes' }
  },
  '12|changed as follows 2_2': {
    id: 'conservatorScopeChangeDetails2',
    label: 'Describe the second recommended change to the conservator plan',
    conditional: { fieldId: 'hasAdditionalScopeChangeDetail3', equals: 'yes' }
  },
  '12|undefined_65': {
    id: 'conservatorScopeChangeDetails3',
    label: 'Describe one more recommended change in scope of authority',
    conditional: { fieldId: 'hasAdditionalScopeChangeDetail4', equals: 'yes' }
  },
  '10|Account No last 4 digits_5': {
    label: 'What are the last 4 digits for another blocked certificate of deposit at this institution?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|Interest Rate_3': {
    label: 'What is the interest rate for this additional blocked certificate of deposit?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|Maturity Date_3': {
    label: 'What is the maturity date for this additional blocked certificate of deposit?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|undefined_31': {
    id: 'undefined_31',
    label: 'What was this additional blocked certificate of deposit value at the start of accounting?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|undefined_32': {
    id: 'undefined_32',
    label: 'What was this additional blocked certificate of deposit value at the end of accounting?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|Balance as of_5': {
    label: 'What date is this additional blocked certificate of deposit balance dated?',
    conditional: { fieldId: 'hasAdditionalBlockedAccountUnderInstitution1', equals: 'yes' }
  },
  '10|Account No last 4 digits_6': {
    label: 'What are the last 4 digits for the third blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|Interest Rate_4': {
    label: 'What is the interest rate for the third blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|Maturity Date_4': {
    label: 'What is the maturity date for the third blocked certificate of deposit?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|undefined_33': {
    id: 'undefined_33',
    label: 'What was the third blocked certificate of deposit value at the start of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|undefined_34': {
    id: 'undefined_34',
    label: 'What was the third blocked certificate of deposit value at the end of accounting?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|Balance as of_6': {
    label: 'What date is the third blocked certificate of deposit balance dated?',
    conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
  },
  '10|undefined_35': {
    id: 'undefined_35',
    label: 'Total blocked liquid assets at start of accounting ($)',
    includeInForm: false,
    pdfFieldNames: ['undefined_35']
  },
  '10|undefined_36': {
    id: 'undefined_36',
    label: 'Total blocked liquid assets at end of accounting ($)',
    includeInForm: false,
    pdfFieldNames: ['undefined_36']
  },
  '10|1_7': {
    id: 'liquidAssetItem1',
    label: 'Describe personal or other property item 1',
    fontSize: 9,
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|undefined_37': {
    id: 'undefined_37',
    label: 'Item 1 value at start of accounting',
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|undefined_38': {
    id: 'undefined_38',
    label: 'Item 1 value at end of accounting',
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|2_7': {
    id: 'liquidAssetItem2',
    label: 'Describe personal or other property item 2',
    fontSize: 9,
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|undefined_39': {
    id: 'undefined_39',
    label: 'Item 2 value at start of accounting',
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|undefined_40': {
    id: 'undefined_40',
    label: 'Item 2 value at end of accounting',
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' }
  },
  '10|undefined_41': { id: 'undefined_41', label: 'Total assets at start of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_41'] },
  '10|undefined_42': { id: 'undefined_42', label: 'Total assets at end of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_42'] },
  '10|1_8': {
    label: 'Liability 1 description',
    fontSize: 5,
    conditional: { fieldId: 'hasAdditionalBalanceSheetDetails', equals: 'yes' }
  },
  '10|undefined_43': {
    id: 'undefined_43',
    label: 'Liability 1 value at start of accounting',
    conditional: { fieldId: 'hasAdditionalBalanceSheetDetails', equals: 'yes' }
  },
  '10|undefined_44': {
    id: 'undefined_44',
    label: 'Liability 1 value at end of accounting',
    conditional: { fieldId: 'hasAdditionalBalanceSheetDetails', equals: 'yes' }
  },
  '10|2_8': {
    label: 'Liability 2 description',
    fontSize: 5,
    conditional: { fieldId: 'showLiabilityItem2', equals: true }
  },
  '10|undefined_45': {
    id: 'undefined_45',
    label: 'Liability 2 value at start of accounting',
    conditional: { fieldId: 'showLiabilityItem2', equals: true }
  },
  '10|undefined_46': {
    id: 'undefined_46',
    label: 'Liability 2 value at end of accounting',
    conditional: { fieldId: 'showLiabilityItem2', equals: true }
  },
  '10|3_7': {
    label: 'Liability 3 description',
    fontSize: 5,
    conditional: { fieldId: 'showLiabilityItem3', equals: true }
  },
  '10|undefined_47': {
    id: 'undefined_47',
    label: 'Liability 3 value at start of accounting',
    conditional: { fieldId: 'showLiabilityItem3', equals: true }
  },
  '10|undefined_48': {
    id: 'undefined_48',
    label: 'Liability 3 value at end of accounting',
    conditional: { fieldId: 'showLiabilityItem3', equals: true }
  },
  '10|Loan': {
    label: 'Liability 4 loan number or short description',
    pdfCoordinateOverlay: true,
    pdf: { x: 108.72, y: 220.2, fontSize: 4.5, maxWidth: 90 },
    conditional: { fieldId: 'showLiabilityItem4', equals: true }
  },
  '10|undefined_49': {
    id: 'undefined_49',
    label: 'Liability 4 value at start of accounting',
    conditional: { fieldId: 'showLiabilityItem4', equals: true }
  },
  '10|undefined_50': {
    id: 'undefined_50',
    label: 'Liability 4 value at end of accounting',
    conditional: { fieldId: 'showLiabilityItem4', equals: true }
  },
  '10|undefined_51': { id: 'undefined_51', label: 'Total liabilities at start of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_51'] },
  '10|undefined_52': { id: 'undefined_52', label: 'Total liabilities at end of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_52'] },
  '10|undefined_53': { id: 'undefined_53', label: 'Total estate at start of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_53'] },
  '10|undefined_54': { id: 'undefined_54', label: 'Total estate at end of accounting ($)', includeInForm: false, pdfFieldNames: ['undefined_54'] },
  '10|For Accounting Period starting date': {
    id: 'estateInfoStartDate',
    label: 'What is the start date for the estate-information accounting period?',
    section: 'Conservator Estate Information'
  },
  '10|and ending date': {
    id: 'estateInfoEndDate',
    label: 'What is the end date for the estate-information accounting period?',
    section: 'Conservator Estate Information'
  },
  '13|1_9': {
    id: 'conservatorPlanDetail1',
    label: 'Describe one way the conservator deviated from the approved plan',
    section: 'Conservator Explanations & Plan',
    conditional: { fieldId: 'conservatorPlanDeviated', equals: 'yes' }
  },
  '13|2_9': {
    id: 'conservatorPlanDetail2',
    label: 'Describe another way the conservator deviated from the approved plan',
    section: 'Conservator Explanations & Plan',
    conditional: { fieldId: 'hasAdditionalConservatorPlanDetail2', equals: 'yes' }
  },
  '13|3_8': {
    id: 'conservatorPlanDetail3',
    label: 'Describe a third way the conservator deviated from the approved plan',
    section: 'Conservator Explanations & Plan',
    conditional: { fieldId: 'hasAdditionalConservatorPlanDetail3', equals: 'yes' }
  },
  '13|undefined_66': {
    id: 'conservatorPlanDetail4',
    label: 'Describe a fourth way the conservator deviated from the approved plan',
    section: 'Conservator Explanations & Plan',
    conditional: { fieldId: 'hasAdditionalConservatorPlanDetail4', equals: 'yes' }
  },
  '13|undefined_67': { id: 'undefined_67', label: 'Current monthly room and board amount' },
  '13|undefined_68': { id: 'undefined_68', label: 'What monthly room and board amount are you proposing? (If none, put N/A)' },
  '13|fill_33_2': {
    id: 'budgetRoomBoardComments',
    label: 'Comments for room and board (If none, put N/A)'
  },
  '13|undefined_69': { id: 'undefined_69', label: 'Current monthly personal and incidental allowance amount' },
  '13|undefined_70': { id: 'undefined_70', label: 'What monthly personal and incidental allowance amount are you proposing? (If none, put N/A)' },
  '13|fill_34': { id: 'fill_34', label: 'Comments for personal and incidental allowance (If none, put N/A)' },
  '13|MedicalDental Insurance': {
    label: 'Medical / dental insurance row label',
    includeInForm: false,
    includeInPdf: false
  },
  '13|undefined_71': { id: 'undefined_71', label: 'Current monthly medical or dental insurance amount' },
  '13|undefined_72': {
    id: 'undefined_72',
    label: 'What monthly medical or dental insurance amount are you proposing? (If none, put N/A)',
    width: 6
  },
  '13|fill_35_2': {
    id: 'budgetMedicalDentalComments',
    label: 'Comments for medical or dental insurance (If none, put N/A)',
    width: 6
  },
  '13|undefined_73': {
    id: 'undefined_73',
    label: 'Current monthly amount for the first "other" budget item',
    conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' }
  },
  '13|undefined_74': {
    id: 'undefined_74',
    label: 'What monthly amount are you proposing for the first "other" budget item?',
    conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' }
  },
  '13|fill_36': {
    id: 'fill_36',
    label: 'Comments for the first "other" budget item (If none, put N/A)',
    conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' }
  },
  '13|undefined_75': {
    id: 'undefined_75',
    label: 'Current monthly amount for the second "other" budget item',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' }
  },
  '13|undefined_76': {
    id: 'undefined_76',
    label: 'What monthly amount are you proposing for the second "other" budget item?',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' }
  },
  '13|fill_37_2': {
    id: 'budgetOtherItem2Comments',
    label: 'Comments for the second "other" budget item (If none, put N/A)',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' }
  },
  '13|undefined_77': {
    id: 'undefined_77',
    label: 'Current monthly amount for the third "other" budget item',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem3', equals: 'yes' }
  },
  '13|undefined_78': {
    id: 'undefined_78',
    label: 'What monthly amount are you proposing for the third "other" budget item?',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem3', equals: 'yes' }
  },
  '13|fill_38': {
    id: 'fill_38',
    label: 'Comments for the third "other" budget item (If none, put N/A)',
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem3', equals: 'yes' }
  },
  '13|Conservators Allowance': {
    label: "Conservator's Allowance",
    includeInForm: false,
    includeInPdf: false
  },
  '13|undefined_79': { id: 'undefined_79', label: "Current monthly conservator's allowance amount" },
  '13|undefined_80': { id: 'undefined_80', label: "What monthly conservator's allowance amount are you proposing?" },
  '13|fill_39': { id: 'fill_39', label: "Comments for the conservator's allowance (If none, put N/A)" },
  '13|undefined_81': { id: 'undefined_81', label: 'Total current monthly expenditures ($)', includeInForm: false },
  '13|fill_45': { id: 'fill_45', label: 'Total proposed annual expenditures helper', includeInForm: false, includeInPdf: false },
  '13|undefined_82': { id: 'undefined_82', label: 'Total proposed monthly expenditures ($)', includeInForm: false },
  '13|undefined_83': { id: 'undefined_83', label: 'Total proposed annual expenditures ($)', includeInForm: false },
  '14|Other 1': {
    label: 'What is the additional requested order?',
    conditional: { fieldId: 'hasAdditionalRequestedOrder2', anyOfValues: ['1', '2'] }
  },
  '14|Other 2': {
    label: 'What is the second additional requested order?',
    conditional: { fieldId: 'hasAdditionalRequestedOrder2', equals: '2' }
  },
  '14|Other 3': {
    label: 'What is the third other requested order?',
    includeInForm: false
  },
  '14|I declare under penalty of perjury under the laws of the State of Washington that the statements': {
    id: 'verificationDated',
    label: 'Dated',
    type: 'date',
    width: 6
  },
  '14|state': { id: 'verificationSignedCity', label: 'Signed At City', width: 6 },
  '14|on date': { id: 'verificationSignedState', label: 'Signed At State', type: 'select', width: 3 },
  '14|undefined_84': { id: 'verificationSignedDate', label: 'Signed On Date', type: 'date', width: 3 },
  '14|  WSBA   CPG': { label: 'License or Certification Number' }
}

const BALANCE_SHEET_INSTITUTION_1_FIELDS = new Set([
  'Financial Institution',
  'Address',
  'Address_2',
  'City WA Zip',
  'Account No last 4 digits',
  'undefined_21',
  'undefined_22',
  'Balance as of',
  'Account No last 4 digits_2',
  'undefined_23',
  'undefined_24',
  'Balance as of_2'
])

const BALANCE_SHEET_INSTITUTION_2_FIELDS = new Set([
  'Financial Institution_2',
  'Address_3',
  'Address_4',
  'City WA Zip_2',
  'Account No last 4 digits_3',
  'Interest Rate',
  'Maturity Date',
  'undefined_25',
  'undefined_26',
  'Balance as of_3'
])

const BALANCE_SHEET_INSTITUTION_3_FIELDS = new Set([
  'Financial Institution_3',
  'Address_5',
  'Address_6',
  'City WA Zip_3',
  'Account No last 4 digits_4',
  'Interest Rate_2',
  'Maturity Date_2',
  'undefined_29',
  'undefined_30',
  'Balance as of_4'
])

const BALANCE_SHEET_INSTITUTION_4_FIELDS = new Set([
  'Account No last 4 digits_5',
  'Interest Rate_3',
  'Maturity Date_3',
  'undefined_31',
  'undefined_32',
  'Balance as of_5',
  'Financial Institution_4',
  'Address_7',
  'Address_8',
  'City WA Zip_4',
  'Account No last 4 digits_6',
  'Interest Rate_4',
  'Maturity Date_4',
  'undefined_33',
  'undefined_34',
  'Balance as of_6'
])

const SUPPLEMENTAL_BALANCE_SHEET_DETAIL_FIELDS = new Set([
  '1_8',
  '2_8',
  '3_7',
  'undefined_43',
  'undefined_44',
  'undefined_45',
  'undefined_46',
  'undefined_47',
  'undefined_48'
])

const SUPPLEMENTAL_LABEL_FAMILIES: Array<[RegExp, string]> = [
  [/^Financial Institution(?:_(\d+))?$/, 'Financial Institution'],
  [/^Address(?:_(\d+))?$/, 'Address'],
  [/^City WA Zip(?:_(\d+))?$/, 'City, State, Zip'],
  [/^Account No last 4 digits(?:_(\d+))?$/, 'Account Number (Last 4 Digits)'],
  [/^Balance as of(?:_(\d+))?$/, 'Balance as of Date'],
  [/^Interest Rate(?:_(\d+))?$/, 'Interest Rate'],
  [/^Maturity Date(?:_(\d+))?$/, 'Maturity Date'],
  [/^Date(?:_(\d+))?$/, 'Date'],
  [/^Other_(\d+)$/, 'Other'],
  [/^fill_(\d+)(?:_(\d+))?$/, 'Amount'],
  [/^undefined_(\d+)$/, 'Additional Detail'],
  [/^(\d+)_(\d+)$/, 'Additional Entry'],
  [/^(\d+\s+\d+(?:\s+\d+)*)$/, 'Additional Entry']
]

function getSupplementalLabelContext(pageNumber: number): {
  detailLabel: string
  entryLabel: string
  amountLabel: string
} {
  switch (pageNumber) {
    case 8:
    case 9:
    case 10:
      return {
        detailLabel: 'Balance Sheet Detail',
        entryLabel: 'Balance Sheet Entry',
        amountLabel: 'Balance Sheet Amount'
      }
    case 11:
      return {
        detailLabel: 'Estate Information Detail',
        entryLabel: 'Estate Information Entry',
        amountLabel: 'Estate Information Amount'
      }
    case 12:
      return {
        detailLabel: 'Explanation Detail',
        entryLabel: 'Explanation Entry',
        amountLabel: 'Explanation Amount'
      }
    case 13:
      return {
        detailLabel: 'Budget Detail',
        entryLabel: 'Budget Entry',
        amountLabel: 'Budget Amount'
      }
    case 14:
      return {
        detailLabel: 'Verification Detail',
        entryLabel: 'Verification Entry',
        amountLabel: 'Verification Amount'
      }
    default:
      return {
        detailLabel: 'Supplemental Detail',
        entryLabel: 'Supplemental Entry',
        amountLabel: 'Supplemental Amount'
      }
  }
}

function withOrdinalSuffix(baseLabel: string, match: RegExpMatchArray): string {
  const lastCapturedValue = [...match].reverse().find(value => value && /^\d+$/.test(value))
  if (!lastCapturedValue) return baseLabel

  const index = Number(lastCapturedValue)
  if (!Number.isFinite(index) || index <= 1) {
    return baseLabel
  }

  return `${baseLabel} ${index}`
}

function resolveBalanceSheetInstitutionLabel(fieldName: string, institutionNumber: number): string | null {
  const prefix = `Financial Institution ${institutionNumber}`

  const explicitLabels: Record<string, string> = {
    'Financial Institution': `${prefix} Name`,
    'Financial Institution_2': `${prefix} Name`,
    'Financial Institution_3': `${prefix} Name`,
    'Financial Institution_4': `${prefix} Name`,
    Address: `${prefix} Address Line 1`,
    Address_2: `${prefix} Address Line 2`,
    Address_3: `${prefix} Address Line 1`,
    Address_4: `${prefix} Address Line 2`,
    Address_5: `${prefix} Address Line 1`,
    Address_6: `${prefix} Address Line 2`,
    Address_7: `${prefix} Address Line 1`,
    Address_8: `${prefix} Address Line 2`,
    'City WA Zip': `${prefix} City, State, Zip`,
    'City WA Zip_2': `${prefix} City, State, Zip`,
    'City WA Zip_3': `${prefix} City, State, Zip`,
    'City WA Zip_4': `${prefix} City, State, Zip`,
    'Account No last 4 digits': `${prefix} Account Number (Last 4 Digits)`,
    'Account No last 4 digits_2': `${prefix} Account Number (Last 4 Digits)`,
    'Account No last 4 digits_3': `${prefix} Account Number (Last 4 Digits)`,
    'Account No last 4 digits_4': `${prefix} Account Number (Last 4 Digits)`,
    'Account No last 4 digits_5': `${prefix} Account Number (Last 4 Digits)`,
    'Account No last 4 digits_6': `${prefix} Account Number (Last 4 Digits)`,
    undefined_21: `${prefix} Interest Rate`,
    undefined_22: `${prefix} Maturity Date`,
    undefined_23: `${prefix} Interest Rate`,
    undefined_24: `${prefix} Maturity Date`,
    'Balance as of': `${prefix} Balance as of Date`,
    'Balance as of_2': `${prefix} Balance as of Date`,
    'Balance as of_3': `${prefix} Balance as of Date`,
    'Balance as of_4': `${prefix} Balance as of Date`,
    'Balance as of_5': `${prefix} Balance as of Date`,
    'Balance as of_6': `${prefix} Balance as of Date`,
    'Interest Rate': `${prefix} Interest Rate`,
    'Interest Rate_2': `${prefix} Interest Rate`,
    'Interest Rate_3': `${prefix} Interest Rate`,
    'Interest Rate_4': `${prefix} Interest Rate`,
    'Maturity Date': `${prefix} Maturity Date`,
    'Maturity Date_2': `${prefix} Maturity Date`,
    'Maturity Date_3': `${prefix} Maturity Date`,
    'Maturity Date_4': `${prefix} Maturity Date`
  }

  if (explicitLabels[fieldName]) {
    return explicitLabels[fieldName]
  }

  const detailMatch = fieldName.match(/^undefined_(\d+)$/)
  if (detailMatch) {
    return `${prefix} Detail ${detailMatch[1]}`
  }

  return null
}

function resolveSupplementalFieldMeta(
  fieldName: string,
  pageNumber: number,
  type: string
): SupplementalFieldOverride {
  const exactOverride = SUPPLEMENTAL_FIELD_OVERRIDES[`${pageNumber}|${fieldName}`]
  if (exactOverride) {
    if (fieldName.startsWith('Account No last 4 digits')) {
      return {
        ...exactOverride,
        inputFormat: 'digits',
        validation: {
          ...exactOverride.validation,
          maxLength: 4,
          pattern: /^\d{4}$/
        }
      }
    }
    return exactOverride
  }

  const humanized = humanizeSupplementalFieldName(fieldName)
  const labelContext = getSupplementalLabelContext(pageNumber)

  if (fieldName === 'the following gifts from the protected person worth more than a minimal value listed below 2') {
    return {
      label: 'Describe the second gift received from the protected person',
      conditional: { fieldId: 'hasAdditionalGiftDetail2', equals: 'yes' }
    }
  }

  if (fieldName === 'the following gifts from the protected person worth more than a minimal value listed below 3') {
    return {
      label: 'Describe the third gift received from the protected person',
      conditional: { fieldId: 'hasAdditionalGiftDetail3', equals: 'yes' }
    }
  }

  if (fieldName === 'the following gifts from the protected person worth more than a minimal value listed below 1') {
    return {
      label: 'Describe the first gift received from the protected person',
      conditional: { fieldId: 'hasGiftDisclosures', equals: 'yes' }
    }
  }

  if (fieldName === 'those businesses have benefitted from the estate of the protected person by 2') {
    return {
      label: 'Describe the second business relationship or benefit',
      conditional: { fieldId: 'hasAdditionalBusinessBenefit2', equals: 'yes' }
    }
  }

  if (fieldName === 'those businesses have benefitted from the estate of the protected person by 3') {
    return {
      label: 'Describe the third business relationship or benefit',
      conditional: { fieldId: 'hasAdditionalBusinessBenefit3', equals: 'yes' }
    }
  }

  if (fieldName === 'those businesses have benefitted from the estate of the protected person by 1') {
    return {
      label: 'Describe the first business relationship or benefit',
      conditional: { fieldId: 'hasBusinessBenefitDisclosures', equals: 'yes' }
    }
  }

  const longTextPrefixes: Array<[string, string]> = [
    ['Explain any large or unusual expenditures adjustments or purchases', 'Large or Unusual Expenditure Explanation'],
    ['the protected person receives the following services', 'Services Received Details'],
    ['Recommended changes in scope of the conservators authority', 'Recommended Changes in Scope of Authority'],
    ['changed as follows', 'Recommended Scope Change Details'],
    ['the following gifts from the protected person worth more than a minimal value listed below', 'Gift Details'],
    ['those businesses have benefitted from the estate of the protected person by', 'Business Benefit Details']
  ]

  for (const [prefix, label] of longTextPrefixes) {
    if (fieldName.startsWith(prefix)) {
      const suffixMatch = fieldName.match(/(\d+)(?:_\d+)?$/)
      if (!suffixMatch) {
        return { label }
      }

      return { label: `${label} ${suffixMatch[1]}` }
    }
  }

  if (humanized === 'MedicalDental Insurance') {
    return { label: 'Medical / Dental Insurance' }
  }

  if (humanized === 'VARailroadCSA Pension') {
    return { label: 'VA / Railroad / CSA Pension' }
  }

  if (humanized === 'Entertainment Travel') {
    return { label: 'Entertainment / Travel' }
  }

  if (humanized === 'Conservators Allowance') {
    return { label: "Conservator's Allowance" }
  }

  if (type === 'textarea' && /^Other \d+$/.test(humanized) && pageNumber !== 14) {
    return { label: humanized.replace(/^Other (\d+)$/, 'Other Details $1') }
  }

  if (BALANCE_SHEET_INSTITUTION_1_FIELDS.has(fieldName)) {
    return {
      label: resolveBalanceSheetInstitutionLabel(fieldName, 1) || humanized,
      conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' }
    }
  }

  if (BALANCE_SHEET_INSTITUTION_2_FIELDS.has(fieldName)) {
    return {
      label: resolveBalanceSheetInstitutionLabel(fieldName, 2) || humanized,
      conditional: { fieldId: 'hasBalanceSheetInstitution2', equals: 'yes' }
    }
  }

  if (BALANCE_SHEET_INSTITUTION_3_FIELDS.has(fieldName)) {
    return {
      label: resolveBalanceSheetInstitutionLabel(fieldName, 3) || humanized,
      conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' }
    }
  }

  if (BALANCE_SHEET_INSTITUTION_4_FIELDS.has(fieldName)) {
    return {
      label: resolveBalanceSheetInstitutionLabel(fieldName, 4) || humanized,
      conditional: { fieldId: 'hasBalanceSheetInstitution4', equals: 'yes' }
    }
  }

  if (SUPPLEMENTAL_BALANCE_SHEET_DETAIL_FIELDS.has(fieldName)) {
    return {
      label: humanized,
      conditional: { fieldId: 'hasAdditionalBalanceSheetDetails', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_4') {
    return {
      label: 'What is the first "other" budget item?',
      conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_5') {
    return {
      label: 'Describe the first "other" budget item',
      fontSize: 8,
      conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_6') {
    return {
      label: 'What is the second "other" budget item?',
      conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_7') {
    return {
      label: 'Describe the second "other" budget item',
      fontSize: 8,
      conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_8') {
    return {
      label: 'What is the third "other" budget item?',
      conditional: { fieldId: 'hasAdditionalBudgetOtherItem3', equals: 'yes' }
    }
  }

  if (fieldName === 'Other_9') {
    return {
      label: 'Describe the third "other" budget item',
      fontSize: 8,
      conditional: { fieldId: 'hasAdditionalBudgetOtherItem3', equals: 'yes' }
    }
  }

  for (const [pattern, label] of SUPPLEMENTAL_LABEL_FAMILIES) {
    const match = fieldName.match(pattern)
    if (match) {
      const contextualLabel =
        label === 'Additional Detail'
          ? labelContext.detailLabel
          : label === 'Additional Entry'
            ? labelContext.entryLabel
            : label === 'Amount'
              ? labelContext.amountLabel
              : label

      return { label: withOrdinalSuffix(contextualLabel, match) }
    }
  }

  return { label: humanized }
}

function inferSupplementalFieldType(
  originalType: string,
  resolvedMeta: SupplementalFieldOverride,
  fallbackLabel: string
): TemplateField['type'] {
  if (resolvedMeta.type) {
    return resolvedMeta.type
  }

  if (originalType === 'textarea') {
    return 'textarea'
  }

  if (originalType === 'date') {
    return 'date'
  }

  if (originalType === 'checkbox') {
    return 'checkbox'
  }

  const label = fallbackLabel.toLowerCase()

  if (/\b(date|dated)\b/.test(label)) {
    return 'date'
  }

  if (/\b(amount|value|total|balance|rate)\b/.test(label)) {
    return 'number'
  }

  return originalType as TemplateField['type']
}

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

const REQUESTED_ORDER_COUNT_OPTIONS = [
  { label: 'No additional orders', value: '0' },
  { label: '1 additional order', value: '1' },
  { label: '2 additional orders', value: '2' }
]

const SCOPE_OPTIONS = [
  { label: 'Not applicable', value: 'none' },
  { label: 'Full', value: 'full' },
  { label: 'Limited', value: 'limited' }
]

const REPORT_TYPE_OPTIONS = [
  { label: '12-Month Report (ANR12)', value: '12' },
  { label: '24-Month Report (ANR24)', value: '24' },
  { label: '36-Month Report (ANR36)', value: '36' },
  { label: 'Final Report (RPT)', value: 'final' }
]

const WASHINGTON_COUNTY_OPTIONS = [
  'Adams', 'Asotin', 'Benton', 'Chelan', 'Clallam', 'Clark', 'Columbia', 'Cowlitz',
  'Douglas', 'Ferry', 'Franklin', 'Garfield', 'Grant', 'Grays Harbor', 'Island',
  'Jefferson', 'King', 'Kitsap', 'Kittitas', 'Klickitat', 'Lewis', 'Lincoln',
  'Mason', 'Okanogan', 'Pacific', 'Pend Oreille', 'Pierce', 'San Juan', 'Skagit',
  'Skamania', 'Snohomish', 'Spokane', 'Stevens', 'Thurston', 'Wahkiakum',
  'Walla Walla', 'Whatcom', 'Whitman', 'Yakima'
].map(county => ({ label: county, value: county }))

const REPORTING_INTERVAL_OPTIONS = [
  { label: 'Every 12 months', value: '12' },
  { label: 'Every 24 months', value: '24' },
  { label: 'Every 36 months', value: '36' }
]

const US_STATE_OPTIONS = [
  { label: 'Select a state', value: '' },
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'District of Columbia', value: 'DC' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' }
]

const BOND_RECOMMENDATION_OPTIONS = [
  { label: 'No recommendation yet', value: 'none' },
  { label: 'Keep the current bond', value: 'remain' },
  { label: 'Change the current bond', value: 'change' }
]

const SUCCESSOR_NOMINATION_OPTIONS = [
  { label: 'Not applicable', value: 'not_applicable' },
  { label: 'Nominate a successor now', value: 'nominate_now' }
]

type BalanceSheetCityStateZipConfig = {
  combinedId: string
  cityId: string
  stateId: string
  zipId: string
  institutionLabel: string
}

const BALANCE_SHEET_CITY_STATE_ZIP_FIELD_CONFIG: Record<string, BalanceSheetCityStateZipConfig> = {
  'City WA Zip': {
    combinedId: 'balanceSheetInstitution1CityStateZip',
    cityId: 'balanceSheetInstitution1City',
    stateId: 'balanceSheetInstitution1State',
    zipId: 'balanceSheetInstitution1Zip',
    institutionLabel: 'Financial Institution 1'
  },
  'City WA Zip_2': {
    combinedId: 'balanceSheetInstitution2CityStateZip',
    cityId: 'balanceSheetInstitution2City',
    stateId: 'balanceSheetInstitution2State',
    zipId: 'balanceSheetInstitution2Zip',
    institutionLabel: 'Financial Institution 2'
  },
  'City WA Zip_3': {
    combinedId: 'balanceSheetInstitution3CityStateZip',
    cityId: 'balanceSheetInstitution3City',
    stateId: 'balanceSheetInstitution3State',
    zipId: 'balanceSheetInstitution3Zip',
    institutionLabel: 'Financial Institution 3'
  },
  'City WA Zip_4': {
    combinedId: 'balanceSheetInstitution4CityStateZip',
    cityId: 'balanceSheetInstitution4City',
    stateId: 'balanceSheetInstitution4State',
    zipId: 'balanceSheetInstitution4Zip',
    institutionLabel: 'Financial Institution 4'
  }
}

function createBalanceSheetCityStateZipFields(
  baseField: TemplateField,
  fieldName: string
): TemplateField[] {
  const config = BALANCE_SHEET_CITY_STATE_ZIP_FIELD_CONFIG[fieldName]
  if (!config) {
    return [baseField]
  }

  return [
    {
      ...baseField,
      id: config.combinedId,
      includeInForm: false
    },
    {
      id: config.cityId,
      label: `${config.institutionLabel} City`,
      type: 'text',
      section: baseField.section,
      width: 5,
      includeInPdf: false,
      conditional: baseField.conditional,
      pdf: baseField.pdf
    },
    {
      id: config.stateId,
      label: `${config.institutionLabel} State`,
      type: 'select',
      options: US_STATE_OPTIONS,
      defaultValue: '',
      section: baseField.section,
      width: 3,
      includeInPdf: false,
      conditional: baseField.conditional,
      pdf: baseField.pdf
    },
    {
      id: config.zipId,
      label: `${config.institutionLabel} ZIP Code`,
      type: 'text',
      inputFormat: 'postal-code',
      validation: { pattern: /^\d{5}(?:-\d{4})?$/ },
      section: baseField.section,
      width: 4,
      includeInPdf: false,
      conditional: baseField.conditional,
      pdf: baseField.pdf
    }
  ]
}

const supplementalCheckboxFields: TemplateField[] = [
  {
    id: 'hasRealPropertyAssets',
    label: 'Do you have any personal property to list?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 8, x: 108, y: 275, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showRealPropertyItem2',
    label: 'Show a second personal property item',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'showRealPropertyItem3',
    label: 'Show a third personal property item',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'showRealPropertyItem2', equals: true },
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'realPropertyWorth1',
    label: 'What is the value of personal property item 1?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    conditional: { fieldId: 'hasRealPropertyAssets', equals: 'yes' },
    includeInPdf: false,
    pdfFieldNames: ['realPropertyWorth1'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'realPropertyWorth2',
    label: 'What is the value of personal property item 2?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInPdf: false,
    pdfFieldNames: ['realPropertyWorth2'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'realPropertyWorth3',
    label: 'What is the value of personal property item 3?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInPdf: false,
    pdfFieldNames: ['realPropertyWorth3'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'hasReceivables',
    label: 'Do you have any receivables to list?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 8, x: 108, y: 115, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showReceivableItem2',
    label: 'Show a second receivable item',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'showReceivableItem3',
    label: 'Show a third receivable item',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'showReceivableItem2', equals: true },
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'receivableWorth1',
    label: 'What is the worth of receivable item 1?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    conditional: { fieldId: 'hasReceivables', equals: 'yes' },
    includeInPdf: false,
    pdfFieldNames: ['receivableWorth1'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'receivableWorth2',
    label: 'What is the worth of receivable item 2?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInPdf: false,
    pdfFieldNames: ['receivableWorth2'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'receivableWorth3',
    label: 'What is the worth of receivable item 3?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInPdf: false,
    pdfFieldNames: ['receivableWorth3'],
    pdf: { page: 8, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'hasLiquidAssets',
    label: 'Do you have any personal or other property subject to your control to list?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 10, x: 108, y: 410, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLiquidAssetItem3',
    label: 'Show a third personal or other property item',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLiquidAssetItem2', equals: 'yes' },
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'hasAdditionalLiquidAssetItem2',
    label: 'Do you have another personal or other property item to add?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' },
    pdf: { page: 10, x: 108, y: 392, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'liquidAssetWorth1',
    label: 'What is the value of personal or other property item 1?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    conditional: { fieldId: 'hasLiquidAssets', equals: 'yes' },
    includeInForm: false,
    includeInPdf: false,
    pdfFieldNames: ['liquidAssetWorth1'],
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'liquidAssetWorth2',
    label: 'What is the value of personal or other property item 2?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    conditional: { fieldId: 'hasAdditionalLiquidAssetItem2', equals: 'yes' },
    includeInForm: false,
    includeInPdf: false,
    pdfFieldNames: ['liquidAssetWorth2'],
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'liquidAssetWorth3',
    label: 'What is the value of personal or other property item 3?',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    includeInPdf: false,
    pdfFieldNames: ['liquidAssetWorth3'],
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'futureReportingInterval',
    label: 'How often should reporting continue going forward?',
    type: 'radio',
    section: 'Reporting Period',
    width: 12,
    options: REPORTING_INTERVAL_OPTIONS,
    includeInPdf: false,
    pdf: { page: 2, x: 323.347, y: 384.544, fontSize: 10, maxWidth: 220 }
  },
  {
    id: 'reportEvery12Months',
    label: 'Continue reporting every 12 months',
    type: 'checkbox',
    section: 'Reporting Period',
    width: 4,
    includeInForm: false,
    pdfFieldNames: ['Check Box1'],
    pdf: { page: 2, x: 323.347, y: 384.544, fontSize: 10 }
  },
  {
    id: 'reportEvery24Months',
    label: 'Continue reporting every 24 months',
    type: 'checkbox',
    section: 'Reporting Period',
    width: 4,
    includeInForm: false,
    pdfFieldNames: ['Check Box10'],
    pdf: { page: 2, x: 360.002, y: 385.198, fontSize: 10 }
  },
  {
    id: 'reportEvery36Months',
    label: 'Continue reporting every 36 months',
    type: 'checkbox',
    section: 'Reporting Period',
    width: 4,
    includeInForm: false,
    pdfFieldNames: ['Check Box11'],
    pdf: { page: 2, x: 396.656, y: 385.198, fontSize: 10 }
  },
  {
    id: 'notAccusedOfFraud',
    label: 'Not Accused of Fraud, Abuse, Neglect, or Breach of Fiduciary Duty',
    type: 'checkbox',
    section: 'Reporting Criteria',
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box16'],
    pdf: { page: 2, x: 155.128, y: 315.816, fontSize: 10 }
  },
  {
    id: 'noUntimelyReports',
    label: 'No Untimely Reports',
    type: 'checkbox',
    section: 'Reporting Criteria',
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box48'],
    pdf: { page: 2, x: 156.437, y: 228.761, fontSize: 10 }
  },
  {
    id: 'notMonitoredByAgencies',
    label: 'Not Monitored by Other State and Local Agencies',
    type: 'checkbox',
    section: 'Reporting Criteria',
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box19'],
    pdf: { page: 2, x: 147.928, y: 154.143, fontSize: 10 }
  },
  {
    id: 'agencyDshs',
    label: 'Is DSHS involved?',
    type: 'radio',
    section: 'Reporting Criteria',
    width: 12,
    options: YES_NO_OPTIONS,
    conditional: { fieldId: 'monitoredByAgencies', equals: 'yes' },
    pdfFieldNames: ['Check Box20'],
    pdf: { page: 2, x: 140.073, y: 135.815, fontSize: 10 }
  },
  {
    id: 'agencyVa',
    label: 'Is VA involved?',
    type: 'radio',
    section: 'Reporting Criteria',
    width: 12,
    options: YES_NO_OPTIONS,
    conditional: { fieldId: 'monitoredByAgencies', equals: 'yes' },
    pdfFieldNames: ['Check Box21'],
    pdf: { page: 2, x: 142.037, y: 117.488, fontSize: 10 }
  },
  {
    id: 'agencySsa',
    label: 'Is SSA involved?',
    type: 'radio',
    section: 'Reporting Criteria',
    width: 12,
    options: YES_NO_OPTIONS,
    conditional: { fieldId: 'monitoredByAgencies', equals: 'yes' },
    pdfFieldNames: ['Check Box22'],
    pdf: { page: 2, x: 299.129, y: 135.815, fontSize: 10 }
  },
  {
    id: 'agencyOther',
    label: 'Is another agency involved?',
    type: 'radio',
    section: 'Reporting Criteria',
    width: 12,
    options: YES_NO_OPTIONS,
    conditional: { fieldId: 'monitoredByAgencies', equals: 'yes' },
    pdfFieldNames: ['Check Box23'],
    pdf: { page: 2, x: 299.129, y: 118.143, fontSize: 10 }
  },
  {
    id: 'interestedAgencyVeteran',
    label: 'Veterans benefits agency should receive notice',
    type: 'checkbox',
    section: 'Interested Governmental Agencies',
    width: 12,
    pdfFieldNames: ['Check Box24'],
    pdf: { page: 3, x: 105.382, y: 601.199, fontSize: 10 }
  },
  {
    id: 'interestedAgencyMedicaid',
    label: 'Medicaid / DSHS should receive notice',
    type: 'checkbox',
    section: 'Interested Governmental Agencies',
    width: 12,
    pdfFieldNames: ['Check Box25'],
    pdf: { page: 3, x: 106.691, y: 517.417, fontSize: 10 }
  },
  {
    id: 'interestedAgencyOther',
    label: 'Another government agency should receive notice',
    type: 'checkbox',
    section: 'Interested Governmental Agencies',
    width: 12,
    pdfFieldNames: ['Check Box26'],
    pdf: { page: 3, x: 105.382, y: 474.871, fontSize: 10 }
  },
  {
    id: 'trustDoesNotReportToCourt',
    label: 'Trust Does Not Report to Court',
    type: 'checkbox',
    section: 'Trust Information',
    width: 6,
    includeInForm: false,
    conditional: { fieldId: 'trustBeneficiary', equals: 'yes' },
    pdfFieldNames: ['Check Box51'],
    pdf: { page: 3, x: 452.293, y: 218.943, fontSize: 10 }
  },
  {
    id: 'inventoryNotOnFile',
    label: 'Inventory Not on File',
    type: 'checkbox',
    section: 'Inventory & Bond',
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box27'],
    pdf: { page: 3, x: 134.837, y: 143.67, fontSize: 10 }
  },
  {
    id: 'bondNotInPlace',
    label: 'Bond Not in Place',
    type: 'checkbox',
    section: 'Inventory & Bond',
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box30'],
    pdf: { page: 3, x: 166.255, y: 107.67, fontSize: 10 }
  },
  {
    id: 'bondRecommendation',
    label: 'What should happen with the current bond?',
    type: 'radio',
    section: 'Inventory & Bond',
    width: 12,
    options: BOND_RECOMMENDATION_OPTIONS,
    includeInPdf: false,
    pdf: { page: 4, x: 190.474, y: 685.636, fontSize: 10, maxWidth: 240 }
  },
  {
    id: 'bondShouldRemain',
    label: 'The current bond should stay in place',
    type: 'checkbox',
    section: 'Inventory & Bond',
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box31'],
    pdf: { page: 4, x: 190.474, y: 685.636, fontSize: 10 }
  },
  {
    id: 'bondShouldChange',
    label: 'The current bond should be changed',
    type: 'checkbox',
    section: 'Inventory & Bond',
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box32'],
    pdf: { page: 4, x: 259.201, y: 685.636, fontSize: 10 }
  },
  {
    id: 'successorNominationChoice',
    label: 'Would you like to nominate a successor now?',
    type: 'radio',
    section: 'Successor',
    width: 12,
    options: SUCCESSOR_NOMINATION_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'successorNamed', equals: 'no' },
    pdf: { page: 5, x: 105.382, y: 741.927, fontSize: 10, maxWidth: 260 }
  },
  {
    id: 'successorNotApplicable',
    label: 'A successor is not applicable here',
    type: 'checkbox',
    section: 'Successor',
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box37'],
    pdf: { page: 5, x: 105.382, y: 704.618, fontSize: 10 }
  },
  {
    id: 'successorNominateNow',
    label: 'I want to nominate a successor now',
    type: 'checkbox',
    section: 'Successor',
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box38'],
    pdf: { page: 5, x: 105.382, y: 741.927, fontSize: 10 }
  },
  {
    id: 'successorTypeGuardian',
    label: 'Successor Role: Guardian',
    type: 'checkbox',
    section: 'Successor',
    width: 6,
    includeInForm: false,
    conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
    pdfFieldNames: ['Check Box39'],
    pdf: { page: 5, x: 209.455, y: 690.872, fontSize: 10 }
  },
  {
    id: 'successorTypeConservator',
    label: 'Successor Role: Conservator',
    type: 'checkbox',
    section: 'Successor',
    width: 6,
    includeInForm: false,
    conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
    pdfFieldNames: ['Check Box40'],
    pdf: { page: 5, x: 272.947, y: 691.527, fontSize: 10 }
  },
  {
    id: 'successorNotAble',
    label: 'Successor Is Not Able to Serve',
    type: 'checkbox',
    section: 'Successor',
    width: 12,
    includeInForm: false,
    conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
    pdfFieldNames: ['Check Box36'],
    pdf: { page: 4, x: 477.82, y: 119.452, fontSize: 10 }
  },
  {
    id: 'individualReceivingSatisfactoryCare',
    label: 'Individual Is Receiving Satisfactory Care',
    type: 'checkbox',
    section: "Guardian's Report",
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box42'],
    pdf: { page: 5, x: 317.456, y: 535.744, fontSize: 10 }
  },
  {
    id: 'individualStatusChangeRequested',
    label: 'I have concerns and want to request a change',
    type: 'radio',
    section: "Guardian's Report",
    width: 12,
    options: YES_NO_OPTIONS,
    pdfFieldNames: ['Check Box41'],
    pdf: { page: 5, x: 479.129, y: 534.435, fontSize: 10 }
  },
  {
    id: 'carePlanChangeRecommended',
    label: 'I recommend changes to the care plan',
    type: 'radio',
    section: "Guardian's Report",
    width: 12,
    options: YES_NO_OPTIONS,
    pdfFieldNames: ['Check Box52'],
    pdf: { page: 6, x: 122.401, y: 80.8333, fontSize: 10 }
  },
  {
    id: 'planNotDeviated',
    label: 'Guardian Has Not Deviated from the Plan',
    type: 'checkbox',
    section: "Guardian's Report",
    width: 12,
    includeInForm: false,
    pdfFieldNames: ['Check Box55'],
    pdf: { page: 7, x: 434.62, y: 118.797, fontSize: 10 }
  },
  {
    id: 'conservatorPlanDeviated',
    label: 'Has the conservator deviated from the approved plan?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 12, x: 330.44, y: 96.73, fontSize: 10 }
  },
  {
    id: 'conservatorPlanHasDeviated',
    label: 'Conservator Has Deviated from the Plan',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    pdfCoordinateOverlay: true,
    pdf: { page: 12, x: 409, y: 96.73, fontSize: 10 }
  },
  {
    id: 'conservatorPlanNotDeviated',
    label: 'Conservator Has Not Deviated from the Plan',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    pdfCoordinateOverlay: true,
    pdf: { page: 12, x: 448.14, y: 96.73, fontSize: 10 }
  },
  {
    id: 'futureCarePlanSame',
    label: 'Future Care Plan Remains the Same',
    type: 'checkbox',
    section: "Guardian's Report",
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box58'],
    pdf: { page: 8, x: 229.092, y: 629.345, fontSize: 10 }
  },
  {
    id: 'futureCarePlanChanged',
    label: 'The future care plan has changed',
    type: 'radio',
    section: "Guardian's Report",
    width: 6,
    options: YES_NO_OPTIONS,
    pdfFieldNames: ['Check Box56'],
    pdf: { page: 8, x: 355.42, y: 629.345, fontSize: 10 }
  },
  {
    id: 'scopeShouldRemainSame',
    label: 'Scope of Guardian Authority Should Remain the Same',
    type: 'checkbox',
    section: "Guardian's Report",
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box43'],
    pdf: { page: 8, x: 289.965, y: 479.453, fontSize: 10 }
  },
  {
    id: 'scopeShouldChange',
    label: 'Scope of Guardian Authority Should Change',
    type: 'checkbox',
    section: "Guardian's Report",
    width: 6,
    includeInForm: false,
    pdfFieldNames: ['Check Box44'],
    pdf: { page: 8, x: 445.747, y: 478.799, fontSize: 10 }
  },
  {
    id: 'conservatorScopeChangeRecommended',
    label: 'Do you recommend changes to the scope of the conservator’s authority?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 12, x: 306.81, y: 221.17, fontSize: 10 }
  },
  {
    id: 'conservatorScopeShouldRemainSame',
    label: 'Conservator Authority Scope Should Remain the Same',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    pdfCoordinateOverlay: true,
    pdf: { page: 12, x: 304.6, y: 221.17, fontSize: 10 }
  },
  {
    id: 'conservatorScopeShouldChange',
    label: 'Conservator Authority Scope Should Change',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    pdfCoordinateOverlay: true,
    pdf: { page: 12, x: 446.47, y: 221.17, fontSize: 10 }
  },
  {
    id: 'isWsba',
    label: 'Are you a WSBA member?',
    type: 'radio',
    section: 'Verification',
    width: 12,
    options: YES_NO_OPTIONS,
    pdfFieldNames: ['Check Box45'],
    pdf: { page: 14, x: 434.62, y: 345.925, fontSize: 10 }
  },
  {
    id: 'isCpg',
    label: 'Are you a certified professional guardian (CPG)?',
    type: 'radio',
    section: 'Verification',
    width: 12,
    options: YES_NO_OPTIONS,
    pdfFieldNames: ['Check Box46'],
    pdf: { page: 14, x: 485.02, y: 345.925, fontSize: 10 }
  },
  {
    id: 'verificationSignature',
    label: 'Sign here to confirm this report',
    type: 'signature',
    section: 'Verification',
    width: 12,
    validation: { required: 'Please add your signature before submitting.' },
    pdfFieldNames: ['Signature1_es_:signer:signature'],
    pdf: { page: 14, x: 72, y: 363.6, fontSize: 12, maxWidth: 207.12 }
  }
]

const supplementalTextFieldSpecs = [
  'date|Date|8|281.4|240.96|74.28000000000003',
  'date|Date_2|8|407.4|240.96|78.72000000000003',
  'text|1_6|8|84.24|183.48|122.88000000000001',
  'text|1   2   3|8|462.96|144.96|81.36000000000004',
  'text|2_6|8|84.24|164.88|122.88000000000001',
  'text|3_5|8|84.24|146.16|122.88000000000001',
  'text|undefined_19|8|81.12|105.84|126',
  'text|1   2|8|462.96|84.72|81.59999999999994',
  'text|undefined_20|8|84.24|87.24|122.88000000000001',
  'text|3_6|9|84.24|711.24|122.88000000000001',
  'textarea|Financial Institution|9|213.84|669.72|267.84',
  'textarea|Address|9|160.08|651|321.6',
  'textarea|Address_2|9|160.08|632.4|321.6',
  'textarea|City WA Zip|9|180.84|613.68|300.84',
  'text|Account No last 4 digits|9|232.08|576.48|60.599999999999994',
  'text|undefined_21|9|309.12|576.48|64.56',
  'text|undefined_22|9|417.12|576.48|64.56',
  'text|Balance as of|9|181.44|557.76|106.56',
  'text|Account No last 4 digits_2|9|232.08|520.44|60.599999999999994',
  'text|undefined_23|9|309.12|520.44|64.56',
  'text|undefined_24|9|417.12|520.44|64.56',
  'text|Balance as of_2|9|181.44|501.84|106.56',
  'textarea|Financial Institution_2|9|213.84|483.24|267.84',
  'textarea|Address_3|9|160.08|464.52|321.6',
  'textarea|Address_4|9|160.08|445.92|321.6',
  'textarea|City WA Zip_2|9|180.84|427.2|300.84',
  'text|Account No last 4 digits_3|9|232.08|390|33.599999999999994',
  'text|Interest Rate|9|177.12|371.28|88.56',
  'date|Maturity Date|9|179.52|352.68|86.16',
  'text|undefined_25|9|291.12|352.68|64.56',
  'text|undefined_26|9|403.68|352.68|73.44',
  'text|Balance as of_3|9|181.44|333.96|82.32',
  'text|undefined_27|9|291.12|315.36|64.56',
  'text|undefined_28|9|403.68|315.36|73.44',
  'textarea|Financial Institution_3|9|213.84|240.12|267.84',
  'textarea|Address_5|9|160.08|221.4|321.6',
  'textarea|Address_6|9|160.08|202.8|321.6',
  'textarea|City WA Zip_3|9|180.84|184.2|300.84',
  'text|Account No last 4 digits_4|9|232.08|146.88|33.599999999999994',
  'text|Interest Rate_2|9|177.12|128.16|88.56',
  'date|Maturity Date_2|9|179.52|109.56|86.16',
  'text|undefined_29|9|291.12|109.56|64.56',
  'text|undefined_30|9|403.68|109.56|73.44',
  'text|Balance as of_4|9|181.44|90.96|82.32',
  'text|Account No last 4 digits_5|10|229.2|689.88|36.48000000000002',
  'text|Interest Rate_3|10|177.12|671.16|88.56',
  'date|Maturity Date_3|10|179.52|652.56|86.16',
  'text|undefined_31|10|291.12|652.56|64.56',
  'text|undefined_32|10|403.68|652.56|73.44',
  'text|Balance as of_5|10|181.44|633.84|82.32',
  'textarea|Financial Institution_4|10|202.2|615.24|279.48',
  'textarea|Address_7|10|151.44|596.64|330.24',
  'textarea|Address_8|10|151.44|577.92|330.24',
  'textarea|City WA Zip_4|10|172.2|559.32|309.48',
  'text|Account No last 4 digits_6|10|229.2|522|36.48000000000002',
  'text|Interest Rate_4|10|177.12|503.4|88.56',
  'date|Maturity Date_4|10|179.52|484.68|86.16',
  'text|undefined_33|10|291.12|484.68|64.56',
  'text|undefined_34|10|403.68|484.68|73.44',
  'text|Balance as of_6|10|181.44|466.08|82.32',
  'text|undefined_35|10|291.12|447.36|64.56',
  'text|undefined_36|10|403.68|447.36|73.44',
  'text|1_7|10|84.24|395.88|100.44000000000001',
  'text|undefined_37|10|259.68|395.88|91.44',
  'text|undefined_38|10|399.12|395.88|73.56',
  'text|2_7|10|84.24|377.28|100.44000000000001',
  'text|undefined_39|10|259.68|377.28|91.44',
  'text|undefined_40|10|399.12|377.28|73.56',
  'text|undefined_41|10|259.68|348.96|87',
  'text|undefined_42|10|402.12|348.96|84',
  'text|1_8|10|72|271.44|81.12',
  'text|2_8|10|72|252.72|81.12',
  'text|3_7|10|72|234.12|81.12',
  'text|undefined_43|10|204.12|271.44|102',
  'text|undefined_44|10|370.68|271.44|120',
  'text|undefined_45|10|204.12|252.72|102',
  'text|undefined_46|10|370.68|252.72|120',
  'text|undefined_47|10|204.12|234.12|102',
  'text|undefined_48|10|370.68|234.12|120',
  'text|Loan|10|108.72|215.4|44.400000000000006',
  'text|undefined_49|10|204.12|215.4|102',
  'text|undefined_50|10|367.68|215.4|123',
  'text|undefined_51|10|204.12|196.8|102',
  'text|undefined_52|10|370.68|196.8|120',
  'text|undefined_53|10|322.68|176.64|96',
  'text|undefined_54|10|456.12|176.64|70.55999999999995',
  'date|For Accounting Period starting date|10|290.88|74.52|69.24000000000001',
  'date|and ending date|10|452.4|74.52|51.60000000000002',
  'text|undefined_55|11|460.68|571.32|70.44',
  'text|undefined_56|11|459.12|552.6|72',
  'text|Social Security SSA|11|213.24|488.52|123.24000000000001',
  'text|fill_10|11|348.24|488.52|78.24000000000001',
  'text|SSI|11|125.76|469.44|210.72000000000003',
  'text|fill_12|11|348.24|469.44|78.24000000000001',
  'text|VARailroadCSA Pension|11|235.32|450.24|101.16000000000003',
  'text|fill_14|11|348.24|450.24|78.24000000000001',
  'text|Retirement Pension|11|204.84|431.16|131.64000000000001',
  'text|fill_16|11|348.24|431.16|78.24000000000001',
  'text|Wages|11|142.44|411.96|194.04000000000002',
  'text|fill_18|11|348.24|411.96|78.24000000000001',
  'text|Interest and Dividends|11|217.56|392.76|118.92000000000002',
  'text|fill_20|11|348.24|392.76|78.24000000000001',
  'text|Other_2|11|138.84|373.68|197.64000000000001',
  'text|fill_22|11|348.24|373.68|78.24000000000001',
  'text|undefined_57|11|459.12|355.68|72',
  'text|fill_24|11|348.6|297.6|77.51999999999998',
  'text|Personal Funds|11|185.28|278.4|151.20000000000002',
  'text|fill_26|11|348.24|278.4|78.24000000000001',
  'text|Entertainment  Travel|11|220.56|259.32|115.92000000000002',
  'text|fill_28|11|348.24|259.32|78.24000000000001',
  'text|fill_29|11|348.6|227.52|77.51999999999998',
  'text|Medical and Dental|11|202.32|208.32|134.16000000000003',
  'text|fill_31|11|348.24|208.32|78.24000000000001',
  'text|Conservator Fees if allowed|11|251.64|189.24|84.84000000000003',
  'text|fill_33|11|348.24|189.24|78.24000000000001',
  'text|fill_35|11|348.24|170.04|78.24000000000001',
  'text|Other_3|11|138.84|150.84|197.64000000000001',
  'text|fill_37|11|348.24|150.84|78.24000000000001',
  'text|undefined_58|11|461.88|132.84|69.24000000000001',
  'text|undefined_59|11|460.68|95.52|70.44',
  'text|undefined_60|11|312.96|76.92|83.16000000000003',
  'text|undefined_61|12|313.56|702.48|82.56',
  'text|undefined_62|12|312.96|683.88|83.16000000000003',
  'text|undefined_63|12|313.8|665.16|82.32',
  'text|plus or minus amount in line 31d|12|312.96|646.56|81.60000000000002',
  'text|If the last line does not equal line 31e your account does not balance The account|12|313.56|609.24|76.44',
  'text|Should equal 31e|12|319.92|627.84|75.35999999999996',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 1|12|108|522|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 2|12|108|503.4|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 3|12|108|484.68|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 4|12|108|466.08|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 5|12|108|447.36|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 6|12|108|428.76|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 7|12|108|410.04|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 8|12|108|391.44|414.12',
  'textarea|Explain any large or unusual expenditures adjustments or purchases 9|12|108|372.84|414.12',
  'textarea|the protected person receives the following services 1|12|108|316.8|423.12',
  'textarea|the protected person receives the following services 2|12|108|298.2|423.12',
  'text|undefined_64|12|108|279.6|423.12',
  'textarea|Recommended changes in scope of the conservators authority|12|108|260.88|423',
  'textarea|changed as follows 1_2|12|108|192.36|423.12',
  'textarea|changed as follows 2_2|12|108|173.64|423.12',
  'text|undefined_65|12|108|155.04|423.12',
  'text|1_9|13|108|708.48|423.12',
  'text|2_9|13|108|689.88|423.12',
  'text|3_8|13|108|671.16|423.12',
  'text|undefined_66|13|108|652.56|423.12',
  'text|undefined_67|13|227.16|514.8|61.20000000000002',
  'text|undefined_68|13|312.36|514.8|61.19999999999999',
  'text|fill_33_2|13|416.28|513.72|122.39999999999998',
  'text|undefined_69|13|227.16|489|61.20000000000002',
  'text|undefined_70|13|312.36|489|61.19999999999999',
  'text|fill_34|13|416.28|487.92|122.39999999999998',
  'text|MedicalDental Insurance|13|167.52|462.12|47.16',
  'text|undefined_71|13|227.16|463.2|61.20000000000002',
  'text|undefined_72|13|312.36|463.2|61.19999999999999',
  'text|fill_35_2|13|416.28|462.12|122.39999999999998',
  'text|Other_4|13|128.76|450.12|67.32000000000002',
  'text|Other_5|13|90.36|436.32|124.67999999999999',
  'text|undefined_73|13|227.16|437.4|61.20000000000002',
  'text|undefined_74|13|312.36|437.4|61.19999999999999',
  'text|fill_36|13|416.28|436.32|122.39999999999998',
  'text|Other_6|13|128.76|424.32|67.32000000000002',
  'text|Other_7|13|90.36|410.52|124.67999999999999',
  'text|undefined_75|13|227.16|411.6|61.20000000000002',
  'text|undefined_76|13|312.36|411.6|61.19999999999999',
  'text|fill_37_2|13|416.28|410.52|122.39999999999998',
  'text|Other_8|13|128.76|398.52|67.32000000000002',
  'text|Other_9|13|90.36|384.72|124.67999999999999',
  'text|undefined_77|13|227.16|385.8|61.20000000000002',
  'text|undefined_78|13|312.36|385.8|61.19999999999999',
  'text|fill_38|13|416.28|384.72|122.39999999999998',
  'text|Conservators Allowance|13|162.72|358.92|51.96000000000001',
  'text|undefined_79|13|227.16|360|61.20000000000002',
  'text|undefined_80|13|312.36|360|61.19999999999999',
  'text|fill_39|13|416.28|358.92|122.39999999999998',
  'text|undefined_81|13|227.16|321.6|61.20000000000002',
  'text|fill_45|13|374.16|320.4|39.71999999999997',
  'text|undefined_82|13|312.36|321.6|61.19999999999999',
  'text|undefined_83|13|426.72|321.6|61.19999999999999',
  'textarea|the following gifts from the protected person worth more than a minimal value listed below 1|13|108|252.48|423.12',
  'textarea|the following gifts from the protected person worth more than a minimal value listed below 2|13|108|233.88|423.12',
  'textarea|the following gifts from the protected person worth more than a minimal value listed below 3|13|108|215.16|423.12',
  'textarea|those businesses have benefitted from the estate of the protected person by 1|13|108|146.64|423.12',
  'textarea|those businesses have benefitted from the estate of the protected person by 2|13|108|127.92|423.12',
  'textarea|those businesses have benefitted from the estate of the protected person by 3|13|108|109.32|423.12',
  'textarea|Other 1|14|108|650.04|423.12',
  'textarea|Other 2|14|108|631.44|423.12',
  'textarea|Other 3|14|108|612.72|423.12',
  'text|I declare under penalty of perjury under the laws of the State of Washington that the statements|14|107.52|482.16|191.04000000000002',
  'text|state|14|148.44|400.92|129.95999999999998',
  'date|on date|14|318.72|400.92|43.19999999999999',
  'text|undefined_84|14|420.12|400.92|111',
  'text|  WSBA   CPG|14|437.16|363.6|93.95999999999998'
]

const supplementalTextFields: TemplateField[] = supplementalTextFieldSpecs.flatMap((spec, index) => {
  const [type, fieldName, page, x, y, maxWidth] = spec.split('|')
  const pageNumber = Number(page)
  const resolvedMeta = resolveSupplementalFieldMeta(fieldName, pageNumber, type)
  const label = resolvedMeta.label || humanizeSupplementalFieldName(fieldName)
  const resolvedType = inferSupplementalFieldType(type, resolvedMeta, label)
  const isLegacySupplementalPage = pageNumber < 8

  const baseField: TemplateField = {
    id: resolvedMeta.id || slugifySupplementalFieldName(fieldName, index),
    label,
    type: resolvedType,
    inputFormat: resolvedMeta.inputFormat,
    validation: resolvedMeta.validation,
    section: resolvedMeta.section || supplementalSectionByPage[pageNumber] || 'Supplemental PDF Fields',
    width: resolvedMeta.width ?? (resolvedType === 'textarea' ? 12 : resolvedType === 'checkbox' ? 3 : 4),
    includeInForm: resolvedMeta.includeInForm ?? !isLegacySupplementalPage,
    includeInPdf: resolvedMeta.includeInPdf ?? !isLegacySupplementalPage,
    conditional: resolvedMeta.conditional,
    pdfFieldNames: resolvedMeta.pdfFieldNames ?? [fieldName],
    pdfCoordinateOverlay: resolvedMeta.pdfCoordinateOverlay,
    pdf: {
      page: pageNumber,
      x: Number(x),
      y: Number(y),
      fontSize: resolvedMeta.fontSize ?? 10,
      maxWidth: Number(maxWidth),
      maxLines: type === 'textarea' ? 1 : undefined,
      ...resolvedMeta.pdf
    }
  }

  if (fieldName === 'on date' && pageNumber === 14) {
    baseField.options = [
      { label: 'Select a state', value: '' },
      ...US_STATE_OPTIONS
        .filter(option => option.value !== '')
        .map(option => ({ label: String(option.value), value: option.value }))
    ]
    baseField.defaultValue = ''
  }

  return createBalanceSheetCityStateZipFields(baseField, fieldName)
})

const assetValueDisplayFields: TemplateField[] = [
  {
    id: 'realPropertyWorth1StartDisplay',
    label: 'Personal property item 1 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'hasRealPropertyAssets', equals: 'yes' },
    pdf: { page: 8, x: 254.16, y: 183.48, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'realPropertyWorth1EndDisplay',
    label: 'Personal property item 1 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'hasRealPropertyAssets', equals: 'yes' },
    pdf: { page: 8, x: 392.76, y: 183.48, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'realPropertyWorth2StartDisplay',
    label: 'Personal property item 2 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showRealPropertyItem2', equals: true },
    pdf: { page: 8, x: 254.16, y: 164.88, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'realPropertyWorth2EndDisplay',
    label: 'Personal property item 2 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showRealPropertyItem2', equals: true },
    pdf: { page: 8, x: 392.76, y: 164.88, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'realPropertyWorth3StartDisplay',
    label: 'Personal property item 3 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showRealPropertyItem3', equals: true },
    pdf: { page: 8, x: 254.16, y: 146.16, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'realPropertyWorth3EndDisplay',
    label: 'Personal property item 3 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showRealPropertyItem3', equals: true },
    pdf: { page: 8, x: 392.76, y: 146.16, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth1StartDisplay',
    label: 'Receivable item 1 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'hasReceivables', equals: 'yes' },
    pdf: { page: 8, x: 254.16, y: 105.84, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth1EndDisplay',
    label: 'Receivable item 1 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'hasReceivables', equals: 'yes' },
    pdf: { page: 8, x: 392.76, y: 105.84, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth2StartDisplay',
    label: 'Receivable item 2 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showReceivableItem2', equals: true },
    pdf: { page: 8, x: 254.16, y: 87.24, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth2EndDisplay',
    label: 'Receivable item 2 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showReceivableItem2', equals: true },
    pdf: { page: 8, x: 392.76, y: 87.24, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth3StartDisplay',
    label: 'Receivable item 3 value at start of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showReceivableItem3', equals: true },
    pdf: { page: 9, x: 254.16, y: 711.24, fontSize: 10, maxWidth: 88 }
  },
  {
    id: 'receivableWorth3EndDisplay',
    label: 'Receivable item 3 value at end of accounting ($)',
    type: 'number',
    section: 'Conservator Balance Sheet',
    width: 4,
    includeInForm: false,
    conditional: { fieldId: 'showReceivableItem3', equals: true },
    pdf: { page: 9, x: 392.76, y: 711.24, fontSize: 10, maxWidth: 88 }
  }
]


const supplementalPromptFields: TemplateField[] = [
  {
    id: 'hasOtherEstateIncome',
    label: 'Do you have any other estate income to report?',
    type: 'radio',
    section: 'Conservator Estate Information',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 11, x: 108, y: 382, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasOtherEstateExpense',
    label: 'Do you have any other estate expense to report?',
    type: 'radio',
    section: 'Conservator Estate Information',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 11, x: 108, y: 160, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasLargeExpenditureExplanation1',
    label: 'Do you need to explain a large or unusual expenditure, adjustment, or purchase?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 558, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation2',
    label: 'Do you have another large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasLargeExpenditureExplanation1', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 540, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation3',
    label: 'Do you have a third large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation2', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 522, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation4',
    label: 'Do you have a fourth large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation3', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 504, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation5',
    label: 'Do you have a fifth large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation4', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 486, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation6',
    label: 'Do you have a sixth large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation5', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 468, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation7',
    label: 'Do you have a seventh large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation6', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 450, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation8',
    label: 'Do you have an eighth large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation7', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 432, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalLargeExpenditureExplanation9',
    label: 'Do you have a ninth large or unusual expenditure, adjustment, or purchase to explain?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalLargeExpenditureExplanation8', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 414, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalConservatorPlanDetail2',
    label: 'Do you have another conservator-plan deviation to describe?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'conservatorPlanDeviated', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 699, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalScopeChangeDetail2',
    label: 'Do you want to describe a recommended change in scope of authority?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'conservatorScopeChangeRecommended', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 242, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalScopeChangeDetail3',
    label: 'Do you want to describe a second recommended change in scope of authority?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalScopeChangeDetail2', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 224, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalScopeChangeDetail4',
    label: 'Do you want to describe one more recommended change in scope of authority?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalScopeChangeDetail3', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 206, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasServicesReceived1',
    label: 'Do you want to list a service or support the protected person receives?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 316, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalServicesReceived2',
    label: 'Do you want to list another service or support the protected person receives?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasServicesReceived1', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 298, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalServicesReceived3',
    label: 'Do you want to list one more service or support the protected person receives?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalServicesReceived2', equals: 'yes' },
    pdf: { page: 12, x: 108, y: 280, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalConservatorPlanDetail3',
    label: 'Do you have a third conservator-plan deviation to describe?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalConservatorPlanDetail2', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 681, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalConservatorPlanDetail4',
    label: 'Do you have a fourth conservator-plan deviation to describe?',
    type: 'radio',
    section: 'Conservator Explanations & Plan',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalConservatorPlanDetail3', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 663, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showOtherBenefits',
    label: 'Show other benefits',
    type: 'checkbox',
    section: 'Benefits',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 3, x: 108, y: 600, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation2',
    label: 'Show additional expenditure explanation 2',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 540, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation3',
    label: 'Show additional expenditure explanation 3',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 522, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation4',
    label: 'Show additional expenditure explanation 4',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 504, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation5',
    label: 'Show additional expenditure explanation 5',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 486, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation6',
    label: 'Show additional expenditure explanation 6',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 468, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation7',
    label: 'Show additional expenditure explanation 7',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 450, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation8',
    label: 'Show additional expenditure explanation 8',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 432, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLargeExpenditureExplanation9',
    label: 'Show additional expenditure explanation 9',
    type: 'checkbox',
    section: 'Conservator Explanations & Plan',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    pdf: { page: 12, x: 108, y: 414, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasUnblockedLiquidAssets',
    label: 'Does the protected person have any Unblocked Liquid Assets?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 8, x: 108, y: 273, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasBalanceSheetInstitution2',
    label: 'Do you have a second unblocked liquid-asset institution to add? These are investment accounts, stocks, bonds, securities, IRAs, or cash accounts that are subject to a court restriction and require a court order for access.',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasUnblockedLiquidAssets', equals: 'yes' },
    pdf: { page: 8, x: 108, y: 255, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasBalanceSheetInstitution3',
    label: 'Do you have a blocked liquid-asset institution to add? These are investment accounts, stocks, bonds, securities, IRAs, or cash accounts that are subject to a court restriction and require a court order for access.',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 8, x: 108, y: 237, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBlockedAccountUnderInstitution1',
    label: 'Do you have another blocked account at this same institution?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' },
    pdf: { page: 8, x: 108, y: 228, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasBalanceSheetInstitution4',
    label: 'Do you have a second blocked liquid-asset institution to add? These are investment accounts, stocks, bonds, securities, IRAs, or cash accounts that are subject to a court restriction and require a court order for access.',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasBalanceSheetInstitution3', equals: 'yes' },
    pdf: { page: 8, x: 108, y: 219, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBalanceSheetDetails',
    label: 'Do you have any mortgages, liens, notes payable, or other liabilities to report?',
    type: 'radio',
    section: 'Conservator Balance Sheet',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 8, x: 108, y: 201, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'showLiabilityItem2',
    label: 'Show liability item 2',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalBalanceSheetDetails', equals: 'yes' },
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'showLiabilityItem3',
    label: 'Show liability item 3',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'showLiabilityItem2', equals: true },
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'showLiabilityItem4',
    label: 'Show liability item 4',
    type: 'checkbox',
    section: 'Conservator Balance Sheet',
    width: 12,
    includeInForm: false,
    includeInPdf: false,
    conditional: { fieldId: 'showLiabilityItem3', equals: true },
    pdf: { page: 10, x: 0, y: 0, fontSize: 10, maxWidth: 0 }
  },
  {
    id: 'hasBudgetOtherItem1',
    label: 'Do you have any "other" budget items to report?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 13, x: 108, y: 454, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBudgetOtherItem2',
    label: 'Do you have another "other" budget item to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasBudgetOtherItem1', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 445, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBudgetOtherItem3',
    label: 'Do you have a third "other" budget item to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalBudgetOtherItem2', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 418, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasGiftDisclosures',
    label: 'Do you need to report any gifts received from the protected person?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 13, x: 108, y: 264, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalGiftDetail2',
    label: 'Do you have another gift entry to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasGiftDisclosures', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 246, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalGiftDetail3',
    label: 'Do you have a third gift entry to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalGiftDetail2', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 228, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasBusinessBenefitDisclosures',
    label: 'Do you need to report any business relationships or benefits received from the protected person or estate?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    pdf: { page: 13, x: 108, y: 158, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBusinessBenefit2',
    label: 'Do you have another business-benefit entry to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasBusinessBenefitDisclosures', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 140, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalBusinessBenefit3',
    label: 'Do you have a third business-benefit entry to add?',
    type: 'radio',
    section: 'Conservator Proposed Budget',
    width: 12,
    options: YES_NO_OPTIONS,
    includeInPdf: false,
    conditional: { fieldId: 'hasAdditionalBusinessBenefit2', equals: 'yes' },
    pdf: { page: 13, x: 108, y: 122, fontSize: 10, maxWidth: 420 }
  },
  {
    id: 'hasAdditionalRequestedOrder2',
    label: 'How many additional requested orders would you like to add?',
    type: 'radio',
    section: 'Verification',
    width: 12,
    options: REQUESTED_ORDER_COUNT_OPTIONS,
    includeInPdf: false,
    pdf: { page: 14, x: 108, y: 644, fontSize: 10, maxWidth: 420 }
  }
]

/**
 * Guardian Ship Form Template
 * 
 * This schema drives both:
 * 1. Dynamic React Hook Form generation
 * 2. PDF coordinate-based text placement
 */
export const guardianShipFormTemplate: PdfTemplate = {
  id: 'guardian-ship-form',
  name: 'Guardian/Conservator\'s Report',
  version: '1.0.0',
  description: 'Annual report form for guardians and conservators',
  pdfPath: '/GuardianShipFormFillable.pdf',
  defaultFont: 'Helvetica',
  pageSize: {
    width: 612,  // US Letter width in points (8.5")
    height: 792  // US Letter height in points (11")
  },
  coordinateConfig: {
    pageNumberBase: 1,
    coordinateOrigin: 'pdf-bottom-left',
    debugCoordinateLabels: false
  },
  fields: [
    // ===== SECTION A: GENERAL INFORMATION =====
    {
      id: 'individualName',
      label: 'What is the protected person’s full name?',
      type: 'text',
      placeholder: 'Full name',
      section: 'General Information',
      width: 8,
      validation: { required: 'Individual name is required' },
      pdfFieldNames: ['Individual', 'IndividualFull Name'],
      pdf: { page: 1, x: 98.64, y: 508.08, fontSize: 11, maxWidth: 207.96 }
    },
    {
      id: 'caseNumber',
      label: 'What is the case or docket number?',
      type: 'text',
      placeholder: 'Case or docket number',
      section: 'General Information',
      width: 4,
      validation: { required: 'Case number is required' },
      pdfFieldNames: ['GuardianConservators Report'],
      pdf: { page: 1, x: 371.76, y: 538.68, fontSize: 11, maxWidth: 146.64 }
    },
    {
      id: 'countyName',
      label: 'Which county is this case filed in?',
      type: 'select',
      options: [{ label: 'Select a county', value: '' }, ...WASHINGTON_COUNTY_OPTIONS],
      section: 'General Information',
      width: 4,
      validation: { required: 'County name is required' },
      pdfFieldNames: ['No'],
      pdf: { page: 1, x: 345.36, y: 557.4, fontSize: 11, maxWidth: 190.32 }
    },

    // Report Type Checkboxes
    {
      id: 'reportType',
      label: 'Which type of report are you filing?',
      type: 'radio',
      section: 'General Information',
      width: 12,
      options: REPORT_TYPE_OPTIONS,
      includeInPdf: false,
      pdf: { page: 1, x: 348.22, y: 484.69, fontSize: 10, maxWidth: 220 }
    },
    {
      id: 'reportType12Month',
      label: '12-Month Report (ANR12)',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      validation: { required: 'Select at least one report type' },
      pdfFieldNames: ['Check Box6'],
      pdf: { page: 1, x: 348.875, y: 484.69, fontSize: 10 }
    },
    {
      id: 'reportType24Month',
      label: '24-Month Report (ANR24)',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box7'],
      pdf: { page: 1, x: 348.874, y: 468.98, fontSize: 10 }
    },
    {
      id: 'reportType36Month',
      label: '36-Month Report (ANR36)',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box8'],
      pdf: { page: 1, x: 348.874, y: 453.271, fontSize: 10 }
    },
    {
      id: 'reportTypeFinal',
      label: 'Final Report (RPT)',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box9'],
      pdf: { page: 1, x: 348.875, y: 438.217, fontSize: 10 }
    },

    // Scope Checkboxes
    {
      id: 'guardianshipScope',
      label: 'What is the scope of guardianship for the person?',
      type: 'radio',
      section: 'General Information',
      width: 12,
      options: SCOPE_OPTIONS,
      includeInPdf: false,
      pdf: { page: 1, x: 69.3821, y: 129.924, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'conservatorshipScope',
      label: 'What is the scope of conservatorship for the estate?',
      type: 'radio',
      section: 'General Information',
      width: 12,
      options: SCOPE_OPTIONS,
      includeInPdf: false,
      pdf: { page: 1, x: 69.3821, y: 112.252, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'guardianshipFull',
      label: 'Guardianship - Full',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box2'],
      pdf: { page: 1, x: 69.3821, y: 129.924, fontSize: 10 }
    },
    {
      id: 'guardianshipLimited',
      label: 'Guardianship - Limited',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box3'],
      pdf: { page: 1, x: 128.291, y: 130.579, fontSize: 10 }
    },
    {
      id: 'conservatorshipFull',
      label: 'Conservatorship - Full',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box4'],
      pdf: { page: 1, x: 69.3821, y: 112.252, fontSize: 10 }
    },
    {
      id: 'conservatorshipLimited',
      label: 'Conservatorship - Limited',
      type: 'checkbox',
      section: 'General Information',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box5'],
      pdf: { page: 1, x: 128.291, y: 111.597, fontSize: 10 }
    },

    // Guardian/Conservator Information
    {
      id: 'guardianName',
      label: 'What is your full name?',
      type: 'text',
      section: 'Guardian Information',
      width: 12,
      pdfFieldNames: ['GuardianConservatorFull Name', 'Print Name'],
      pdf: { page: 2, x: 140, y: 555, fontSize: 10, maxWidth: 350 }
    },
    {
      id: 'individualAddress',
      label: 'What is the protected person’s mailing street address?',
      type: 'text',
      section: 'Individual Information',
      width: 12,
      placeholder: 'Street address',
      pdfFieldNames: ['IndividualMailing Address'],
      pdf: { page: 2, x: 174.72, y: 592.68, fontSize: 10, maxWidth: 170.88 }
    },
    {
      id: 'individualCityName',
      label: 'What city does the protected person live in?',
      type: 'text',
      section: 'Individual Information',
      width: 5,
      includeInPdf: false,
      pdf: { page: 2, x: 174.36, y: 579.48, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualState',
      label: 'What state does the protected person live in?',
      type: 'select',
      options: US_STATE_OPTIONS,
      defaultValue: '',
      section: 'Individual Information',
      width: 3,
      includeInPdf: false,
      pdf: { page: 2, x: 174.36, y: 579.48, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualCity',
      label: 'What city and state does the protected person live in?',
      type: 'text',
      section: 'Individual Information',
      width: 8,
      includeInForm: false,
      pdfFieldNames: ['IndividualCity  State'],
      pdf: { page: 2, x: 174.36, y: 579.48, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualZip',
      label: 'What is the protected person’s ZIP code?',
      type: 'text',
      inputFormat: 'postal-code',
      validation: { pattern: /^\d{5}(?:-\d{4})?$/ },
      section: 'Individual Information',
      width: 4,
      pdfFieldNames: ['IndividualZip Code'],
      pdf: { page: 2, x: 174.36, y: 566.4, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualPhone',
      label: 'What is the protected person’s phone number?',
      type: 'tel',
      inputFormat: 'phone',
      validation: { pattern: /^(?=.*\d)\+?[\d\s().-]+$/ },
      section: 'Individual Information',
      width: 6,
      pdfFieldNames: ['IndividualTelephone'],
      pdf: { page: 2, x: 174.36, y: 553.2, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualFax',
      label: 'What is the protected person’s fax number?',
      type: 'tel',
      inputFormat: 'phone',
      validation: { pattern: /^(?=.*\d)\+?[\d\s().-]+$/ },
      section: 'Individual Information',
      width: 6,
      pdfFieldNames: ['IndividualFax Number'],
      pdf: { page: 2, x: 174.36, y: 540.12, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualEmail',
      label: 'What is the protected person’s email address?',
      type: 'email',
      section: 'Individual Information',
      width: 8,
      pdfFieldNames: ['IndividualEmail'],
      pdf: { page: 2, x: 174.36, y: 526.92, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'individualAge',
      label: 'How old is the protected person?',
      type: 'number',
      section: 'Individual Information',
      width: 4,
      validation: { min: 0, max: 120 },
      pdfFieldNames: ['IndividualAge'],
      pdf: { page: 2, x: 174.36, y: 513.72, fontSize: 10, maxWidth: 171.6 }
    },
    {
      id: 'guardianAddress',
      label: 'What is your mailing street address?',
      type: 'text',
      section: 'Guardian Information',
      width: 12,
      placeholder: 'Street address',
      pdfFieldNames: ['GuardianConservatorMailing Address'],
      pdf: { page: 2, x: 140, y: 540, fontSize: 10, maxWidth: 350 }
    },
    {
      id: 'guardianCityName',
      label: 'What city do you live in?',
      type: 'text',
      section: 'Guardian Information',
      width: 5,
      includeInPdf: false,
      pdf: { page: 2, x: 140, y: 525, fontSize: 10, maxWidth: 300 }
    },
    {
      id: 'guardianState',
      label: 'What state do you live in?',
      type: 'select',
      options: US_STATE_OPTIONS,
      defaultValue: '',
      section: 'Guardian Information',
      width: 3,
      includeInPdf: false,
      pdf: { page: 2, x: 140, y: 525, fontSize: 10, maxWidth: 300 }
    },
    {
      id: 'guardianCity',
      label: 'What city and state do you live in?',
      type: 'text',
      section: 'Guardian Information',
      width: 8,
      includeInForm: false,
      pdfFieldNames: ['GuardianConservatorCity  State'],
      pdf: { page: 2, x: 140, y: 525, fontSize: 10, maxWidth: 300 }
    },
    {
      id: 'guardianZip',
      label: 'What is your ZIP code?',
      type: 'text',
      inputFormat: 'postal-code',
      validation: { pattern: /^\d{5}(?:-\d{4})?$/ },
      section: 'Guardian Information',
      width: 4,
      pdfFieldNames: ['GuardianConservatorZip Code'],
      pdf: { page: 2, x: 470, y: 525, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'guardianPhone',
      label: 'What is your phone number?',
      type: 'tel',
      inputFormat: 'phone',
      validation: { pattern: /^(?=.*\d)\+?[\d\s().-]+$/ },
      section: 'Guardian Information',
      width: 6,
      pdfFieldNames: ['GuardianConservatorTelephone'],
      pdf: { page: 2, x: 140, y: 510, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'guardianFax',
      label: 'What is your fax number?',
      type: 'tel',
      inputFormat: 'phone',
      validation: { pattern: /^(?=.*\d)\+?[\d\s().-]+$/ },
      section: 'Guardian Information',
      width: 6,
      pdfFieldNames: ['GuardianConservatorFax Number'],
      pdf: { page: 2, x: 360, y: 510, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'guardianEmail',
      label: 'What is your email address?',
      type: 'email',
      section: 'Guardian Information',
      width: 8,
      pdfFieldNames: ['GuardianConservatorEmail'],
      pdf: { page: 2, x: 140, y: 495, fontSize: 10, maxWidth: 350 }
    },
    {
      id: 'guardianAge',
      label: 'How old are you?',
      type: 'number',
      section: 'Guardian Information',
      width: 4,
      validation: { min: 0, max: 120 },
      pdfFieldNames: ['GuardianConservatorAge'],
      pdf: { page: 2, x: 470, y: 495, fontSize: 10, maxWidth: 80 }
    },

    // Appointment & Reporting Period
    {
      id: 'appointmentDate',
      label: 'When were you appointed?',
      type: 'date',
      section: 'Reporting Period',
      width: 6,
      pdfFieldNames: ['The last report of the guardianconservator was approved by the court on date'],
      pdf: { page: 2, x: 140, y: 465, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'lastReportApprovedDate',
      label: 'When was your last report approved?',
      type: 'date',
      section: 'Reporting Period',
      width: 6,
      pdfFieldNames: ['This report covers the period from'],
      pdf: { page: 2, x: 350, y: 465, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'reportStartDate',
      label: 'When does this reporting period start?',
      type: 'date',
      section: 'Reporting Period',
      width: 6,
      pdfFieldNames: ['undefined'],
      pdf: { page: 2, x: 140, y: 450, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'reportEndDate',
      label: 'When does this reporting period end?',
      type: 'date',
      section: 'Reporting Period',
      width: 6,
      pdfFieldNames: ['The closing date for all reports is anniversary of appointment date'],
      pdf: { page: 2, x: 350, y: 450, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'reportClosingDate',
      label: 'What is the closing date for this report?',
      type: 'date',
      section: 'Reporting Period',
      width: 6,
      pdfFieldNames: ['the guardianconservator is required to file reports within 90 days of that date The'],
      pdf: { page: 2, x: 437.52, y: 414.48, fontSize: 10, maxWidth: 66.48 }
    },
    {
      id: 'reportingCycle',
      label: 'How often do you report?',
      type: 'select',
      section: 'Reporting Period',
      width: 6,
      defaultValue: 'twelve',
      options: [
        { label: '12 months', value: 'twelve' },
        { label: '24 months', value: 'twentyfour' },
        { label: '36 months', value: 'thirtysix' }
      ],
      includeInPdf: false,
      pdf: { page: 2, x: 140, y: 435, fontSize: 10, maxWidth: 150 }
    },

    // Reporting Period Criteria
    {
      id: 'continuereport12',
      label: 'Continue reporting every 12 months',
      type: 'checkbox',
      section: 'Reporting Criteria',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box12'],
      pdf: { page: 2, x: 140, y: 420, fontSize: 10 }
    },
    {
      id: 'continuereport24',
      label: 'Continue reporting every 24 months',
      type: 'checkbox',
      section: 'Reporting Criteria',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box13'],
      pdf: { page: 2, x: 140, y: 408, fontSize: 10 }
    },
    {
      id: 'continuereport36',
      label: 'Continue reporting every 36 months',
      type: 'checkbox',
      section: 'Reporting Criteria',
      width: 6,
      includeInForm: false,
      pdfFieldNames: ['Check Box14'],
      pdf: { page: 2, x: 140, y: 396, fontSize: 10 }
    },

    // Fraud, Abuse, Neglect
    {
      id: 'accusedOfFraud',
      label: 'Have you been accused of fraud, abuse, neglect, or breach of fiduciary duty?',
      type: 'radio',
      section: 'Reporting Criteria',
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box15'],
      pdf: { page: 2, x: 140, y: 365, fontSize: 10 }
    },
    {
      id: 'fraudExplanation',
      label: 'If yes, what happened?',
      type: 'textarea',
      section: 'Reporting Criteria',
      width: 12,
      conditional: { fieldId: 'accusedOfFraud', equals: 'yes' },
      pdfFieldNames: [
        'If you have please explain 1',
        'If you have please explain 2',
        'If you have please explain 3',
        'If you have please explain 4'
      ],
      pdf: { page: 2, x: 160, y: 355, fontSize: 9, maxWidth: 420, maxLines: 2 }
    },

    // Untimely Reports
    {
      id: 'untimelyReports',
      label: 'Have any of your reports been filed late?',
      type: 'radio',
      section: 'Reporting Criteria',
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box47'],
      pdf: { page: 2, x: 140, y: 330, fontSize: 10 }
    },
    {
      id: 'untimelyExplanation',
      label: 'If yes, please explain what was late.',
      type: 'textarea',
      section: 'Reporting Criteria',
      width: 12,
      conditional: { fieldId: 'untimelyReports', equals: 'yes' },
      pdfFieldNames: ['undefined_2', '1', '2', '3'],
      pdf: { page: 2, x: 160, y: 320, fontSize: 9, maxWidth: 420, maxLines: 2 }
    },

    // Monitored by Agencies
    {
      id: 'monitoredByAgencies',
      label: 'Is this matter monitored by any other agencies?',
      type: 'radio',
      section: 'Reporting Criteria',
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box18'],
      pdf: { page: 2, x: 140, y: 295, fontSize: 10 }
    },
    {
      id: 'agencyNames',
      label: 'Which agencies are involved?',
      type: 'textarea',
      section: 'Reporting Criteria',
      width: 12,
      conditional: { fieldId: 'monitoredByAgencies', equals: 'yes' },
      pdfFieldNames: ['Other', '1_2', '2_2'],
      pdf: { page: 2, x: 160, y: 285, fontSize: 9, maxWidth: 420 }
    },

    // Notice Parties
    {
      id: 'noticeParty1Name',
      label: 'Name of person to notify',
      type: 'text',
      section: 'Notice Parties',
      width: 4,
      pdfFieldNames: ['NameRow1'],
      pdf: { page: 3, x: 96.36, y: 681, fontSize: 10, maxWidth: 122.88 }
    },
    {
      id: 'noticeParty1Address',
      label: 'Full mailing address of person to notify, including city, state, and ZIP',
      type: 'text',
      section: 'Notice Parties',
      width: 5,
      placeholder: 'Street, city, state, ZIP',
      pdfFieldNames: ['Mailing AddressRow1'],
      pdf: { page: 3, x: 220.56, y: 681, fontSize: 10, maxWidth: 171.48 }
    },
    {
      id: 'noticeParty1Relationship',
      label: 'What is this person’s relationship to the protected person?',
      type: 'text',
      section: 'Notice Parties',
      width: 3,
      pdfFieldNames: ['Relationship to IndividualRow1'],
      pdf: { page: 3, x: 393.36, y: 681, fontSize: 10, maxWidth: 133.68 }
    },
    {
      id: 'hasAdditionalNoticeParty2',
      label: 'Is there anyone else we should notify?',
      type: 'radio',
      section: 'Notice Parties',
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      pdf: { page: 3, x: 96.36, y: 675, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'noticeParty2Name',
      label: 'Name of additional person to notify',
      type: 'text',
      section: 'Notice Parties',
      width: 4,
      conditional: { fieldId: 'hasAdditionalNoticeParty2', equals: 'yes' },
      pdfFieldNames: ['NameRow2'],
      pdf: { page: 3, x: 96.36, y: 667.92, fontSize: 10, maxWidth: 122.88 }
    },
    {
      id: 'noticeParty2Address',
      label: 'Full mailing address of additional person to notify, including city, state, and ZIP',
      type: 'text',
      section: 'Notice Parties',
      width: 5,
      placeholder: 'Street, city, state, ZIP',
      conditional: { fieldId: 'hasAdditionalNoticeParty2', equals: 'yes' },
      pdfFieldNames: ['Mailing AddressRow2'],
      pdf: { page: 3, x: 220.56, y: 667.92, fontSize: 10, maxWidth: 171.48 }
    },
    {
      id: 'noticeParty2Relationship',
      label: "What is this person’s relationship to the protected person?",
      type: 'text',
      section: 'Notice Parties',
      width: 3,
      conditional: { fieldId: 'hasAdditionalNoticeParty2', equals: 'yes' },
      pdfFieldNames: ['Relationship to IndividualRow2'],
      pdf: { page: 3, x: 393.36, y: 667.92, fontSize: 10, maxWidth: 133.68 }
    },
    {
      id: 'hasAdditionalNoticeParty3',
      label: 'Do you have a another person to notify?',
      type: 'radio',
      section: 'Notice Parties',
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      conditional: { fieldId: 'hasAdditionalNoticeParty2', equals: 'yes' },
      pdf: { page: 3, x: 96.36, y: 662, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'noticeParty3Name',
      label: 'Name of additional person to notify',
      type: 'text',
      section: 'Notice Parties',
      width: 4,
      conditional: { fieldId: 'hasAdditionalNoticeParty3', equals: 'yes' },
      pdfFieldNames: ['NameRow3'],
      pdf: { page: 3, x: 96.36, y: 654.72, fontSize: 10, maxWidth: 122.88 }
    },
    {
      id: 'noticeParty3Address',
      label: 'Full mailing address of additional person to notify, including city, state, and ZIP',
      type: 'text',
      section: 'Notice Parties',
      width: 5,
      placeholder: 'Street, city, state, ZIP',
      conditional: { fieldId: 'hasAdditionalNoticeParty3', equals: 'yes' },
      pdfFieldNames: ['Mailing AddressRow3'],
      pdf: { page: 3, x: 220.56, y: 654.72, fontSize: 10, maxWidth: 171.48 }
    },
    {
      id: 'noticeParty3Relationship',
      label: 'What is this person’s relationship to the protected person?',
      type: 'text',
      section: 'Notice Parties',
      width: 3,
      conditional: { fieldId: 'hasAdditionalNoticeParty3', equals: 'yes' },
      pdfFieldNames: ['Relationship to IndividualRow3'],
      pdf: { page: 3, x: 393.36, y: 654.72, fontSize: 10, maxWidth: 133.68 }
    },
    {
      id: 'hasAdditionalNoticeParty4',
      label: 'Do you have a fourth person to notify?',
      type: 'radio',
      section: 'Notice Parties',
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      conditional: { fieldId: 'hasAdditionalNoticeParty3', equals: 'yes' },
      pdf: { page: 3, x: 96.36, y: 649, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'noticeParty4Name',
      label: 'Name of person to notify',
      type: 'text',
      section: 'Notice Parties',
      width: 4,
      conditional: { fieldId: 'hasAdditionalNoticeParty4', equals: 'yes' },
      pdfFieldNames: ['NameRow4'],
      pdf: { page: 3, x: 96.36, y: 641.64, fontSize: 10, maxWidth: 122.88 }
    },
    {
      id: 'noticeParty4Address',
      label: 'Full mailing address of additional person to notify, including city, state, and ZIP',
      type: 'text',
      section: 'Notice Parties',
      width: 5,
      placeholder: 'Street, city, state, ZIP',
      conditional: { fieldId: 'hasAdditionalNoticeParty4', equals: 'yes' },
      pdfFieldNames: ['Mailing AddressRow4'],
      pdf: { page: 3, x: 220.56, y: 641.64, fontSize: 10, maxWidth: 171.48 }
    },
    {
      id: 'noticeParty4Relationship',
      label: 'What is this person’s relationship to the protected person?',
      type: 'text',
      section: 'Notice Parties',
      width: 3,
      conditional: { fieldId: 'hasAdditionalNoticeParty4', equals: 'yes' },
      pdfFieldNames: ['Relationship to IndividualRow4'],
      pdf: { page: 3, x: 393.36, y: 641.64, fontSize: 10, maxWidth: 133.68 }
    },

    // Benefits Received (Monthly Amounts)
    {
      id: 'ssdiAmount',
      label: 'Social Security Disability Insurance / Social Security Administration (SSDI / SSA) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_3'],
      pdf: { page: 3, x: 204.12, y: 373.2, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'ssiAmount',
      label: 'Supplemental Security Income (SSI) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_5'],
      pdf: { page: 3, x: 204.12, y: 354.6, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'vaPensionAmount',
      label: 'Veterans Affairs Pension (VA Pension) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_9'],
      pdf: { page: 3, x: 204.12, y: 317.28, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'gAUAmount',
      label: 'General Assistance Unemployable (GAU) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_7'],
      pdf: { page: 3, x: 204.12, y: 335.88, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'foodStampsAmount',
      label: 'Food Stamps / Supplemental Nutrition Assistance Program (SNAP) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_13'],
      pdf: { page: 3, x: 204.12, y: 279.96, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'medicaidAmount',
      label: 'Medicaid ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_4'],
      pdf: { page: 3, x: 402.12, y: 373.2, fontSize: 10, maxWidth: 98.88 }
    },
    {
      id: 'medicareAmount',
      label: 'Medicare ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_6'],
      pdf: { page: 3, x: 402.12, y: 354.6, fontSize: 10, maxWidth: 102 }
    },
    {
      id: 'copesAmount',
      label: 'Community Options Program Entry System (COPES) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_8'],
      pdf: { page: 3, x: 402.12, y: 335.88, fontSize: 10, maxWidth: 98.88 }
    },
    {
      id: 'tanfAmount',
      label: 'Temporary Assistance for Needy Families (TANF) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_10'],
      pdf: { page: 3, x: 402.12, y: 317.28, fontSize: 10, maxWidth: 98.88 }
    },
    {
      id: 'hudAmount',
      label: 'Housing and Urban Development Assistance (HUD) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_12'],
      pdf: { page: 3, x: 402.12, y: 298.56, fontSize: 10, maxWidth: 98.88 }
    },
    {
      id: 'liBenefitsAmount',
      label: 'Labor and Industries (L&I) Benefits ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_11'],
      pdf: { page: 3, x: 204.12, y: 298.56, fontSize: 10, maxWidth: 83.88 }
    },
    {
      id: 'ddaAmount',
      label: 'Developmental Disabilities Administration Services (DDA) ($)',
      type: 'number',
      section: 'Benefits',
      width: 3,
      pdfFieldNames: ['undefined_14'],
      pdf: { page: 3, x: 402.12, y: 279.96, fontSize: 10, maxWidth: 98.88 }
    },
    {
      id: 'otherBenefits',
      label: 'Other Benefits',
      type: 'textarea',
      section: 'Benefits',
      width: 12,
      conditional: { fieldId: 'showOtherBenefits', equals: true },
      pdfFieldNames: ['Other  Specify'],
      pdf: { page: 3, x: 140, y: 615, fontSize: 9, maxWidth: 350 }
    },

    // Trust Information
    {
      id: 'trustBeneficiary',
      label: 'Is the protected person a beneficiary of a trust?',
      type: 'radio',
      section: 'Trust Information',
      width: 6,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box49'],
      pdf: { page: 3, x: 140, y: 585, fontSize: 10 }
    },
    {
      id: 'trustReportsToCourt',
      label: 'Does that trust report to the court?',
      type: 'radio',
      section: 'Trust Information',
      width: 6,
      options: YES_NO_OPTIONS,
      conditional: { fieldId: 'trustBeneficiary', equals: 'yes' },
      pdfFieldNames: ['Check Box50'],
      pdf: { page: 3, x: 140, y: 570, fontSize: 10 }
    },
    {
      id: 'trustName',
      label: 'What is the trustee’s name?',
      type: 'text',
      section: 'Trust Information',
      width: 8,
      conditional: { fieldId: 'trustBeneficiary', equals: 'yes' },
      pdfFieldNames: ['applicable are'],
      pdf: { page: 3, x: 204.24, y: 198.72, fontSize: 9, maxWidth: 320 }
    },
    {
      id: 'trustAddress',
      label: 'What is the trustee’s full mailing address, including city, state, and ZIP?',
      type: 'text',
      section: 'Trust Information',
      width: 8,
      placeholder: 'Street, city, state, ZIP',
      includeInPdf: false,
      conditional: { fieldId: 'trustBeneficiary', equals: 'yes' },
      pdf: { page: 3, x: 160, y: 545, fontSize: 9, maxWidth: 400 }
    },
    {
      id: 'trustCaseNumber',
      label: 'What is the trust’s court case number, if any?',
      type: 'text',
      section: 'Trust Information',
      width: 6,
      includeInPdf: false,
      conditional: { fieldId: 'trustBeneficiary', equals: 'yes' },
      pdf: { page: 3, x: 160, y: 530, fontSize: 9, maxWidth: 200 }
    },

    // Inventory & Bond
    {
      id: 'inventoryOnFile',
      label: 'Is an inventory already on file?',
      type: 'radio',
      section: 'Inventory & Bond',
      width: 6,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box28'],
      pdf: { page: 3, x: 140, y: 500, fontSize: 10 }
    },
    {
      id: 'bondInPlace',
      label: 'Is there a bond currently in place?',
      type: 'radio',
      section: 'Inventory & Bond',
      width: 6,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box29'],
      pdf: { page: 3, x: 140, y: 488, fontSize: 10 }
    },
    {
      id: 'bondAmount',
      label: 'What is the current bond amount in dollars?',
      type: 'number',
      section: 'Inventory & Bond',
      width: 4,
      placeholder: 'Numeric amount',
      validation: { min: 0 },
      conditional: { fieldId: 'bondInPlace', equals: 'yes' },
      pdfFieldNames: ['There    is    is not currently a bond in place in the amount of'],
      pdf: { page: 3, x: 160, y: 478, fontSize: 10, maxWidth: 250 }
    },
    {
      id: 'bondNumber',
      label: 'What is the bond number?',
      type: 'text',
      section: 'Inventory & Bond',
      width: 4,
      conditional: { fieldId: 'bondInPlace', equals: 'yes' },
      pdfFieldNames: ['undefined_15'],
      pdf: { page: 3, x: 450, y: 478, fontSize: 10, maxWidth: 120 }
    },
    {
      id: 'blockedAccountsTotal',
      label: 'What is the total in blocked accounts?',
      type: 'number',
      section: 'Inventory & Bond',
      includeInForm: false,
      width: 6,
      pdfFieldNames: ['The total assets in blocked accounts is'],
      pdf: { page: 3, x: 160, y: 463, fontSize: 10, maxWidth: 250 }
    },
    {
      id: 'unblockedAccountsTotal',
      label: 'What is the total in unblocked accounts?',
      type: 'number',
      section: 'Inventory & Bond',
      includeInForm: false,
      includeInPdf: false,
      width: 6,
      pdfFieldNames: [],
      conditional: { fieldId: 'bondInPlace', equals: 'yes' },
      pdf: { page: 3, x: 450, y: 463, fontSize: 10, maxWidth: 120 }
    },
    {
      id: 'newBondAmount',
      label: 'If the bond should change, what new bond amount in dollars should be ordered?',
      type: 'number',
      section: 'Inventory & Bond',
      width: 8,
      placeholder: 'Numeric amount',
      validation: { min: 0 },
      conditional: { fieldId: 'bondRecommendation', equals: 'change' },
      pdfFieldNames: ['The bond should    remain or    should be changed to'],
      pdf: { page: 3, x: 160, y: 448, fontSize: 10, maxWidth: 250 }
    },
    {
      id: 'newBondAmountDisplay',
      label: 'Visible changed bond amount on the report ($)',
      type: 'number',
      section: 'Inventory & Bond',
      width: 8,
      includeInForm: false,
      conditional: { fieldId: 'bondRecommendation', equals: 'change' },
      pdf: { page: 4, x: 470, y: 693, fontSize: 10, maxWidth: 95 }
    },
    {
      id: 'finalReportUnblockAccount',
      label: 'Is this a final report requesting that the blocked account be released?',
      type: 'radio',
      section: 'Inventory & Bond',
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box33'],
      pdf: { page: 4, x: 140, y: 433, fontSize: 10 }
    },

    // Guardian/Conservator Fees
    {
      id: 'guardianFeesAmount',
      label: 'Fees Amount ($)',
      type: 'number',
      section: 'Fees & Allowances',
      width: 4,
      pdfFieldNames: ['guardianconservator was authorized to receive a monthly advance in the amount of'],
      pdf: { page: 4, x: 450, y: 750, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'guardianFeesFromDate',
      label: 'From Date',
      type: 'date',
      section: 'Fees & Allowances',
      width: 4,
      pdfFieldNames: ['through'],
      pdf: { page: 4, x: 140, y: 740, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'guardianFeesToDate',
      label: 'To Date',
      type: 'date',
      section: 'Fees & Allowances',
      width: 4,
      pdfFieldNames: ['The'],
      pdf: { page: 4, x: 300, y: 740, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'monthlyAdvanceAmount',
      label: 'Monthly Advance Amount ($)',
      type: 'number',
      section: 'Fees & Allowances',
      width: 4,
      pdfFieldNames: ['the amount of'],
      pdf: { page: 4, x: 450, y: 725, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'feesReceived',
      label: 'Did you receive fees during this accounting period?',
      type: 'radio',
      section: 'Fees & Allowances',
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      pdf: { page: 4, x: 140, y: 710, fontSize: 10 }
    },
    {
      id: 'feesReceivedAmount',
      label: 'How much did you receive in fees?',
      type: 'number',
      section: 'Fees & Allowances',
      width: 6,
      conditional: { fieldId: 'feesReceived', equals: 'yes' },
      pdfFieldNames: ['guardianconservator has attached to this report or has filed with this report a separate'],
      pdf: { page: 4, x: 160, y: 700, fontSize: 10, maxWidth: 250 }
    },
    {
      id: 'disburseAmount',
      label: 'Amount to Disburse from Assets ($)',
      type: 'number',
      section: 'Fees & Allowances',
      width: 4,
      pdfFieldNames: ['requesting that the amount of'],
      pdf: { page: 4, x: 450, y: 700, fontSize: 10, maxWidth: 120 }
    },

    // Attorney Fees
    {
      id: 'attorneyLawOffice',
      label: 'Law Office Name',
      type: 'text',
      section: 'Attorney Fees',
      width: 12,
      pdfFieldNames: ['for the time period of'],
      pdf: { page: 4, x: 140, y: 668, fontSize: 10, maxWidth: 350 }
    },
    {
      id: 'attorneyFeesAmount',
      label: 'Attorney Fees Amount ($)',
      type: 'number',
      section: 'Attorney Fees',
      width: 4,
      pdfFieldNames: ['be paid from guardianship assets Attached in'],
      pdf: { page: 4, x: 450, y: 668, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'attorneyFeesFromDate',
      label: 'From Date',
      type: 'date',
      section: 'Attorney Fees',
      width: 4,
      pdfFieldNames: ['this report or filed herewith is an itemized fee declaration that describes the legal'],
      pdf: { page: 4, x: 140, y: 665, fontSize: 10, maxWidth: 100 }
    },
    {
      id: 'attorneyFeesToDate',
      label: 'To Date',
      type: 'date',
      section: 'Attorney Fees',
      width: 4,
      pdfFieldNames: ['through_2'],
      pdf: { page: 4, x: 300, y: 665, fontSize: 10, maxWidth: 100 }
    },

    // Monthly Allowance
    {
      id: 'previousPeriodFeesTotal',
      label: 'Previous Period Fees Total ($)',
      type: 'number',
      section: 'Monthly Allowance',
      width: 6,
      pdfFieldNames: ['undefined_16'],
      pdf: { page: 4, x: 140, y: 650, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'monthlyAverage',
      label: 'Monthly Average ($)',
      type: 'number',
      section: 'Monthly Allowance',
      width: 6,
      pdfFieldNames: ['guardianconservator received during the previous accounting period was'],
      pdf: { page: 4, x: 300, y: 650, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'previousMonthlyAllowance',
      label: 'Previous Monthly Allowance ($)',
      type: 'number',
      section: 'Monthly Allowance',
      width: 4,
      pdfFieldNames: ['This'],
      pdf: { page: 4, x: 450, y: 650, fontSize: 10, maxWidth: 120 }
    },
    {
      id: 'requestedMonthlyAllowance',
      label: 'Requested Monthly Allowance ($)',
      type: 'number',
      section: 'Monthly Allowance',
      width: 4,
      pdfFieldNames: ['allowance paid monthly would be considered an advance on the fees and costs billed'],
      pdf: { page: 4, x: 140, y: 635, fontSize: 10, maxWidth: 150 }
    },
    {
      id: 'allowanceEffectiveDate',
      label: 'Effective Date',
      type: 'date',
      section: 'Monthly Allowance',
      width: 4,
      pdfFieldNames: ['Successor Guardian andor Conservator'],
      pdf: { page: 4, x: 300, y: 635, fontSize: 10, maxWidth: 150 }
    },

    // Successor Guardian/Conservator
    {
      id: 'successorNamed',
      label: 'Has a successor already been named?',
      type: 'radio',
      section: 'Successor',
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box34'],
      pdf: { page: 4, x: 140, y: 600, fontSize: 10 }
    },
    {
      id: 'successorStillAble',
      label: 'Is that successor still able to serve?',
      type: 'radio',
      section: 'Successor',
      width: 12,
      options: YES_NO_OPTIONS,
      conditional: { fieldId: 'successorNamed', equals: 'yes' },
      pdfFieldNames: ['Check Box35'],
      pdf: { page: 4, x: 140, y: 590, fontSize: 10 }
    },
    {
      id: 'successorNameAndAddress',
      label: 'Successor Name and Address',
      type: 'text',
      section: 'Successor',
      width: 12,
      includeInForm: false,
      includeInPdf: false,
      conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
      pdfFieldNames: ['as the successor   guardian    conservator Address'],
      pdf: { page: 5, x: 160, y: 575, fontSize: 10, maxWidth: 400 }
    },
    {
      id: 'successorName',
      label: 'What is the successor’s name?',
      type: 'text',
      section: 'Successor',
      width: 12,
      conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
      pdfFieldNames: ['as the successor   guardian    conservator Address'],
      pdf: { page: 5, x: 220, y: 708, fontSize: 10, maxWidth: 140 }
    },
    {
      id: 'successorAddress',
      label: 'What is the successor’s full mailing address, including city, state, and ZIP?',
      type: 'text',
      section: 'Successor',
      width: 12,
      placeholder: 'Street, city, state, ZIP',
      conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
      pdfFieldNames: ['The successor guardianconservator will serve when the following event occurs'],
      pdf: { page: 5, x: 438, y: 708, fontSize: 10, maxWidth: 95 }
    },
    {
      id: 'successorType',
      label: 'What role would the successor serve in?',
      type: 'select',
      section: 'Successor',
      width: 6,
      includeInPdf: false,
      defaultValue: 'guardian',
      options: [
        { label: 'Guardian', value: 'guardian' },
        { label: 'Conservator', value: 'conservator' },
        { label: 'Both', value: 'both' }
      ],
      conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
      pdf: { page: 5, x: 160, y: 545, fontSize: 10, maxWidth: 200 }
    },
    {
      id: 'eventTrigger',
      label: 'What event should trigger the successor to begin serving?',
      type: 'text',
      section: 'Successor',
      width: 12,
      placeholder: 'Short event description',
      conditional: { anyOfFieldIds: ['successorNamed', 'successorNominateNow'], equals: 'yes', fieldId: 'successorNamed' },
      pdf: { page: 5, x: 214, y: 676, fontSize: 8.5, maxWidth: 312 }
    },

    // ===== SECTION B: GUARDIAN'S REPORT =====
    {
      id: 'individualStatus',
      label: 'How is the protected person doing overall?',
      type: 'textarea',
      placeholder: 'Briefly describe the protected person’s overall well-being',
      section: "Guardian's Report",
      width: 12,
      includeInPdf: false,
      pdfFieldNames: ['Guardians Report'],
      pdf: { page: 5, x: 140, y: 450, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'individualConcerns',
      label: 'If you have concerns, what changes are you requesting?',
      type: 'textarea',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'individualStatusChangeRequested', equals: 'yes' },
      pdfFieldNames: [
        'guardian has the following concerns for which a change is requested 1',
        'guardian has the following concerns for which a change is requested 2',
        'guardian has the following concerns for which a change is requested 3',
        'guardian has the following concerns for which a change is requested 4'
      ],
      pdf: { page: 5, x: 140, y: 400, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'servicesReceived',
      label: 'What services and supports does the protected person receive?',
      type: 'textarea',
      placeholder: 'For example: medical care, education, vocational support, or daily services',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'services and other supports and services 1',
        'services and other supports and services 2',
        'services and other supports and services 3',
        'services and other supports and services 4'
      ],
      pdf: { page: 5, x: 140, y: 700, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'livingArrangements',
      label: 'What are the protected person’s living arrangements?',
      type: 'textarea',
      placeholder: 'Include any changes during this reporting period',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The Individuals living arrangements including any changes during this reporting period 1',
        'The Individuals living arrangements including any changes during this reporting period 2',
        'The Individuals living arrangements including any changes during this reporting period 3',
        'The Individuals living arrangements including any changes during this reporting period 4'
      ],
      pdf: { page: 5, x: 140, y: 650, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'medicalCondition',
      label: 'How would you describe the protected person’s medical condition?',
      type: 'textarea',
      placeholder: 'Describe any changes during this reporting period',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The Individuals medical condition including any changes during the reporting period 1',
        'The Individuals medical condition including any changes during the reporting period 2',
        'The Individuals medical condition including any changes during the reporting period 3'
      ],
      pdf: { page: 5, x: 140, y: 600, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'mentalCondition',
      label: 'How would you describe the protected person’s mental or emotional condition?',
      type: 'textarea',
      placeholder: 'Describe any changes during this reporting period',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The Individuals mental condition including any changes during the reporting period 1',
        'The Individuals mental condition including any changes during the reporting period 2'
      ],
      pdf: { page: 5, x: 140, y: 550, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'socialArrangements',
      label: 'How are the protected person’s social arrangements going?',
      type: 'textarea',
      placeholder: 'Describe any changes during this reporting period',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The Individuals social arrangements including any changes during the reporting period 1',
        'The Individuals social arrangements including any changes during the reporting period 2',
        'The Individuals social arrangements including any changes during the reporting period 3'
      ],
      pdf: { page: 6, x: 140, y: 500, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'functionalAbility',
      label: 'How is the protected person functioning day to day?',
      type: 'textarea',
      placeholder: 'Describe daily abilities and the support the protected person receives',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'services received during the reporting period 1',
        'services received during the reporting period 2',
        'services received during the reporting period 3',
        'services received during the reporting period 4'
      ],
      pdf: { page: 6, x: 140, y: 450, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'guardianActivities',
      label: 'What activities have you carried out for the protected person?',
      type: 'textarea',
      placeholder: 'Summarize the actions you took for the protected person’s benefit',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The following is a description of the guardians activities for the benefit of the Individual 1',
        'The following is a description of the guardians activities for the benefit of the Individual 2',
        'The following is a description of the guardians activities for the benefit of the Individual 3',
        'The following is a description of the guardians activities for the benefit of the Individual 4'
      ],
      pdf: { page: 6, x: 140, y: 400, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'visitedOrContactedIndividual',
      label: 'Did you visit or stay in contact with the protected person during this period?',
      type: 'radio',
      section: "Guardian's Report",
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      pdf: { page: 6, x: 140, y: 360, fontSize: 10 }
    },
    {
      id: 'guardianVisits',
      label: 'How have you visited or stayed in contact with the protected person?',
      type: 'textarea',
      placeholder: 'Summarize visits, check-ins, and other contact during this period',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'visitedOrContactedIndividual', equals: 'yes' },
      pdfFieldNames: [
        'the guardian visited with the Individual a list of dates may be attached as an Exhibit 1',
        'the guardian visited with the Individual a list of dates may be attached as an Exhibit 2',
        'the guardian visited with the Individual a list of dates may be attached as an Exhibit 3'
      ],
      pdf: { page: 6, x: 140, y: 350, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'visitDates',
      label: 'What were the visit dates?',
      type: 'textarea',
      placeholder: 'List the dates you visited or checked in',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'visitedOrContactedIndividual', equals: 'yes' },
      pdfFieldNames: ['undefined_17'],
      pdf: { page: 6, x: 140, y: 300, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'individualParticipation',
      label: 'How has the protected person participated in decision-making?',
      type: 'textarea',
      placeholder: 'Describe how the protected person participated in decisions during this period',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'Individuals Participation in Decision Making',
        'Describe the extent which the Individual participated in decision making 1',
        'Describe the extent which the Individual participated in decision making 2',
        'Describe the extent which the Individual participated in decision making 3',
        'Describe the extent which the Individual participated in decision making 4'
      ],
      pdf: { page: 6, x: 140, y: 250, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'carePlanConsistent',
      label: 'Is the current care plan consistent with the protected person’s values?',
      type: 'radio',
      section: "Guardian's Report",
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box53'],
      pdf: { page: 6, x: 140, y: 200, fontSize: 10 }
    },
    {
      id: 'carePlanChanges',
      label: 'What changes do you recommend to the care plan?',
      type: 'textarea',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'carePlanChangeRecommended', equals: 'yes' },
      pdfFieldNames: [
        'or    the guardian recommends these changes',
        '1_3',
        '2_3',
        '3_2',
        '4'
      ],
      pdf: { page: 6, x: 140, y: 150, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'giftsReceived',
      label: 'What gifts have you or your family received from the protected person?',
      type: 'textarea',
      placeholder: 'List any gifts of more than minimal value received by you, your spouse, or family members',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'following gifts from the Individual worth more than a minimal value as listed below 1',
        'following gifts from the Individual worth more than a minimal value as listed below 2',
        'following gifts from the Individual worth more than a minimal value as listed below 3',
        'following gifts from the Individual worth more than a minimal value as listed below 4',
        'following gifts from the Individual worth more than a minimal value as listed below 5'
      ],
      pdf: { page: 7, x: 140, y: 700, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'professionalNames',
      label: 'Which professionals or businesses have helped the protected person?',
      type: 'textarea',
      placeholder: 'List the names and the help or services they provided',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: ['Name 1', 'Name 2', 'Name 3'],
      pdf: { page: 7, x: 140, y: 650, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'professionalServicesProvided',
      label: 'What services did those professionals or businesses provide?',
      type: 'textarea',
      placeholder: 'Describe the services each listed professional or business provided',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: ['Services Provided 1', 'Services Provided 2', 'Services Provided 3'],
      pdf: { page: 7, x: 300, y: 650, fontSize: 9, maxWidth: 260 }
    },
    {
      id: 'professionalServices',
      label: 'What is your relationship to those professionals or businesses?',
      type: 'textarea',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: ['1_4', '2_4', '3_3', '4_2'],
      pdf: { page: 7, x: 140, y: 600, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'delegatedAuthority',
      label: 'What authority have you delegated to others, and why?',
      type: 'textarea',
      placeholder: 'Describe what you delegated, to whom, and why',
      section: "Guardian's Report",
      width: 12,
      pdfFieldNames: [
        'The guardian has delegated the following authority to an agent and the reason why 1',
        'The guardian has delegated the following authority to an agent and the reason why 2',
        'The guardian has delegated the following authority to an agent and the reason why 3',
        'The guardian has delegated the following authority to an agent and the reason why 4',
        'The guardian has delegated the following authority to an agent and the reason why 5'
      ],
      pdf: { page: 7, x: 140, y: 550, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'planDeviated',
      label: 'As guardian, have you deviated from the approved plan?',
      type: 'radio',
      section: "Guardian's Report",
      width: 12,
      options: YES_NO_OPTIONS,
      pdfFieldNames: ['Check Box54'],
      pdf: { page: 7, x: 140, y: 500, fontSize: 10 }
    },
    {
      id: 'deviationExplanation',
      label: 'If yes, how and why did you deviate from the plan?',
      type: 'textarea',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'planDeviated', equals: 'yes' },
      pdfFieldNames: ['why 1', 'why 2', '1_5', '2_5', '3_4'],
      pdf: { page: 7, x: 140, y: 450, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'futureCarePlan',
      label: 'What is your plan for the protected person’s future care?',
      type: 'textarea',
      placeholder: 'Describe the plan going forward',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'futureCarePlanChanged', equals: 'yes' },
      pdfFieldNames: [
        'The guardians care plan    remains the same or    is changed as follows 1',
        'The guardians care plan    remains the same or    is changed as follows 2',
        'The guardians care plan    remains the same or    is changed as follows 3',
        'The guardians care plan    remains the same or    is changed as follows 4',
        'The guardians care plan    remains the same or    is changed as follows 5',
        'The guardians care plan    remains the same or    is changed as follows 6'
      ],
      pdf: { page: 8, x: 140, y: 400, fontSize: 9, maxWidth: 420 }
    },
    {
      id: 'scopeChangeRecommended',
      label: 'Do you recommend changes to the scope of the guardian’s authority?',
      type: 'radio',
      section: "Guardian's Report",
      width: 12,
      options: YES_NO_OPTIONS,
      includeInPdf: false,
      conditional: {
        anyOfFieldIds: [
          'individualStatusChangeRequested',
          'carePlanChangeRecommended',
          'futureCarePlanChanged',
          'planDeviated'
        ],
        equals: 'yes',
        fieldId: 'individualStatusChangeRequested'
      },
      pdf: { page: 8, x: 140, y: 350, fontSize: 10 }
    },
    {
      id: 'scopeChangeDetails',
      label: 'What changes do you recommend?',
      type: 'textarea',
      section: "Guardian's Report",
      width: 12,
      conditional: { fieldId: 'scopeChangeRecommended', equals: 'yes' },
      pdfFieldNames: ['changed as follows 1', 'changed as follows 2'],
      pdf: { page: 8, x: 140, y: 300, fontSize: 9, maxWidth: 420 }
    },
    ...supplementalCheckboxFields,
    ...assetValueDisplayFields,
    ...supplementalPromptFields,
    ...supplementalTextFields
  ],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['guardian', 'conservator', 'annual-report', 'court']
  }
}

/**
 * Get fields grouped by section
 */
export const getFieldsBySection = (template: PdfTemplate): Map<string, TemplateField[]> => {
  const sections = new Map<string, TemplateField[]>()
  
  for (const field of template.fields) {
    const sectionName = field.section || 'Other'
    const existing = sections.get(sectionName) || []
    existing.push(field)
    sections.set(sectionName, existing)
  }
  
  return sections
}

/**
 * Get validation schema for React Hook Form from template
 */
export const getValidationSchema = (template: PdfTemplate): Record<string, any> => {
  const schema: Record<string, any> = {}
  
  for (const field of template.fields) {
    if (!field.validation) continue
    
    const rules: any = {}
    
    if (field.validation.required) {
      rules.required = typeof field.validation.required === 'string' 
        ? field.validation.required 
        : 'This field is required'
    }
    
    if (field.validation.minLength) {
      rules.minLength = { 
        value: field.validation.minLength, 
        message: `Minimum ${field.validation.minLength} characters required` 
      }
    }
    
    if (field.validation.maxLength) {
      rules.maxLength = { 
        value: field.validation.maxLength, 
        message: `Maximum ${field.validation.maxLength} characters allowed` 
      }
    }
    
    if (field.validation.pattern) {
      rules.pattern = { 
        value: field.validation.pattern, 
        message: 'Invalid format' 
      }
    }
    
    if (field.validation.min !== undefined) {
      rules.min = { 
        value: field.validation.min, 
        message: `Minimum value is ${field.validation.min}` 
      }
    }
    
    if (field.validation.max !== undefined) {
      rules.max = { 
        value: field.validation.max, 
        message: `Maximum value is ${field.validation.max}` 
      }
    }
    
    if (field.validation.validate) {
      rules.validate = field.validation.validate
    }
    
    schema[field.id] = rules
  }
  
  return schema
}
