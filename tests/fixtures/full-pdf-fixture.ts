import { guardianShipFormTemplate } from '../../src/templates/guardianShipForm.template'
import type { TemplateField, TemplateFormData } from '../../src/types/template.types'

const INDIVIDUAL_NAME = 'Jordan Alvarez'
const GUARDIAN_NAME = 'Maya Chen'
const INDIVIDUAL_AGE = '67'
const GUARDIAN_AGE = '42'

const PERSON_FIXTURES = [
  INDIVIDUAL_NAME,
  GUARDIAN_NAME,
  'Samuel Brooks',
  'Elena Park',
  'Renee Foster',
  'Daniel Kim',
  'Olivia Nguyen',
  'Marcus Reed'
]

const ADDRESS_FIXTURES = [
  '412 Pine St',
  '118 Cedar Ave',
  '907 Maple Dr',
  '255 Harbor Way',
  '63 Willow Ln',
  '1448 Grant St',
  '820 Sunset Blvd',
  '3916 Birch Rd'
]

const CITY_FIXTURES = [
  { city: 'Seattle', zip: '98104' },
  { city: 'Tacoma', zip: '98402' },
  { city: 'Spokane', zip: '99201' },
  { city: 'Bellevue', zip: '98004' },
  { city: 'Yakima', zip: '98901' },
  { city: 'Everett', zip: '98201' }
]

const SERVICE_FIXTURES = [
  'Medication management and primary care follow-up',
  'Supported decision-making coaching',
  'Weekly physical therapy and transportation support',
  'Vocational support and job coaching'
]

const GIFT_FIXTURES = [
  'Birthday flowers and a card',
  'Holiday gift basket valued at $40',
  'Framed family photo and blanket',
  'Restaurant meal after a family visit'
]

const BUSINESS_FIXTURES = [
  'Harbor Medical Supply',
  'Evergreen Care Transit',
  'North Sound Tax Service',
  'Cedar Grove Pharmacy'
]

const RELATIONSHIP_FIXTURES = [
  'Adult daughter',
  'Brother',
  'Family friend',
  'Professional fiduciary'
]

const GENERIC_TEXT_FIXTURES = [
  'No material change reported',
  'Documentation attached to this report',
  'Routine follow-up completed',
  'See attached account summary'
]

const BALANCE_SHEET_INSTITUTIONS = [
  {
    name: 'Sound Community Bank',
    addressLine1: '1450 Market St',
    addressLine2: 'Suite 210',
    city: 'Seattle',
    zip: '98104',
    accountLast4: '4368',
    balanceDate: '06/02/2026',
    interestRate: '4.25',
    maturityDate: '06/23/2026',
    startBalance: '7975',
    endBalance: '8000'
  },
  {
    name: 'Rainier Credit Union',
    addressLine1: '820 Pacific Ave',
    addressLine2: 'Floor 3',
    city: 'Tacoma',
    zip: '98402',
    accountLast4: '4372',
    balanceDate: '06/09/2026',
    interestRate: '3.85',
    maturityDate: '06/24/2026',
    startBalance: '8075',
    endBalance: '8100'
  },
  {
    name: 'Cascadia Trust',
    addressLine1: '255 Riverfront Pl',
    addressLine2: 'Trust Services',
    city: 'Spokane',
    zip: '99201',
    accountLast4: '4384',
    balanceDate: '06/16/2026',
    interestRate: '4.10',
    maturityDate: '06/25/2026',
    startBalance: '9250',
    endBalance: '9275'
  },
  {
    name: 'Harbor Asset Bank',
    addressLine1: '901 Dock St',
    addressLine2: 'Private Client Group',
    city: 'Everett',
    zip: '98201',
    accountLast4: '4396',
    balanceDate: '06/26/2026',
    interestRate: '4.50',
    maturityDate: '06/26/2026',
    startBalance: '9650',
    endBalance: '9675'
  }
] as const

const PERSONAL_PROPERTY_ITEMS = ['Jewelry', 'Furniture', 'Vehicle'] as const
const RECEIVABLE_ITEMS = ['Security deposit', 'Insurance refund', 'Family sale note'] as const
const LIABILITY_ITEMS = [
  'Documentation review loan',
  'Routine follow-up lien',
  'See attached account payable',
  'Loan # Promissory note'
] as const

