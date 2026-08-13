/**
 * Dynamic Form Component
 * 
 * Renders form fields dynamically based on the PDF template schema.
 * This component drives the form UI from the same schema that drives PDF generation.
 */

import React, { useMemo } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { PdfTemplate, TemplateField, TemplateFormData, FieldOption } from '../types/template.types'
import { getDisplayLabel } from '../utils/fieldLabelHelpers'

const YES_NO_OPTIONS: FieldOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

export type OptionalFieldGroupConfig = {
  id: string
  sectionName: string
  triggerFieldId: string
  gateFieldId?: string
  gateLabel?: string
  leaderPdfName: string
  groupPdfNames: string[]
  buttonLabel: string
  removeButtonLabel: string
  dependsOnTriggerFieldId?: string
  expandValue?: any
  collapseValue?: any
}

type DynamicFormRenderProps = {
  register: UseFormRegister<TemplateFormData>
  errors: FieldErrors<TemplateFormData>
  watch: UseFormWatch<TemplateFormData>
}

export const BALANCE_SHEET_OPTIONAL_GROUPS: OptionalFieldGroupConfig[] = [
  {
    id: 'balanceSheetRealProperty2',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showRealPropertyItem2',
    gateFieldId: 'hasRealPropertyAssets',
    leaderPdfName: '2_6',
    groupPdfNames: ['2_6', 'realPropertyWorth2'],
    buttonLabel: '+ Add second personal property item',
    removeButtonLabel: '- Remove this personal property item 2'
  },
  {
    id: 'balanceSheetRealProperty3',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showRealPropertyItem3',
    gateFieldId: 'hasRealPropertyAssets',
    leaderPdfName: '3_5',
    groupPdfNames: ['3_5', 'realPropertyWorth3'],
    buttonLabel: '+ Add third personal property item',
    removeButtonLabel: '- Remove this personal property item 3',
    dependsOnTriggerFieldId: 'showRealPropertyItem2'
  },
  {
    id: 'balanceSheetReceivable2',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showReceivableItem2',
    gateFieldId: 'hasReceivables',
    leaderPdfName: 'undefined_20',
    groupPdfNames: ['undefined_20', 'receivableWorth2'],
    buttonLabel: '+ Add second receivable item',
    removeButtonLabel: '- Remove this receivable item 2'
  },
  {
    id: 'balanceSheetReceivable3',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showReceivableItem3',
    gateFieldId: 'hasReceivables',
    leaderPdfName: '3_6',
    groupPdfNames: ['3_6', 'receivableWorth3'],
    buttonLabel: '+ Add third receivable item',
    removeButtonLabel: '- Remove this receivable item 3',
    dependsOnTriggerFieldId: 'showReceivableItem2'
  },
  {
    id: 'balanceSheetLiability2',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showLiabilityItem2',
    gateFieldId: 'hasAdditionalBalanceSheetDetails',
    leaderPdfName: '2_8',
    groupPdfNames: ['2_8', 'undefined_45', 'undefined_46'],
    buttonLabel: '+ Add liability item 2',
    removeButtonLabel: '- Remove liability item 2'
  },
  {
    id: 'balanceSheetLiability3',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showLiabilityItem3',
    gateFieldId: 'hasAdditionalBalanceSheetDetails',
    leaderPdfName: '3_7',
    groupPdfNames: ['3_7', 'undefined_47', 'undefined_48'],
    buttonLabel: '+ Add liability item 3',
    removeButtonLabel: '- Remove liability item 3',
    dependsOnTriggerFieldId: 'showLiabilityItem2'
  },
  {
    id: 'balanceSheetLiability4',
    sectionName: 'Conservator Balance Sheet',
    triggerFieldId: 'showLiabilityItem4',
    gateFieldId: 'hasAdditionalBalanceSheetDetails',
    leaderPdfName: 'Loan',
    groupPdfNames: ['Loan', 'undefined_49', 'undefined_50'],
    buttonLabel: '+ Add liability item 4',
    removeButtonLabel: '- Remove liability item 4',
    dependsOnTriggerFieldId: 'showLiabilityItem3'
  }
]

const BALANCE_SHEET_SUPPRESSED_TRIGGER_FIELDS = new Set<string>()

