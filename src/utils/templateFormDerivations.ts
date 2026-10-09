import type { TemplateFormData } from '../types/template.types'

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

function normalizeDerivedBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return isCheckedValue(value)
}

function readDerivedAmount(formData: TemplateFormData, fieldId: string): number {
  const rawValue = formData[fieldId]
  const parsedValue = typeof rawValue === 'string' ? Number(rawValue) : Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function sumDerivedAmounts(formData: TemplateFormData, fieldIds: string[]): number {
  return fieldIds.reduce((sum, fieldId) => sum + readDerivedAmount(formData, fieldId), 0)
}

function formatDerivedAmountValue(value: number): string {
  return Math.abs(value) > 0 ? value.toFixed(2) : ''
}

function deriveMirroredAmountValue(formData: TemplateFormData, fieldId: string): string {
  return hasValue(formData[fieldId])
    ? formatDerivedAmountValue(readDerivedAmount(formData, fieldId))
    : ''
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== undefined && value !== null
}

function combineCityAndState(city: unknown, state: unknown): string {
  const cityText = typeof city === 'string' ? city.trim() : ''
  const stateText = typeof state === 'string' ? state.trim() : ''

  if (cityText && stateText) {
    return `${cityText}, ${stateText}`
  }

  return cityText || stateText
}

function combineCityStateAndZip(city: unknown, state: unknown, zip: unknown): string {
  const cityState = combineCityAndState(city, state)
  const zipText = typeof zip === 'string' ? zip.trim() : ''

  if (cityState && zipText) {
    return `${cityState} ${zipText}`
  }

  return cityState || zipText
}

function combineSuccessorNameAndAddress(name: unknown, address: unknown): string {
  const nameText = typeof name === 'string' ? name.trim() : ''
  const addressText = typeof address === 'string' ? address.trim() : ''

  if (nameText && addressText) {
    return `${nameText}${' '.repeat(55)}${addressText}`
  }

  return nameText || addressText
}

function combineTrusteeDetails(name: unknown, address: unknown, caseNumber: unknown): string {
  const parts = [
    typeof name === 'string' ? name.trim() : '',
    typeof address === 'string' ? address.trim() : '',
    typeof caseNumber === 'string' ? caseNumber.trim() : ''
  ].filter(Boolean)

  return parts.join(' | ')
}

function calculateEstateAdjustmentsTotal(
  estimatedEndingMarketValueInput: unknown,
  beginningBalance: number,
  receiptsTotal: number,
  disbursementsTotal: number
): string {
  if (!hasValue(estimatedEndingMarketValueInput)) {
    return ''
  }

  const estimatedEndingMarketValue = Number(estimatedEndingMarketValueInput)
  const baselineEndingValue = beginningBalance + receiptsTotal - disbursementsTotal

  return formatDerivedAmountValue(estimatedEndingMarketValue - baselineEndingValue)
}

export function deriveTemplateFormData(formData: TemplateFormData): TemplateFormData {
  const derivedData: TemplateFormData = { ...formData }
  const estateReceiptFieldIds = ['fill_10', 'fill_12', 'fill_14', 'fill_16', 'fill_18', 'fill_20', 'fill_22']
  const estateDisbursementFieldIds = ['fill_24', 'fill_26', 'fill_28', 'fill_29', 'fill_31', 'fill_33', 'fill_35', 'fill_37']
  const realPropertyTotal = sumDerivedAmounts(formData, ['realPropertyWorth1', 'realPropertyWorth2', 'realPropertyWorth3'])
  const receivableTotal = sumDerivedAmounts(formData, ['receivableWorth1', 'receivableWorth2', 'receivableWorth3'])
  const unblockedStartTotal = sumDerivedAmounts(formData, ['undefined_21', 'undefined_23', 'undefined_25'])
  const unblockedEndTotal = sumDerivedAmounts(formData, ['undefined_22', 'undefined_24', 'undefined_26'])
  const blockedStartTotal = sumDerivedAmounts(formData, ['undefined_29', 'undefined_31', 'undefined_33'])
  const blockedEndTotal = sumDerivedAmounts(formData, ['undefined_30', 'undefined_32', 'undefined_34'])
  const totalAssetsStart =
    realPropertyTotal +
    receivableTotal +
    unblockedStartTotal +
    blockedStartTotal +
    readDerivedAmount(formData, 'undefined_37') +
    readDerivedAmount(formData, 'undefined_39')
  const totalAssetsEnd =
    realPropertyTotal +
    receivableTotal +
    unblockedEndTotal +
    blockedEndTotal +
    readDerivedAmount(formData, 'undefined_38') +
    readDerivedAmount(formData, 'undefined_40')
  const totalLiabilitiesStart = sumDerivedAmounts(formData, ['undefined_43', 'undefined_45', 'undefined_47', 'undefined_49'])
  const totalLiabilitiesEnd = sumDerivedAmounts(formData, ['undefined_44', 'undefined_46', 'undefined_48', 'undefined_50'])
  const totalEstateStart = totalAssetsStart - totalLiabilitiesStart
  const totalEstateEnd = totalAssetsEnd - totalLiabilitiesEnd
  const estimatedReceiptsTotal = sumDerivedAmounts(formData, estateReceiptFieldIds)
  const estimatedDisbursementsTotal = sumDerivedAmounts(formData, estateDisbursementFieldIds)

  const accusedOfFraud = normalizeDerivedBoolean(formData.accusedOfFraud)
  if (accusedOfFraud !== undefined) {
    derivedData.notAccusedOfFraud = !accusedOfFraud
  }

  const untimelyReports = normalizeDerivedBoolean(formData.untimelyReports)
  if (untimelyReports !== undefined) {
    derivedData.noUntimelyReports = !untimelyReports
  }

  const monitoredByAgencies = normalizeDerivedBoolean(formData.monitoredByAgencies)
  if (monitoredByAgencies !== undefined) {
    derivedData.notMonitoredByAgencies = !monitoredByAgencies
  }

  const trustReportsToCourt = normalizeDerivedBoolean(formData.trustReportsToCourt)
  if (trustReportsToCourt !== undefined) {
    derivedData.trustDoesNotReportToCourt = !trustReportsToCourt
  }

  const inventoryOnFile = normalizeDerivedBoolean(formData.inventoryOnFile)
  if (inventoryOnFile !== undefined) {
    derivedData.inventoryNotOnFile = !inventoryOnFile
  }

  const bondInPlace = normalizeDerivedBoolean(formData.bondInPlace)
  if (bondInPlace !== undefined) {
    derivedData.bondNotInPlace = !bondInPlace
  }

  const reportType = formData.reportType
  if (typeof reportType === 'string') {
    derivedData.reportType12Month = reportType === '12'
    derivedData.reportType24Month = reportType === '24'
    derivedData.reportType36Month = reportType === '36'
    derivedData.reportTypeFinal = reportType === 'final'
  }

  const futureReportingInterval = formData.futureReportingInterval
  if (typeof futureReportingInterval === 'string') {
    derivedData.reportEvery12Months = futureReportingInterval === '12'
    derivedData.reportEvery24Months = futureReportingInterval === '24'
    derivedData.reportEvery36Months = futureReportingInterval === '36'
    derivedData.continuereport12 = futureReportingInterval === '12'
    derivedData.continuereport24 = futureReportingInterval === '24'
    derivedData.continuereport36 = futureReportingInterval === '36'
  }

  const bondRecommendation = formData.bondRecommendation
  if (typeof bondRecommendation === 'string') {
    derivedData.bondShouldRemain = bondRecommendation === 'remain'
    derivedData.bondShouldChange = bondRecommendation === 'change'
  }

  const guardianshipScope = formData.guardianshipScope
  if (typeof guardianshipScope === 'string') {
    derivedData.guardianshipFull = guardianshipScope === 'full'
    derivedData.guardianshipLimited = guardianshipScope === 'limited'
  }

  const conservatorshipScope = formData.conservatorshipScope
  if (typeof conservatorshipScope === 'string') {
    derivedData.conservatorshipFull = conservatorshipScope === 'full'
    derivedData.conservatorshipLimited = conservatorshipScope === 'limited'
  }

  const successorNominationChoice = formData.successorNominationChoice
  if (typeof successorNominationChoice === 'string') {
    derivedData.successorNominateNow = successorNominationChoice === 'nominate_now'
    derivedData.successorNotApplicable = successorNominationChoice === 'not_applicable'
  }

  const successorStillAble = normalizeDerivedBoolean(formData.successorStillAble)
  if (successorStillAble !== undefined) {
    derivedData.successorNotAble = !successorStillAble
  }

  const individualStatusChangeRequested = normalizeDerivedBoolean(formData.individualStatusChangeRequested)
  if (individualStatusChangeRequested !== undefined) {
    derivedData.individualReceivingSatisfactoryCare = !individualStatusChangeRequested
  }

  const successorType = formData.successorType
  if (typeof successorType === 'string') {
    derivedData.successorTypeGuardian = successorType === 'guardian' || successorType === 'both'
    derivedData.successorTypeConservator = successorType === 'conservator' || successorType === 'both'
  }

  const planDeviated = normalizeDerivedBoolean(formData.planDeviated)
  if (planDeviated !== undefined) {
    derivedData.planNotDeviated = !planDeviated
  }

  const conservatorPlanDeviated = normalizeDerivedBoolean(formData.conservatorPlanDeviated)
  if (conservatorPlanDeviated !== undefined) {
    derivedData.conservatorPlanHasDeviated = conservatorPlanDeviated
    derivedData.conservatorPlanNotDeviated = !conservatorPlanDeviated
  }

  const futureCarePlanChanged = normalizeDerivedBoolean(formData.futureCarePlanChanged)
  if (futureCarePlanChanged !== undefined) {
    derivedData.futureCarePlanSame = !futureCarePlanChanged
  }

  const scopeChangeRecommended = normalizeDerivedBoolean(formData.scopeChangeRecommended)
  if (scopeChangeRecommended !== undefined) {
    derivedData.scopeShouldChange = scopeChangeRecommended
    derivedData.scopeShouldRemainSame = !scopeChangeRecommended
  }

  const conservatorScopeChangeRecommended = normalizeDerivedBoolean(
    formData.conservatorScopeChangeRecommended
  )
  if (conservatorScopeChangeRecommended !== undefined) {
    derivedData.conservatorScopeShouldChange = conservatorScopeChangeRecommended
    derivedData.conservatorScopeShouldRemainSame = !conservatorScopeChangeRecommended
  }

  derivedData.individualCity = combineCityAndState(formData.individualCityName, formData.individualState)
  derivedData.guardianCity = combineCityAndState(formData.guardianCityName, formData.guardianState)
  derivedData.conservatorScopeChangeDetails1 = hasValue(formData.conservatorScopeChangeDetailsSource)
    ? formData.conservatorScopeChangeDetailsSource
    : formData.conservatorScopeChangeDetails1
  derivedData.realPropertyOtherValue = formatDerivedAmountValue(realPropertyTotal)
  derivedData.receivableOtherValue = formatDerivedAmountValue(receivableTotal)
  derivedData.realPropertyWorth1StartDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth1')
  derivedData.realPropertyWorth1EndDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth1')
  derivedData.realPropertyWorth2StartDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth2')
  derivedData.realPropertyWorth2EndDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth2')
  derivedData.realPropertyWorth3StartDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth3')
  derivedData.realPropertyWorth3EndDisplay = deriveMirroredAmountValue(formData, 'realPropertyWorth3')
  const realPropertyEndValues = [
    derivedData.realPropertyWorth1EndDisplay,
    derivedData.realPropertyWorth2EndDisplay,
    derivedData.realPropertyWorth3EndDisplay
  ]
  derivedData.realPropertyEndValues = realPropertyEndValues.some(Boolean)
    ? realPropertyEndValues.join('\n')
    : ''
  derivedData.receivableWorth1StartDisplay = deriveMirroredAmountValue(formData, 'receivableWorth1')
  derivedData.receivableWorth1EndDisplay = deriveMirroredAmountValue(formData, 'receivableWorth1')
  derivedData.receivableWorth2StartDisplay = deriveMirroredAmountValue(formData, 'receivableWorth2')
  derivedData.receivableWorth2EndDisplay = deriveMirroredAmountValue(formData, 'receivableWorth2')
  derivedData.receivableWorth3StartDisplay = deriveMirroredAmountValue(formData, 'receivableWorth3')
  derivedData.receivableWorth3EndDisplay = deriveMirroredAmountValue(formData, 'receivableWorth3')
  const receivableEndValues = [
    derivedData.receivableWorth1EndDisplay,
    derivedData.receivableWorth2EndDisplay
  ]
  derivedData.receivableEndValues = receivableEndValues.some(Boolean)
    ? receivableEndValues.join('\n')
    : ''
  derivedData.receivableWorth3MappedEndDisplay = derivedData.receivableWorth3EndDisplay
  derivedData.newBondAmountDisplay = deriveMirroredAmountValue(formData, 'newBondAmount')
  derivedData.successorNameAndAddress = combineSuccessorNameAndAddress(
    formData.successorName,
    formData.successorAddress
  )
  derivedData.trustName = combineTrusteeDetails(
    formData.trustName,
    formData.trustAddress,
    formData.trustCaseNumber
  )
  derivedData.balanceSheetInstitution1CityStateZip = combineCityStateAndZip(
    formData.balanceSheetInstitution1City,
    formData.balanceSheetInstitution1State,
    formData.balanceSheetInstitution1Zip
  )
  derivedData.balanceSheetInstitution2CityStateZip = combineCityStateAndZip(
    formData.balanceSheetInstitution2City,
    formData.balanceSheetInstitution2State,
    formData.balanceSheetInstitution2Zip
  )
  derivedData.balanceSheetInstitution3CityStateZip = combineCityStateAndZip(
    formData.balanceSheetInstitution3City,
    formData.balanceSheetInstitution3State,
    formData.balanceSheetInstitution3Zip
  )
  derivedData.balanceSheetInstitution4CityStateZip = combineCityStateAndZip(
    formData.balanceSheetInstitution4City,
    formData.balanceSheetInstitution4State,
    formData.balanceSheetInstitution4Zip
  )
  derivedData.undefined_27 = formatDerivedAmountValue(unblockedStartTotal)
  derivedData.undefined_28 = formatDerivedAmountValue(unblockedEndTotal)
  derivedData.undefined_35 = formatDerivedAmountValue(blockedStartTotal)
  derivedData.undefined_36 = formatDerivedAmountValue(blockedEndTotal)
  derivedData.undefined_41 = formatDerivedAmountValue(totalAssetsStart)
  derivedData.undefined_42 = formatDerivedAmountValue(totalAssetsEnd)
  derivedData.undefined_51 = formatDerivedAmountValue(totalLiabilitiesStart)
  derivedData.undefined_52 = formatDerivedAmountValue(totalLiabilitiesEnd)
  derivedData.undefined_53 = formatDerivedAmountValue(totalEstateStart)
  derivedData.undefined_54 = formatDerivedAmountValue(totalEstateEnd)

  const estimatedEndingMarketValue = hasValue(formData.undefined_60)
    ? formatDerivedAmountValue(readDerivedAmount(formData, 'undefined_60'))
    : ''
  const estateAdjustmentsTotal = calculateEstateAdjustmentsTotal(
    formData.undefined_60,
    totalEstateStart,
    estimatedReceiptsTotal,
    estimatedDisbursementsTotal
  )
  const worksheetAfterReceipts = totalEstateStart + estimatedReceiptsTotal
  const worksheetAfterDisbursements = worksheetAfterReceipts - estimatedDisbursementsTotal

  derivedData.estateEstimatedReceiptsTotal = formatDerivedAmountValue(estimatedReceiptsTotal)
  derivedData.estateEstimatedDisbursementsTotal = formatDerivedAmountValue(estimatedDisbursementsTotal)
  derivedData.estateBeginningBalance = formatDerivedAmountValue(totalEstateStart)
  derivedData.estateReceiptsTotal = formatDerivedAmountValue(estimatedReceiptsTotal)
  derivedData.estateDisbursementsTotal = formatDerivedAmountValue(estimatedDisbursementsTotal)
  derivedData.estateAdjustmentsTotal = estateAdjustmentsTotal

  derivedData.undefined_55 = formatDerivedAmountValue(totalEstateStart)
  derivedData.undefined_56 = formatDerivedAmountValue(estimatedReceiptsTotal)
  derivedData.undefined_57 = formatDerivedAmountValue(estimatedDisbursementsTotal)
  derivedData.undefined_58 = estateAdjustmentsTotal
  derivedData.undefined_59 = estimatedEndingMarketValue
  derivedData.undefined_60 = formatDerivedAmountValue(totalEstateStart)
  derivedData.undefined_61 = formatDerivedAmountValue(estimatedReceiptsTotal)
  derivedData.undefined_62 = formatDerivedAmountValue(worksheetAfterReceipts)
  derivedData.undefined_63 = formatDerivedAmountValue(estimatedDisbursementsTotal)
  derivedData.estateWorksheetLine31b = derivedData.undefined_61
  derivedData.estateWorksheetAfterReceipts = derivedData.undefined_62
  derivedData.estateWorksheetLine31c = derivedData.undefined_63
  derivedData.estateWorksheetAfterDisbursements = formatDerivedAmountValue(worksheetAfterDisbursements)
  derivedData.estateWorksheetLine31d = estateAdjustmentsTotal
  derivedData.estateBeginningBalanceSummary = derivedData.undefined_55
  derivedData.estateReceiptsTotalSummary = derivedData.undefined_56
  derivedData.estateDisbursementsTotalSummary = derivedData.undefined_57
  derivedData.estateAdjustmentsTotalSummary = derivedData.undefined_58
  derivedData.estateEndingMarketValueSummary = derivedData.undefined_59

  const calculatedEndingBalance =
    totalEstateStart +
    estimatedReceiptsTotal -
    estimatedDisbursementsTotal +
    readDerivedAmount(derivedData, 'estateAdjustmentsTotal')

  derivedData.estateCalculatedEndingBalance = formatDerivedAmountValue(calculatedEndingBalance)
  derivedData.estateBalanceDifference = formatDerivedAmountValue(
    readDerivedAmount(formData, 'undefined_60') - calculatedEndingBalance
  )
  derivedData.undefined_81 = formatDerivedAmountValue(
    sumDerivedAmounts(formData, ['undefined_67', 'undefined_69', 'undefined_71', 'undefined_73', 'undefined_75', 'undefined_77', 'undefined_79'])
  )
  derivedData.undefined_82 = formatDerivedAmountValue(
    sumDerivedAmounts(formData, ['undefined_68', 'undefined_70', 'undefined_72', 'undefined_74', 'undefined_76', 'undefined_78', 'undefined_80'])
  )
  derivedData.undefined_83 = formatDerivedAmountValue(readDerivedAmount(derivedData, 'undefined_82') * 12)
  derivedData.fill_45 = derivedData.undefined_83
  derivedData.blockedAccountsTotal = formatDerivedAmountValue(readDerivedAmount(derivedData, 'undefined_36'))
  derivedData.unblockedAccountsTotal = formatDerivedAmountValue(readDerivedAmount(derivedData, 'undefined_28'))

  return derivedData
}