const MULTILINE_DETAIL_FIXTURES = [
  'Follow-up remains on schedule.',
  'No safety concerns were noted.',
  'The care team supports the current plan.',
  'Services continue without interruption.'
]

function parseOrdinalFromLabel(label: string, pattern: RegExp): number | null {
  const match = label.match(pattern)
  if (!match) {
    return null
  }

  const index = Number.parseInt(match[1], 10)
  return Number.isFinite(index) && index > 0 ? index - 1 : null
}

function getBalanceSheetInstitution(field: TemplateField): (typeof BALANCE_SHEET_INSTITUTIONS)[number] | null {
  const index = parseOrdinalFromLabel(field.label, /^Financial Institution (\d+)/i)
  if (index === null) {
    const pdfFieldName = field.pdfFieldNames?.[0] ?? ''
    const institutionIndexByPdfFieldName: Record<string, number> = {
      'Financial Institution': 0,
      Address: 0,
      Address_2: 0,
      'City WA Zip': 0,
      'Account No last 4 digits': 0,
      undefined_21: 0,
      undefined_22: 0,
      'Balance as of': 0,
      'Account No last 4 digits_2': 1,
      undefined_23: 1,
      undefined_24: 1,
      'Balance as of_2': 1,
      'Financial Institution_2': 2,
      Address_3: 2,
      Address_4: 2,
      'City WA Zip_2': 2,
      'Account No last 4 digits_3': 2,
      'Interest Rate': 2,
      'Maturity Date': 2,
      undefined_25: 2,
      undefined_26: 2,
      'Balance as of_3': 2,
      'Financial Institution_3': 3,
      Address_5: 3,
      Address_6: 3,
      'City WA Zip_3': 3,
      'Account No last 4 digits_4': 3,
      'Interest Rate_2': 3,
      'Maturity Date_2': 3,
      undefined_29: 3,
      undefined_30: 3,
      'Balance as of_4': 3
    }

    const fallbackIndex = institutionIndexByPdfFieldName[pdfFieldName]
    return fallbackIndex === undefined ? null : BALANCE_SHEET_INSTITUTIONS[fallbackIndex] ?? null
  }

  return BALANCE_SHEET_INSTITUTIONS[index] ?? null
}