function isMultilineDescriptionField(field: TemplateField): boolean {
  if (field.type !== 'textarea') {
    return false
  }

  const text = `${field.id} ${field.label}`.toLowerCase()

  return [
    'describe',
    'explain',
    'details',
    'concern',
    'arrangement',
    'activities',
    'services',
    'gifts',
    'business',
    'deviation',
    'requested order',
    'scope change',
    'future care plan',
    'recommended change'
  ].some(keyword => text.includes(keyword))
}

export const SECTION_DISPLAY: Record<string, { title: string; description?: string }> = {
  'General Information': {
    title: 'Section A - General Information',
    description: 'Let’s start with the court, case, report type, and scope of authority.'
  },
  'Individual Information': {
    title: 'About the protected person',
    description: 'Tell us a little about the protected person and how to reach them.'
  },
  'Guardian Information': {
    title: 'About You',
    description: 'Next, we’ll gather your contact and identifying information.'
  },
  'Reporting Period': {
    title: 'Appointment and Reporting Dates',
    description: 'Enter the key dates for your appointment and this reporting period.'
  },
  'Reporting Criteria': {
    title: 'Reporting Period Criteria',
    description: 'We’ll confirm a few reporting details and ask for explanations only where needed.'
  },
  'Notice Parties': {
    title: 'Notice Parties',
    description: 'List the people who should receive information about this form.'
  },
  'Interested Governmental Agencies': {
    title: 'Government Agencies to Notify',
    description: 'Let us know whether any government agencies also need notice.'
  },
  Benefits: {
    title: 'Benefits Received',
    description: 'Enter the monthly benefits received on the protected person’s behalf.'
  },
  'Trust Information': {
    title: 'Trust Information',
    description: 'If a trust is involved, we’ll gather the trustee and reporting details here.'
  },
  'Inventory & Bond': {
    title: 'Inventory, Bond, and Accounts',
    description: 'Tell us about the inventory, bond, and any blocked or unblocked accounts.'
  },
  'Fees & Allowances': {
    title: 'Fees and Allowances',
    description: 'Enter fees, payments already received, and any requested disbursements.'
  },
  'Attorney Fees': {
    title: 'Attorney Fees',
    description: 'If attorney fees are being requested, enter those details here.'
  },
  'Monthly Allowance': {
    title: 'Monthly Allowance',
    description: 'We’ll capture prior totals, the requested allowance, and the effective date.'
  },
  Successor: {
    title: 'Successor Information',
    description: 'Tell us whether a successor has been named and when they would serve.'
  },
  "Guardian's Report": {
    title: 'Section B - Guardian Report',
    description: 'This section covers care, services, visits, planning, gifts, and related reporting.'
  },
  'Conservator Balance Sheet': {
    title: 'Section C - Conservator Balance Sheet',
    description: 'Enter balance-sheet details, financial institutions, assets, and related account information.'
  },
  'Conservator Estate Information': {
    title: 'Estate Information',
    description: 'Enter receipts, disbursements, adjustments, and ending market value for the estate.'
  },
  'Conservator Explanations & Plan': {
    title: 'Explanations and Conservator Plan',
    description: 'Use this section for large expenditures, services received, and any recommended plan changes.'
  },
  'Conservator Proposed Budget': {
    title: 'Proposed Budget and Disclosures',
    description: 'Enter the proposed budget, gifts received, business relationships, and other disclosures.'
  },
  Verification: {
    title: 'Section D - Verification',
    description: 'Finish with any additional requested orders, your signature, and final verification details.'
  }
}