const FULL_COVERAGE_OVERRIDES: TemplateFormData = {
  countyName: 'King',
  individualName: INDIVIDUAL_NAME,
  individualAge: INDIVIDUAL_AGE,
  guardianName: GUARDIAN_NAME,
  guardianAge: GUARDIAN_AGE,
  bondAmount: '7500',
  newBondAmount: '12000',
  bondNumber: 'BND-240617',
  reportType: '12',
  finalReportUnblockAccount: 'no',
  futureReportingInterval: '12',
  bondRecommendation: 'change',
  guardianshipScope: 'full',
  conservatorshipScope: 'limited',
  successorNominationChoice: 'nominate_now',
  successorNamed: 'yes',
  successorStillAble: 'yes',
  successorType: 'both',
  visitedOrContactedIndividual: 'yes',
  carePlanConsistent: 'yes',
  carePlanChangeRecommended: 'yes',
  individualStatusChangeRequested: 'yes',
  futureCarePlanChanged: 'yes',
  scopeChangeRecommended: 'yes',
  planDeviated: 'yes',
  accusedOfFraud: 'yes',
  untimelyReports: 'yes',
  monitoredByAgencies: 'yes',
  trustBeneficiary: 'yes',
  trustReportsToCourt: 'yes',
  inventoryOnFile: 'yes',
  bondInPlace: 'yes',
  hasAdditionalNoticeParty2: 'yes',
  hasAdditionalNoticeParty3: 'yes',
  hasAdditionalNoticeParty4: 'yes',
  hasRealPropertyAssets: 'yes',
  hasReceivables: 'yes',
  hasUnblockedLiquidAssets: 'yes',
  hasBalanceSheetInstitution2: 'yes',
  hasBalanceSheetInstitution3: 'yes',
  hasAdditionalBlockedAccountUnderInstitution1: 'yes',
  hasBalanceSheetInstitution4: 'yes',
  hasLiquidAssets: 'yes',
  hasAdditionalLiquidAssetItem2: 'yes',
  hasAdditionalBalanceSheetDetails: 'yes',
  hasOtherEstateIncome: 'yes',
  hasOtherEstateExpense: 'yes',
  hasLargeExpenditureExplanation1: 'yes',
  hasAdditionalLargeExpenditureExplanation2: 'yes',
  hasAdditionalLargeExpenditureExplanation3: 'yes',
  hasAdditionalLargeExpenditureExplanation4: 'yes',
  hasAdditionalLargeExpenditureExplanation5: 'yes',
  hasAdditionalLargeExpenditureExplanation6: 'yes',
  hasAdditionalLargeExpenditureExplanation7: 'yes',
  hasAdditionalLargeExpenditureExplanation8: 'yes',
  hasAdditionalLargeExpenditureExplanation9: 'yes',
  hasServicesReceived1: 'yes',
  hasAdditionalServicesReceived2: 'yes',
  hasAdditionalServicesReceived3: 'yes',
  hasAdditionalScopeChangeDetail2: 'yes',
  hasAdditionalScopeChangeDetail3: 'yes',
  hasAdditionalScopeChangeDetail4: 'yes',
  hasAdditionalConservatorPlanDetail2: 'yes',
  hasAdditionalConservatorPlanDetail3: 'yes',
  hasAdditionalConservatorPlanDetail4: 'yes',
  hasBudgetOtherItem1: 'yes',
  hasAdditionalBudgetOtherItem2: 'yes',
  hasAdditionalBudgetOtherItem3: 'yes',
  hasGiftDisclosures: 'yes',
  hasAdditionalGiftDetail2: 'yes',
  hasAdditionalGiftDetail3: 'yes',
  hasBusinessBenefitDisclosures: 'yes',
  hasAdditionalBusinessBenefit2: 'yes',
  hasAdditionalBusinessBenefit3: 'yes',
  hasAdditionalRequestedOrder2: '2',
  showOtherBenefits: true,
  showRealPropertyItem2: true,
  showRealPropertyItem3: true,
  showReceivableItem2: true,
  showReceivableItem3: true,
  showLiquidAssetItem3: true,
  showLiabilityItem2: true,
  showLiabilityItem3: true,
  showLiabilityItem4: true
}

export function buildWholePdfFixture(): TemplateFormData {
  const formData: TemplateFormData = {}

  guardianShipFormTemplate.fields.forEach((field, index) => {
    if (field.includeInForm === false || field.type === 'signature' || field.type === 'file') {
      return
    }

    const value = createFixtureValue(field, index)
    if (value !== undefined) {
      formData[field.id] = value
    }
  })

  return {
    ...formData,
    ...FULL_COVERAGE_OVERRIDES
  }
}

function createFixtureValue(field: TemplateField, index: number): string | boolean | undefined {
  switch (field.type) {
    case 'text':
      return textFixtureValue(field, index)
    case 'textarea':
      if (field.pdf.maxLines === 1) {
        return textFixtureValue(field, index)
      }

      return buildTextareaFixtureValue(field, index)
    case 'number':
      return numberFixtureValue(field, index)
    case 'date':
      return `2026-06-${String((index % 27) + 1).padStart(2, '0')}`
    case 'email':
      return `contact${index + 1}@example.org`
    case 'tel':
      return `20655501${String(index % 10).padStart(2, '0')}`
    case 'checkbox':
      return true
    case 'radio':
      return selectPreferredOption(field, ['yes', 'change', 'both', 'full', '12'])
    case 'select':
      return selectPreferredOption(field, ['WA', 'change', 'both', 'full', '12'])
    default:
      return undefined
  }
}

function textFixtureValue(field: TemplateField, index: number): string {
  const id = field.id.toLowerCase()
  const label = field.label.toLowerCase()
  const pdfFieldName = field.pdfFieldNames?.[0] ?? ''
  const cityFixture = pickFixture(CITY_FIXTURES, index)
  const balanceSheetInstitution = getBalanceSheetInstitution(field)

  const legacyBalanceSheetLabels: Record<string, string> = {
    '1_6': 'Jewelry',
    '2_6': 'Furniture',
    '3_5': 'Vehicle',
    undefined_19: 'Security deposit',
    undefined_20: 'Insurance refund',
    '3_6': 'Family sale note',
    '1_7': 'Supplemental care item',
    '2_7': 'Court-approved transportation expense'
  }

  if (legacyBalanceSheetLabels[pdfFieldName]) {
    return legacyBalanceSheetLabels[pdfFieldName]
  }

  if (balanceSheetInstitution) {
    if (label.includes('name')) return balanceSheetInstitution.name
    if (label.includes('address line 1')) return balanceSheetInstitution.addressLine1
    if (label.includes('address line 2')) return balanceSheetInstitution.addressLine2
    if (label.endsWith(' city')) return balanceSheetInstitution.city
    if (label.endsWith(' zip code')) return balanceSheetInstitution.zip
    if (label.includes('account number')) return balanceSheetInstitution.accountLast4
    if (label.includes('balance as of date')) return balanceSheetInstitution.balanceDate
  }

  const personalPropertyIndex = parseOrdinalFromLabel(field.label, /^What is the name of personal property item (\d+)/i)
  if (personalPropertyIndex !== null) {
    return PERSONAL_PROPERTY_ITEMS[personalPropertyIndex] ?? PERSONAL_PROPERTY_ITEMS[0]
  }

  const receivableIndex = parseOrdinalFromLabel(field.label, /^What is the name of receivable item (\d+)/i)
  if (receivableIndex !== null) {
    return RECEIVABLE_ITEMS[receivableIndex] ?? RECEIVABLE_ITEMS[0]
  }

  const liabilityIndex = parseOrdinalFromLabel(field.label, /^Liability (\d+) description$/i)
  if (liabilityIndex !== null) {
    return LIABILITY_ITEMS[liabilityIndex] ?? LIABILITY_ITEMS[0]
  }

  if (id === 'individualname') return INDIVIDUAL_NAME
  if (id === 'guardianname') return GUARDIAN_NAME
  if (isStandaloneMailingAddressField(field.id, id, label)) return buildFullMailingAddress(index)
  if (id === 'countyname' || label.includes('county')) return 'King'
  if (id === 'eventtrigger' || label.includes('begin serving')) {
    return 'Upon resignation, removal, or death of the current guardian'
  }
  if (label.includes('large or unusual expenditure')) {
    return pickFixture([
      'Wheelchair-accessible van repair and lift replacement',
      'One-time dental surgery and anesthesia costs',
      'Security deposit for a higher-support adult family home',
      'Court-approved adaptive communication device purchase'
    ], index)
  }
  if (label.includes('recommended change in scope of authority')) {
    return pickFixture([
      'Add authority to coordinate secure placement transitions',
      'Clarify authority for telehealth consent and scheduling',
      'Limit cash handling while preserving medical decision authority',
      'Expand authority to arrange in-home safety supports'
    ], index)
  }
  if (label.includes('deviated from the approved plan')) {
    return pickFixture([
      'Temporary change in transportation vendor due to service interruption',
      'Adjusted appointment schedule to address a hospitalization',
      'Used a substitute care provider during staffing shortages',
      'Delayed a planned move pending medical stabilization'
    ], index)
  }
  if (id === 'individualstatus') return 'Stable, safe, and engaged in services'
  if (id === 'individualconcerns') return 'Request updated visitation schedule and medication review'
  if (id === 'individualparticipation') return 'Participates in care meetings and daily choices'
  if (id === 'servicesreceived') return SERVICE_FIXTURES[1]
  if (id === 'visitdates') return '06/03/2026, 06/17/2026'
  if (id === 'livingarrangements') return 'Continues to reside at Maple Grove Adult Family Home'
  if (id === 'medicalcondition') return 'Routine follow-up visits with no hospitalizations'
  if (id === 'mentalcondition') return 'Mood remains stable with regular counseling'
  if (id === 'guardianactivities') return 'Managed appointments, benefits, and care coordination'
  if (id === 'guardianvisits') return 'Visited monthly in person and called weekly'
  if (id === 'decisionmakingparticipation') return 'Participates in care meetings and daily choices'
  if (balanceSheetInstitution && (id.endsWith('state') || label.endsWith(' state'))) return 'WA'
  if (id.includes('city')) return cityFixture.city
  if (id.endsWith('state') || label.includes(' state')) return 'WA'
  if (id.includes('zip')) return cityFixture.zip
  if (id.includes('email')) return `guardian${index + 1}@example.org`
  if (id.includes('phone') || id.includes('fax')) return `20655501${String(index % 10).padStart(2, '0')}`
  if (id.includes('accountnolast4digits') || label.includes('last 4 digits')) return String(4100 + (index % 500))
  if (label.includes('interest rate')) return '4.25'
  if (label.includes('maturity date')) return '06/30/2026'
  if (id.includes('financialinstitution') || label.includes('financial institution')) {
    return pickFixture(['Sound Community Bank', 'Rainier Credit Union', 'Cascadia Trust'], index)
  }
  if (label.includes('personal property item')) {
    return pickFixture(['Furniture', 'Jewelry', 'Vehicle'], index)
  }
  if (label.includes('receivable item')) {
    return pickFixture(['Family sale note', 'Insurance refund', 'Security deposit'], index)
  }
  if (label.includes('service or support')) {
    if (label.includes('another')) return SERVICE_FIXTURES[1]
    if (label.includes('one more')) return SERVICE_FIXTURES[2]
    return SERVICE_FIXTURES[0]
  }
  if (id === 'casenumber') return '24-7-12345'
  if (label.includes('estimated receipt')) return pickFixture(['Social Security deposit', 'Pension payment', 'VA benefits'], index)
  if (label.includes('other estate income source')) return 'Other rental income'
  if (label.includes('other estate expense')) return 'Additional transportation reimbursement'
  if (label.includes('comments for')) {
    return pickFixture([
      'Reflects current contracted monthly rate.',
      'Amount tracks recurring monthly expense.',
      'No unusual variance expected this year.',
      'Based on current provider invoices.'
    ], index)
  }
  if (label.includes('additional requested order')) {
    return pickFixture([
      'Approve continued authority to coordinate residential services',
      'Approve reimbursement of documented transportation expenses'
    ], index)
  }
  if (id.includes('address')) return pickFixture(ADDRESS_FIXTURES, index)
  if (id.includes('lawoffice') || label.includes('law office')) return 'Clark & Morales PLLC'
  if (id.includes('wsba') || label.includes('cpg')) return '51234'
  if (id.includes('guardianname') || label.includes('print name')) return GUARDIAN_NAME
  if (label.includes('receipt')) return pickFixture(['Social Security deposit', 'Pension payment', 'VA benefits'], index)
  if (label.includes('service')) return pickFixture(SERVICE_FIXTURES, index)
  if (label.includes('business')) return pickFixture(BUSINESS_FIXTURES, index)
  if (label.includes('gift')) return pickFixture(GIFT_FIXTURES, index)
  if (label.includes('business relationship') || label.includes('business benefit')) return pickFixture(BUSINESS_FIXTURES, index)
  if (label.includes('loan')) return `Promissory note 2026-${String(index + 1).padStart(3, '0')}`
  if (label.includes('relationship')) return pickFixture(RELATIONSHIP_FIXTURES, index)
  if (label.includes('name')) return pickFixture(PERSON_FIXTURES, index)
  if (id.includes('other') || label.includes('describe')) {
    return pickFixture([
      'Court-approved transportation expense',
      'Supplemental care item',
      'Estate-related reimbursement',
      'Medication co-pay reserve'
    ], index)
  }

  return pickFixture(GENERIC_TEXT_FIXTURES, index)
}