export const SECTION_GROUPS: Record<string, Array<{ title: string; fieldIds: string[] }>> = {
  'General Information': [
    {
      title: 'Court and Case',
      fieldIds: ['countyName', 'caseNumber', 'individualName']
    },
    {
      title: 'Report Duration',
      fieldIds: ['reportType']
    },
    {
      title: 'Guardianship / Conservatorship Type',
      fieldIds: ['guardianshipScope', 'conservatorshipScope']
    }
  ],
  'Conservator Balance Sheet': [
    {
      title: 'Accounting Period',
      fieldIds: ['balanceSheetStartDate', 'balanceSheetEndDate']
    },
    {
      title: 'Personal Property',
      fieldIds: [
        'hasRealPropertyAssets',
        'realPropertyItem1',
        'realPropertyWorth1',
        'realPropertyItem2',
        'realPropertyWorth2',
        'realPropertyItem3',
        'realPropertyWorth3'
      ]
    },
    {
      title: 'Receivables',
      fieldIds: [
        'hasReceivables',
        'receivableItem1',
        'receivableWorth1',
        'receivableItem2',
        'receivableWorth2',
        'receivableItem3',
        'receivableWorth3'
      ]
    },
    {
      title: 'Unblocked Liquid Assets (e.g Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)',
      fieldIds: [
        'hasUnblockedLiquidAssets'
      ]
    },
    {
      title: 'Financial Institutions Containing Unblocked Liquid Assets (e.g. Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)',
      fieldIds: [
        'Financial Institution',
        'Address',
        'Address_2',
        'City WA Zip',
        'balanceSheetInstitution1City',
        'balanceSheetInstitution1State',
        'balanceSheetInstitution1Zip',
        'Account No last 4 digits',
        'undefined_21',
        'undefined_22',
        'Balance as of',
        'Account No last 4 digits_2',
        'undefined_23',
        'undefined_24',
        'Balance as of_2'
      ]
    },
    {
      title: 'More Unblocked Liquid Asset Institutions (e.g Contains Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)',
      fieldIds: [
        'hasBalanceSheetInstitution2'
      ]
    },
    {
      title: 'Second Financial Institution Containing Unblocked Liquid Assets (e.g Investment Accounts, Stocks, Bonds, Securities, IRA, Cash)',
      fieldIds: [
        'Financial Institution_2',
        'Address_3',
        'Address_4',
        'City WA Zip_2',
        'balanceSheetInstitution2City',
        'balanceSheetInstitution2State',
        'balanceSheetInstitution2Zip',
        'Account No last 4 digits_3',
        'Interest Rate',
        'Maturity Date',
        'undefined_25',
        'undefined_26',
        'Balance as of_3'
      ]
    },
    {
      title: 'Blocked Liquid Asset Institutions',
      fieldIds: [
        'hasBalanceSheetInstitution3'
      ]
    },
    {
      title: 'Blocked Liquid Asset Institution 1',
      fieldIds: [
        'Financial Institution_3',
        'Address_5',
        'Address_6',
        'City WA Zip_3',
        'balanceSheetInstitution3City',
        'balanceSheetInstitution3State',
        'balanceSheetInstitution3Zip',
        'Account No last 4 digits_4',
        'Interest Rate_2',
        'Maturity Date_2',
        'undefined_29',
        'undefined_30',
        'Balance as of_4'
      ]
    },
    {
      title: 'Second Blocked Account at This Institution',
      fieldIds: [
        'Account No last 4 digits_5',
        'Interest Rate_3',
        'Maturity Date_3',
        'undefined_31',
        'undefined_32',
        'Balance as of_5'
      ]
    },
    {
      title: 'More Blocked Liquid Asset Institutions',
      fieldIds: [
        'hasBalanceSheetInstitution4'
      ]
    },
    {
      title: 'Blocked Liquid Asset Institution 2',
      fieldIds: [
        'Financial Institution_4',
        'Address_7',
        'Address_8',
        'City WA Zip_4',
        'balanceSheetInstitution4City',
        'balanceSheetInstitution4State',
        'balanceSheetInstitution4Zip',
        'Account No last 4 digits_6',
        'Interest Rate_4',
        'Maturity Date_4',
        'undefined_33',
        'undefined_34',
        'Balance as of_6'
      ]
    },
    {
      title: 'Personal and Other Property Subject to Control',
      fieldIds: [
        'hasLiquidAssets',
        '1_7',
        'undefined_37',
        'undefined_38'
      ]
    },
    {
      title: 'Second Personal or Other Property Item',
      fieldIds: [
        'hasAdditionalLiquidAssetItem2',
        '2_7',
        'undefined_39',
        'undefined_40'
      ]
    },
    {
      title: 'Mortgages, Liens, Notes Payable, and Other Liabilities',
      fieldIds: [
        'hasAdditionalBalanceSheetDetails',
        '1_8',
        'undefined_43',
        'undefined_44',
        '2_8',
        'undefined_45',
        'undefined_46',
        '3_7',
        'undefined_47',
        'undefined_48',
        'Loan',
        'undefined_49',
        'undefined_50'
      ]
    },
    {
      title: 'Derived Totals',
      fieldIds: ['undefined_27', 'undefined_28', 'undefined_35', 'undefined_36', 'undefined_41', 'undefined_42', 'undefined_51', 'undefined_52', 'undefined_53', 'undefined_54']
    }
  ]
}