function textareaContinuationValue(field: TemplateField, index: number): string {
  const id = field.id.toLowerCase()
  const label = field.label.toLowerCase()

  if (id === 'individualconcerns') return 'Guardian requests review before the next reporting period.'
  if (id === 'servicesreceived') return 'Transportation and medication support continue as arranged.'
  if (id === 'visitdates') return ''
  if (id === 'livingarrangements') return 'Placement has remained stable throughout the period.'
  if (id === 'medicalcondition') return 'Care team reports treatment compliance and steady progress.'
  if (id === 'mentalcondition') return 'Counseling and medication monitoring continue as recommended.'
  if (label.includes('gift')) return 'Value remained below any threshold requiring additional approval.'
  if (label.includes('business')) return 'No direct personal benefit to the conservator was reported.'
  if (label.includes('service')) return 'Transportation and medication support continue as arranged.'

  return pickFixture(MULTILINE_DETAIL_FIXTURES, index)
}

function buildTextareaFixtureValue(field: TemplateField, index: number): string {
  if (shouldUseCommaSeparatedMultilineFixture(field)) {
    return buildCommaSeparatedTextareaFixture(field, index)
  }

  const primaryValue = textFixtureValue(field, index)
  const continuationValue = textareaContinuationValue(field, index)
  return formatMultilineEntries([primaryValue, continuationValue])
}