interface DynamicFormProps {
  /** The PDF template schema */
  template: PdfTemplate
  /** React Hook Form register function */
  register: UseFormRegister<TemplateFormData>
  /** React Hook Form errors */
  errors: FieldErrors<TemplateFormData>
  /** React Hook Form watch function for conditional fields */
  watch: UseFormWatch<TemplateFormData>
  /** React Hook Form setValue function for progressive reveal controls */
  setValue?: UseFormSetValue<TemplateFormData>
  /** Optional list of sections to show for the current page */
  visibleSections?: string[]
  /** Optional list of field ids to show for the current page */
  visibleFieldIds?: string[]
  visibleOptionalGroupIds?: string[]
  controlOnly?: boolean
  /** Optional: Custom field renderer */
  renderField?: (field: TemplateField, props: DynamicFormRenderProps) => React.ReactNode
}

/**
 * Dynamic Form component that renders fields based on template schema
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  template,
  register,
  errors,
  watch,
  setValue,
  visibleSections,
  visibleFieldIds,
  visibleOptionalGroupIds,
  controlOnly,
  renderField
}) => {
  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const sections = new Map<string, TemplateField[]>()

    for (const field of template.fields) {
      if (field.includeInForm === false) {
        continue
      }

      const sectionName = field.section || 'Other'
      const existing = sections.get(sectionName) || []
      existing.push(field)
      sections.set(sectionName, existing)
    }

    return sections
  }, [template.fields])

  const orderedSections = useMemo(() => {
    return Array.from(fieldsBySection.entries()).map(([sectionName, fields]) => ({
      sectionName,
      fields,
      display: SECTION_DISPLAY[sectionName] ?? { title: sectionName }
    }))
  }, [fieldsBySection])

  const visibleOrderedSections = useMemo(() => {
    const allowedSections = visibleSections && visibleSections.length > 0 ? new Set(visibleSections) : null
    const allowedFields = visibleFieldIds && visibleFieldIds.length > 0 ? new Set(visibleFieldIds) : null
    const fieldOrder = new Map((visibleFieldIds ?? []).map((fieldId, index) => [fieldId, index] as const))

    return orderedSections
      .filter(section => !allowedSections || allowedSections.has(section.sectionName))
      .map(section => ({
        ...section,
        fields: allowedFields
          ? section.fields
            .filter(field => allowedFields.has(field.id))
            .sort((left, right) => (fieldOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (fieldOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))
          : section.fields
      }))
      .filter(section => section.fields.length > 0)
  }, [orderedSections, visibleSections, visibleFieldIds])

  const groupedSectionFields = (sectionName: string, fields: TemplateField[]) => {
    const sectionGroups = SECTION_GROUPS[sectionName]
    if (!sectionGroups) {
      return [{ title: null as string | null, fields }]
    }

    const matchesGroupField = (field: TemplateField, identifier: string) =>
      field.id === identifier || field.pdfFieldNames?.includes(identifier)

    const grouped: Array<{ title: string | null; fields: TemplateField[] }> = sectionGroups
      .map(group => {
        const fieldsForGroup = group.fieldIds
          .map(fieldId => fields.find(field => matchesGroupField(field, fieldId)))
          .filter((field): field is TemplateField => Boolean(field))
          .filter(field => shouldShowField(field))

        return {
          title: group.title,
          fields: fieldsForGroup
        }
      })
      .filter(group => group.fields.length > 0)

    const groupedIds = new Set(grouped.flatMap(group => group.fields.map(field => field.id)))
    const remainingFields = fields.filter(field => !groupedIds.has(field.id))
    if (remainingFields.length > 0) {
      grouped.unshift({ title: null as string | null, fields: remainingFields })
    }

    return grouped
  }

  const optionalFieldGroups = useMemo(() => {
    return BALANCE_SHEET_OPTIONAL_GROUPS.map(config => {
      const matchedFields = template.fields.filter(field => {
        const pdfFieldName = field.pdfFieldNames?.[0]
        return (
          field.section === config.sectionName &&
          pdfFieldName != null &&
          config.groupPdfNames.includes(pdfFieldName)
        )
      })

      const leaderField = matchedFields.find(
        field => field.pdfFieldNames?.[0] === config.leaderPdfName
      )

      return {
        ...config,
        matchedFieldIds: matchedFields.map(field => field.id),
        leaderFieldId: leaderField?.id ?? null
      }
    }).filter(config => config.leaderFieldId != null)
  }, [template.fields])

  const optionalFieldGroupByFieldId = useMemo(() => {
    const groups = new Map<string, (typeof optionalFieldGroups)[number]>()

    optionalFieldGroups.forEach(group => {
      group.matchedFieldIds.forEach(fieldId => {
        groups.set(fieldId, group)
      })
    })

    return groups
  }, [optionalFieldGroups])

  const getOptionalFieldGroupExpansion = (group: (typeof optionalFieldGroups)[number]) => {
    const expandValue = group.expandValue ?? true
    return watch(group.triggerFieldId) === expandValue
  }

  const canOfferOptionalFieldGroup = (group: (typeof optionalFieldGroups)[number]) => {
    if (!group.dependsOnTriggerFieldId) {
      return true
    }

    const dependencyValue = watch(group.dependsOnTriggerFieldId)
    return dependencyValue === true || dependencyValue === 'yes'
  }

  const clearOptionalFieldGroup = (
    group: (typeof optionalFieldGroups)[number],
    options?: { preserveGateValue?: boolean }
  ) => {
    if (typeof setValue !== 'function') {
      return
    }

    const descendants = optionalFieldGroups.filter(candidate => {
      let currentDependency = candidate.dependsOnTriggerFieldId

      while (currentDependency) {
        if (currentDependency === group.triggerFieldId) {
          return true
        }

        const parent = optionalFieldGroups.find(
          optionalGroup => optionalGroup.triggerFieldId === currentDependency
        )
        currentDependency = parent?.dependsOnTriggerFieldId
      }

      return false
    })

    const groupsToClear = [group, ...descendants]

    groupsToClear.forEach(groupToClear => {
      const collapseValue = groupToClear.collapseValue ?? false

      setValue(groupToClear.triggerFieldId, collapseValue, {
        shouldDirty: true,
        shouldTouch: true
      })

      if (groupToClear.gateFieldId && !options?.preserveGateValue) {
        setValue(groupToClear.gateFieldId, '', {
          shouldDirty: true,
          shouldTouch: true
        })
      }

      groupToClear.matchedFieldIds.forEach(fieldId => {
        const matchedField = template.fields.find(field => field.id === fieldId)
        if (!matchedField) {
          return
        }

        let emptyValue: any = ''
        if (matchedField.type === 'checkbox') emptyValue = false
        if (matchedField.type === 'radio' || matchedField.type === 'select') emptyValue = ''

        setValue(fieldId, emptyValue, {
          shouldDirty: true,
          shouldTouch: true
        })
      })
    })
  }

  const isGateAnsweredYes = (value: unknown) => value === true || value === 'yes'

  const renderOptionalGroupControls = (group: (typeof optionalFieldGroups)[number]) => {
    const gateFieldId = group.gateFieldId
    const gateFieldValue = gateFieldId ? watch(gateFieldId) : undefined
    const individualName = watch('individualName')
    const hasGateFieldInTemplate = gateFieldId
      ? template.fields.some(field => field.id === gateFieldId)
      : false
    const isExpanded = getOptionalFieldGroupExpansion(group)
    const canOfferAdd = canOfferOptionalFieldGroup(group)
    const gateIsYes = isGateAnsweredYes(gateFieldValue)

    if (gateFieldId && !gateIsYes && !isExpanded) {
      return null
    }

    if (!canOfferAdd && !isExpanded) {
      return null
    }

    return (
      <div key={`${group.id}-controls`} className="form-optional-group-card">
        {!hasGateFieldInTemplate && gateFieldId && (
          <div className="form-group radio-group form-optional-group-gate">
            <label className="radio-label">
              {getDisplayLabel(group.gateLabel ?? 'Do you want to add another item?', individualName)}
            </label>
            <div className="radio-options">
              {YES_NO_OPTIONS.map(option => (
                <label key={String(option.value)} className="radio-option">
                  <input
                    type="radio"
                    value={String(option.value)}
                    {...register(gateFieldId, {
                      onChange: event => {
                        const nextValue = (event.target as HTMLInputElement).value
                        if (nextValue !== 'yes') {
                          clearOptionalFieldGroup(group, { preserveGateValue: true })
                        }
                      }
                    })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {hasGateFieldInTemplate && gateIsYes && !isExpanded && (
          <div className="form-optional-group-hint">
            <span>Choose the button below to add the next item.</span>
          </div>
        )}

        {gateIsYes && !isExpanded && canOfferAdd && (
          <div className="form-add-more-row form-optional-group-action">
            <button
              type="button"
              className="form-add-more-button"
              onClick={() =>
                setValue?.(group.triggerFieldId, group.expandValue ?? true, {
                  shouldDirty: true,
                  shouldTouch: true
                })
              }
            >
              {group.buttonLabel}
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="form-add-more-row form-optional-group-action">
            <button
              type="button"
              className="form-add-more-button form-remove-button"
              onClick={() => clearOptionalFieldGroup(group, { preserveGateValue: hasGateFieldInTemplate })}
            >
              {group.removeButtonLabel}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Check if a field should be shown based on conditional rules
  const shouldShowField = (field: TemplateField): boolean => {
    if (!field.conditional) return true

    const { fieldId, anyOfFieldIds, anyOfValues, equals, notEquals } = field.conditional

    if (anyOfFieldIds && anyOfFieldIds.length > 0) {
      const expectedValue = equals !== undefined ? equals : true
      return anyOfFieldIds.some(conditionalFieldId => watch(conditionalFieldId) === expectedValue)
    }

    if (anyOfValues && anyOfValues.length > 0) {
      const watchedValue = watch(fieldId)
      return anyOfValues.includes(watchedValue)
    }

    const watchedValue = watch(fieldId)

    if (equals !== undefined) {
      return watchedValue === equals
    }

    if (notEquals !== undefined) {
      return watchedValue !== notEquals
    }

    return true
  }

  const shouldShowFieldWithOverride = (
    field: TemplateField,
    overrideFieldId: string,
    overrideValue: unknown
  ): boolean => {
    if (!field.conditional) return true

    const readValue = (fieldId: string) => (fieldId === overrideFieldId ? overrideValue : watch(fieldId))
    const { fieldId, anyOfFieldIds, anyOfValues, equals, notEquals } = field.conditional

    if (anyOfFieldIds && anyOfFieldIds.length > 0) {
      const expectedValue = equals !== undefined ? equals : true
      return anyOfFieldIds.some(conditionalFieldId => readValue(conditionalFieldId) === expectedValue)
    }

    if (anyOfValues && anyOfValues.length > 0) {
      return anyOfValues.includes(readValue(fieldId))
    }

    const watchedValue = readValue(fieldId)

    if (equals !== undefined) {
      return watchedValue === equals
    }

    if (notEquals !== undefined) {
      return watchedValue !== notEquals
    }

    return true
  }

  const getEmptyFieldValue = (field: TemplateField): any => {
    if (field.type === 'checkbox') {
      return false
    }

    return ''
  }

  const clearHiddenDependentFields = (
    changedFieldId: string,
    nextValue: unknown,
    visited = new Set<string>()
  ) => {
    if (typeof setValue !== 'function' || visited.has(changedFieldId)) {
      return
    }

    visited.add(changedFieldId)

    const dependentFields = template.fields.filter(candidate => {
      if (!candidate.conditional) {
        return false
      }

      return (
        candidate.conditional.fieldId === changedFieldId ||
        candidate.conditional.anyOfFieldIds?.includes(changedFieldId) === true
      )
    })

    dependentFields.forEach(dependentField => {
      const shouldRemainVisible = shouldShowFieldWithOverride(dependentField, changedFieldId, nextValue)

      if (shouldRemainVisible) {
        return
      }

      const emptyValue = getEmptyFieldValue(dependentField)

      setValue(dependentField.id, emptyValue, {
        shouldDirty: true,
        shouldTouch: true
      })

      clearHiddenDependentFields(dependentField.id, emptyValue, visited)
    })
  }

  const getFieldContainerStyle = (field: TemplateField) => {
    if (
      field.section === 'Conservator Balance Sheet' &&
      ['realPropertyItem1', 'realPropertyItem2', 'realPropertyItem3', 'realPropertyOtherValue'].includes(field.id)
    ) {
      return { gridColumn: '1 / -1' as const }
    }

    if (field.type === 'textarea' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'file') {
      return { gridColumn: '1 / -1' as const }
    }

    return {}
  }

  // Render a single field based on its type
  const renderFieldByType = (field: TemplateField): React.ReactNode => {
    // If custom renderer provided, use it
    if (renderField) {
      return renderField(field, {
        register,
        errors,
        watch
      })
    }

    const fieldId = field.id
    const individualName = watch('individualName')
    const label = getDisplayLabel(field.label, individualName, fieldId)
    const placeholder = field.placeholder ? getDisplayLabel(field.placeholder, individualName, fieldId) : undefined
    const error = errors[fieldId]

    switch (field.type) {
      case 'textarea':
        if (!isMultilineDescriptionField(field)) {
          return (
            <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
              <label htmlFor={fieldId}>
                {label}
                {field.validation?.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                id={fieldId}
                placeholder={placeholder}
                {...register(fieldId, field.validation)}
              />
              {error && <span className="field-error-message">{String(error.message)}</span>}
            </div>
          )
        }

        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>
              {label}
              {field.validation?.required && <span className="required">*</span>}
            </label>
            <textarea
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
              rows={4}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'checkbox':
        return (
          <div className={`form-group checkbox-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                id={fieldId}
                {...register(fieldId, {
                  onChange: event => {
                    clearHiddenDependentFields(fieldId, (event.target as HTMLInputElement).checked)
                  }
                })}
              />
              <span className="checkbox-text">{label}</span>
            </label>
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'select':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <select
              id={fieldId}
              {...register(fieldId, field.validation)}
              defaultValue={field.defaultValue ?? ''}
            >
              {field.options?.map((option: FieldOption) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'radio':
        return (
          <div className={`form-group radio-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label className="radio-label">{label}</label>
            <div className="radio-options">
              {field.options?.map((option: FieldOption) => (
                <label key={String(option.value)} className="radio-option">
                  <input
                    type="radio"
                    value={String(option.value)}
                    {...register(fieldId, {
                      ...field.validation,
                      onChange: event => {
                        clearHiddenDependentFields(fieldId, (event.target as HTMLInputElement).value)
                      }
                    })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'date':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type="date"
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'number':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type="number"
              id={fieldId}
              placeholder={placeholder}
              step="0.01"
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'email':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type="email"
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'tel':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type="tel"
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'file':
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type="file"
              id={fieldId}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )

      case 'text':
      default:
        return (
          <div className={`form-group ${error ? 'has-error' : ''}`} style={getFieldContainerStyle(field)}>
            <label htmlFor={fieldId}>
              {label}
              {field.validation?.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="field-error-message">{String(error.message)}</span>}
          </div>
        )
    }
  }

  if (controlOnly) {
    const sectionName = visibleSections?.[0] ?? 'Other'
    const display = SECTION_DISPLAY[sectionName] ?? { title: sectionName }

    return (
      <div className="dynamic-form">
        <fieldset className="form-section">
          <legend>{display.title}</legend>
          {display.description && (
            <p className="form-section-description">{display.description}</p>
          )}
          <div className="form-subsection">
            <div className="form-section-fields">
              {visibleOptionalGroupIds?.map(optionalGroupId => {
                const optionalGroup = optionalFieldGroups.find(groupConfig => groupConfig.id === optionalGroupId)
                if (!optionalGroup) {
                  return null
                }

                return renderOptionalGroupControls(optionalGroup)
              })}
            </div>
          </div>
        </fieldset>
      </div>
    )
  }

  return (
    <div className="dynamic-form">
      {visibleOrderedSections.map(({ sectionName, fields, display }) => (
        <fieldset key={sectionName} className="form-section">
          <legend>{display.title}</legend>
          {display.description && (
            <p className="form-section-description">{display.description}</p>
          )}
          {groupedSectionFields(sectionName, fields).map((group, index) => (
            <div key={`${sectionName}-${group.title ?? 'default'}-${index}`} className="form-subsection">
              {group.title && <h3 className="form-subsection-title">{group.title}</h3>}
              <div className="form-section-fields">
                {group.fields.map(field => {
                  if (
                    field.section === 'Conservator Balance Sheet' &&
                    BALANCE_SHEET_SUPPRESSED_TRIGGER_FIELDS.has(field.id)
                  ) {
                    return null
                  }

                  const optionalFieldGroup = optionalFieldGroupByFieldId.get(field.id)
                  if (optionalFieldGroup) {
                    const isExpanded = getOptionalFieldGroupExpansion(optionalFieldGroup)
                    if (!isExpanded) {
                      return null
                    }
                  }

                  if (!shouldShowField(field)) {
                    return null
                  }

                  return <React.Fragment key={field.id}>{renderFieldByType(field)}</React.Fragment>
                })}
              </div>
            </div>
          ))}
          {sectionName === 'Conservator Balance Sheet' && visibleOptionalGroupIds?.length ? (
            <div className="form-subsection">
              <div className="form-section-fields">
                {visibleOptionalGroupIds.map(optionalGroupId => {
                  const optionalGroup = optionalFieldGroups.find(groupConfig => groupConfig.id === optionalGroupId)
                  if (!optionalGroup) {
                    return null
                  }

                  return renderOptionalGroupControls(optionalGroup)
                })}
              </div>
            </div>
          ) : null}
        </fieldset>
      ))}
    </div>
  )
}

/**
 * Compact Form variant - renders fields in a more compact grid layout
 */
export const CompactDynamicForm: React.FC<DynamicFormProps> = ({
  template,
  register,
  errors,
  watch,
  renderField
}) => {
  // Group fields by section
  const fieldsBySectionMap = useMemo(() => {
    const sections = new Map<string, TemplateField[]>()

    for (const field of template.fields) {
      if (field.includeInForm === false) {
        continue
      }

      const sectionName = field.section || 'Other'
      const existing = sections.get(sectionName) || []
      existing.push(field)
      sections.set(sectionName, existing)
    }

    return sections
  }, [template.fields])

  const shouldShowField = (field: TemplateField): boolean => {
    if (!field.conditional) return true

    const { fieldId, anyOfFieldIds, anyOfValues, equals, notEquals } = field.conditional

    if (anyOfFieldIds && anyOfFieldIds.length > 0) {
      const expectedValue = equals !== undefined ? equals : true
      return anyOfFieldIds.some(conditionalFieldId => watch(conditionalFieldId) === expectedValue)
    }

    if (anyOfValues && anyOfValues.length > 0) {
      const watchedValue = watch(fieldId)
      return anyOfValues.includes(watchedValue)
    }

    const watchedValue = watch(fieldId)

    if (equals !== undefined) {
      return watchedValue === equals
    }

    if (notEquals !== undefined) {
      return watchedValue !== notEquals
    }

    return true
  }

  const renderFieldByType = (field: TemplateField): React.ReactNode => {
    if (renderField) {
      return renderField(field, { register, errors, watch })
    }

    const fieldId = field.id
    const individualName = watch('individualName')
    const label = getDisplayLabel(field.label, individualName, fieldId)
    const placeholder = field.placeholder ? getDisplayLabel(field.placeholder, individualName, fieldId) : undefined
    const error = errors[fieldId]

    switch (field.type) {
      case 'checkbox':
        return (
          <label key={fieldId} className="compact-checkbox">
            <input type="checkbox" id={fieldId} {...register(fieldId)} />
            <span>{label}</span>
            {error && <span className="error-message">{String(error.message)}</span>}
          </label>
        )

      case 'textarea':
        if (!isMultilineDescriptionField(field)) {
          return (
            <div key={fieldId} className="compact-field full-width">
              <label htmlFor={fieldId}>{label}</label>
              <input
                type="text"
                id={fieldId}
                placeholder={placeholder}
                {...register(fieldId, field.validation)}
              />
              {error && <span className="error-message">{String(error.message)}</span>}
            </div>
          )
        }

        return (
          <div key={fieldId} className="compact-field full-width">
            <label htmlFor={fieldId}>{label}</label>
            <textarea
              id={fieldId}
              placeholder={placeholder}
              {...register(fieldId, field.validation)}
              rows={3}
            />
            {error && <span className="error-message">{String(error.message)}</span>}
          </div>
        )

      case 'select':
        return (
          <div key={fieldId} className="compact-field" style={{ width: `${(field.width || 6) * 8.33}%` }}>
            <label htmlFor={fieldId}>{label}</label>
            <select id={fieldId} {...register(fieldId, field.validation)} defaultValue={field.defaultValue ?? ''}>
              {field.options?.map((option: FieldOption) => (
                <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
              ))}
            </select>
            {error && <span className="error-message">{String(error.message)}</span>}
          </div>
        )

      default:
        return (
          <div key={fieldId} className="compact-field" style={{ width: `${(field.width || 6) * 8.33}%` }}>
            <label htmlFor={fieldId}>{label}</label>
            <input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
              id={fieldId}
              placeholder={placeholder}
              step={field.type === 'number' ? '0.01' : undefined}
              {...register(fieldId, field.validation)}
            />
            {error && <span className="error-message">{String(error.message)}</span>}
          </div>
        )
    }
  }

  return (
    <div className="compact-dynamic-form">
      {Array.from(fieldsBySectionMap.entries()).map(([sectionName, fields]) => (
        <div key={sectionName} className="compact-section">
          <h3 className="compact-section-title">{sectionName}</h3>
          <div className="compact-fields-grid">
            {fields.map((field: TemplateField) => {
              if (!shouldShowField(field)) return null
              return renderFieldByType(field)
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DynamicForm