function shouldUseCommaSeparatedMultilineFixture(field: TemplateField): boolean {
  const id = field.id.toLowerCase()
  const label = field.label.toLowerCase()

  return [
    id === 'servicesreceived',
    id === 'giftsreceived',
    id === 'professionalnames',
    id === 'professionalservicesprovided',
    id === 'professionalservices',
    label.includes('services and supports'),
    label.includes('what gifts have you'),
    label.includes('which professionals or businesses'),
    label.includes('what services did those professionals'),
    label.includes('relationship to those professionals or businesses')
  ].some(Boolean)
}

function ensureTrailingComma(value: string): string {
  return `${value.trim().replace(/[.,;:]+$/, '')},`
}

function buildCommaSeparatedTextareaFixture(field: TemplateField, index: number): string {
  return formatMultilineEntries([textFixtureValue(field, index), textareaContinuationValue(field, index)])
}

function numberFixtureValue(field: TemplateField, index: number): string {
  const id = field.id.toLowerCase()
  const label = field.label.toLowerCase()
  const balanceSheetInstitution = getBalanceSheetInstitution(field)

  if (id === 'individualage') return INDIVIDUAL_AGE
  if (id === 'guardianage') return GUARDIAN_AGE
  if (id === 'bondamount') return '7500'
  if (id === 'newbondamount') return '12000'
  if (balanceSheetInstitution) {
    if (label.includes('interest rate')) return balanceSheetInstitution.interestRate
    if (label.includes('value at start of accounting')) return balanceSheetInstitution.startBalance
    if (label.includes('value at end of accounting')) return balanceSheetInstitution.endBalance
  }
  if (id.startsWith('realpropertyworth')) {
    return String(({ 1: 1450, 2: 850, 3: 3200 } as Record<number, number>)[Number.parseInt(id.slice(-1), 10)] ?? 1450)
  }
  if (id.startsWith('receivableworth')) {
    return String(({ 1: 900, 2: 225, 3: 640 } as Record<number, number>)[Number.parseInt(id.slice(-1), 10)] ?? 900)
  }
  if (/^undefined_4[3-9]$/.test(id) || id === 'undefined_50') {
    const liabilityValues = ['9650', '9675', '9700', '9725', '9750', '9775', '9825', '9850']
    const liabilityOffset = Number.parseInt(id.replace('undefined_', ''), 10) - 43
    return liabilityValues[liabilityOffset] ?? liabilityValues[0]
  }

  return String(1250 + index * 25)
}

function buildFullMailingAddress(index: number): string {
  const street = pickFixture(ADDRESS_FIXTURES, index)
  const { city, zip } = pickFixture(CITY_FIXTURES, index)
  return `${street}, ${city}, WA ${zip}`
}

function isStandaloneMailingAddressField(rawId: string, id: string, label: string): boolean {
  if (rawId === 'individualAddress' || rawId === 'guardianAddress') {
    return false
  }

  if (/^Address(?:_\d+)?$/i.test(rawId)) {
    return false
  }

  return id.includes('address') && !label.includes('line 1') && !label.includes('line 2')
}

function formatMultilineEntries(values: string[]): string {
  const entries = values.map(value => value.trim()).filter(Boolean)

  return entries
    .map((value, entryIndex) => (entryIndex < entries.length - 1 ? ensureTrailingComma(value) : value))
    .join('\n')
}

function pickFixture<T>(fixtures: T[], index: number): T {
  return fixtures[index % fixtures.length]
}

function selectPreferredOption(field: TemplateField, preferredValues: string[]): string | undefined {
  if (!field.options || field.options.length === 0) {
    return undefined
  }

  for (const preferredValue of preferredValues) {
    const match = field.options.find(option => String(option.value) === preferredValue)
    if (match) {
      return String(match.value)
    }
  }

  const firstMeaningfulOption = field.options.find(option => String(option.value).trim() !== '')
  return firstMeaningfulOption ? String(firstMeaningfulOption.value) : undefined
}
