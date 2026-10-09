/**
 * Template Form Component
 * 
 * Integrates the dynamic form with PDF generation using the template schema.
 * This is the main component for filling out and submitting template-based forms.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form'
import type { PdfTemplate, TemplateField, TemplateFormData } from '../types/template.types'
import { BALANCE_SHEET_OPTIONAL_GROUPS, DynamicForm, SECTION_DISPLAY, SECTION_GROUPS } from './DynamicForm'
import { getDisplayLabel } from '../utils/fieldLabelHelpers'

interface TemplateFormProps {
  /** The PDF template schema to use */
  template: PdfTemplate
  /** Custom CSS class */
  className?: string
  /** Callback when form is successfully submitted */
  onSuccess?: (pdfBlob: Blob, formData: TemplateFormData) => void
  /** Callback when form submission fails */
  onError?: (error: Error) => void
  /** Whether to show a success message */
  showSuccessMessage?: boolean
  /** Custom submit button text */
  submitButtonText?: string
  /** Increment to request the clear-form confirmation from outside the form */
  clearRequest?: number
  /** Callback after the form has been cleared */
  onClear?: () => void
}

type ConfirmationModalState =
  | {
    type: 'submit'
    title: string
    message: string
    confirmLabel: string
    formData: TemplateFormData
  }
  | {
    type: 'clear'
    title: string
    message: string
    confirmLabel: string
  }
  | null

type StepNavigationDirection = 'forward' | 'backward'

type FormStep = {
  id: string
  sectionName: string
  sectionTitle: string
  progressLabel: string
  title: string
  description: string
  fieldIds: string[]
  questionCount: number
  visibleOptionalGroupIds?: string[]
  controlOnly: boolean
}

type StepSnapshot = {
  id: string
  sectionName: string
  fieldIds: string[]
}

type PendingStepNavigation = {
  direction: StepNavigationDirection
  sourceStepId: string
  sourceStepIndex: number
  sourceStepSnapshot: StepSnapshot
  requestedStepIdsSignature: string
  requestedDestinationStepId: string | null
}

type ReviewAnswer = {
  fieldId: string
  label: string
  value: string
  signatureImage?: string
}

type ReviewSection = {
  sectionName: string
  sectionTitle: string
  answers: ReviewAnswer[]
}

const BALANCE_SHEET_HIDDEN_TRIGGER_FIELDS = new Set<string>()
const REVIEW_HIDDEN_FIELD_IDS = new Set<string>(BALANCE_SHEET_OPTIONAL_GROUPS.map(group => group.triggerFieldId))

function hasSecondPersonalPropertyItemData(formValues: TemplateFormData): boolean {
  return hasValue(formValues.liquidAssetItem2) || hasValue(formValues.undefined_39) || hasValue(formValues.undefined_40)
}

const UNBLOCKED_INSTITUTION_1_CHUNK_FIELDS = new Set([
  'Financial Institution',
  'Address',
  'Address_2',
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
])

const UNBLOCKED_INSTITUTION_2_CHUNK_FIELDS = new Set([
  'Financial Institution_2',
  'Address_3',
  'Address_4',
  'balanceSheetInstitution2City',
  'balanceSheetInstitution2State',
  'balanceSheetInstitution2Zip',
  'Account No last 4 digits_3',
  'Interest Rate',
  'Maturity Date',
  'undefined_25',
  'undefined_26',
  'Balance as of_3'
])

const BLOCKED_INSTITUTION_1_CHUNK_FIELDS = new Set([
  'Financial Institution_3',
  'Address_5',
  'Address_6',
  'balanceSheetInstitution3City',
  'balanceSheetInstitution3State',
  'balanceSheetInstitution3Zip',
  'Account No last 4 digits_4',
  'Interest Rate_2',
  'Maturity Date_2',
  'undefined_29',
  'undefined_30',
  'Balance as of_4',
  'Account No last 4 digits_5',
  'Interest Rate_3',
  'Maturity Date_3',
  'undefined_31',
  'undefined_32',
  'Balance as of_5'
])

const BLOCKED_INSTITUTION_2_CHUNK_FIELDS = new Set([
  'Financial Institution_4',
  'Address_7',
  'Address_8',
  'balanceSheetInstitution4City',
  'balanceSheetInstitution4State',
  'balanceSheetInstitution4Zip',
  'Account No last 4 digits_6',
  'Interest Rate_4',
  'Maturity Date_4',
  'undefined_33',
  'undefined_34',
  'Balance as of_6'
])

type DerivedFieldRule = {
  fieldId: string
  calculate: (formValues: TemplateFormData) => string
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== undefined && value !== null
}

function getSectionChunkTitle(sectionName: string, chunk: TemplateField[]): string | null {
  const groups = SECTION_GROUPS[sectionName]
  if (!groups || chunk.length === 0) {
    return null
  }

  const scoreGroup = (group: { title: string; fieldIds: string[] }) =>
    chunk.reduce((score, field) => {
      const matchesById = group.fieldIds.includes(field.id)
      const matchesByPdfName = field.pdfFieldNames?.some(pdfFieldName => group.fieldIds.includes(pdfFieldName)) ?? false
      return score + (matchesById || matchesByPdfName ? 1 : 0)
    }, 0)

  const bestMatch = groups
    .map(group => ({ group, score: scoreGroup(group) }))
    .sort((a, b) => b.score - a.score)[0]

  return bestMatch && bestMatch.score > 0 ? bestMatch.group.title : null
}

function getSectionProgressLabel(sectionTitle: string): string {
  return sectionTitle.replace(/^Section\s+[A-Z]\s*-\s*/i, '').trim()
}

function hasReviewableValue(field: TemplateField, value: unknown): boolean {
  if (value == null) {
    return false
  }

  if (field.type === 'checkbox') {
    return value === true
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return true
}

function formatReviewValue(field: TemplateField, value: unknown): string {
  if (field.type === 'checkbox') {
    return value === true ? 'Yes' : 'No'
  }

  if (field.options && field.options.length > 0) {
    const matchingOption = field.options.find(option => String(option.value) === String(value))
    if (matchingOption) {
      return matchingOption.label
    }
  }

  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  return String(value)
}

function readAmount(formValues: TemplateFormData, fieldId: string): number {
  const rawValue = formValues[fieldId]
  const parsedValue = typeof rawValue === 'string' ? Number(rawValue) : Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function formatDerivedAmount(value: number): string {
  return Math.abs(value) > 0 ? value.toFixed(2) : ''
}

function sumFields(formValues: TemplateFormData, fieldIds: string[]): number {
  return fieldIds.reduce((sum, fieldId) => sum + readAmount(formValues, fieldId), 0)
}

function calculateEstateAdjustmentsTotal(formValues: TemplateFormData): string {
  if (!hasValue(formValues.undefined_60)) {
    return ''
  }

  const estimatedEndingMarketValue = readAmount(formValues, 'undefined_60')
  const baselineEndingValue =
    readAmount(formValues, 'undefined_53') +
    sumFields(formValues, ESTATE_RECEIPTS_FIELD_IDS) -
    sumFields(formValues, ESTATE_DISBURSEMENTS_FIELD_IDS)

  return formatDerivedAmount(estimatedEndingMarketValue - baselineEndingValue)
}

const ESTATE_RECEIPTS_FIELD_IDS = ['fill_10', 'fill_12', 'fill_14', 'fill_16', 'fill_18', 'fill_20', 'fill_22']
const ESTATE_DISBURSEMENTS_FIELD_IDS = ['fill_24', 'fill_26', 'fill_28', 'fill_29', 'fill_31', 'fill_33', 'fill_35', 'fill_37']

const DERIVED_FIELD_RULES: DerivedFieldRule[] = [
  {
    fieldId: 'realPropertyOtherValue',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['realPropertyWorth1', 'realPropertyWorth2', 'realPropertyWorth3']))
  },
  {
    fieldId: 'receivableOtherValue',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['receivableWorth1', 'receivableWorth2', 'receivableWorth3']))
  },
  {
    fieldId: 'undefined_27',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_21', 'undefined_23', 'undefined_25']))
  },
  {
    fieldId: 'undefined_28',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_22', 'undefined_24', 'undefined_26']))
  },
  {
    fieldId: 'undefined_35',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_29', 'undefined_31', 'undefined_33']))
  },
  {
    fieldId: 'undefined_36',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_30', 'undefined_32', 'undefined_34']))
  },
  {
    fieldId: 'undefined_41',
    calculate: formValues =>
      formatDerivedAmount(
        sumFields(formValues, [
          'realPropertyOtherValue',
          'receivableOtherValue',
          'undefined_27',
          'undefined_35',
          'undefined_37',
          'undefined_39'
        ])
      )
  },
  {
    fieldId: 'undefined_42',
    calculate: formValues =>
      formatDerivedAmount(
        sumFields(formValues, [
          'realPropertyOtherValue',
          'receivableOtherValue',
          'undefined_28',
          'undefined_36',
          'undefined_38',
          'undefined_40'
        ])
      )
  },
  {
    fieldId: 'undefined_51',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_43', 'undefined_45', 'undefined_47', 'undefined_49']))
  },
  {
    fieldId: 'undefined_52',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_44', 'undefined_46', 'undefined_48', 'undefined_50']))
  },
  {
    fieldId: 'undefined_53',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_41') - readAmount(formValues, 'undefined_51'))
  },
  {
    fieldId: 'undefined_54',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_42') - readAmount(formValues, 'undefined_52'))
  },
  {
    fieldId: 'estateEstimatedReceiptsTotal',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ESTATE_RECEIPTS_FIELD_IDS))
  },
  {
    fieldId: 'estateEstimatedDisbursementsTotal',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ESTATE_DISBURSEMENTS_FIELD_IDS))
  },
  {
    fieldId: 'estateBeginningBalance',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_53'))
  },
  {
    fieldId: 'estateReceiptsTotal',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ESTATE_RECEIPTS_FIELD_IDS))
  },
  {
    fieldId: 'estateDisbursementsTotal',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ESTATE_DISBURSEMENTS_FIELD_IDS))
  },
  {
    fieldId: 'estateAdjustmentsTotal',
    calculate: formValues => calculateEstateAdjustmentsTotal(formValues)
  },
  {
    fieldId: 'undefined_59',
    calculate: formValues => calculateEstateAdjustmentsTotal(formValues)
  },
  {
    fieldId: 'estateCalculatedEndingBalance',
    calculate: formValues =>
      formatDerivedAmount(
        readAmount(formValues, 'undefined_53') +
        sumFields(formValues, ESTATE_RECEIPTS_FIELD_IDS) -
        sumFields(formValues, ESTATE_DISBURSEMENTS_FIELD_IDS) +
        readAmount(formValues, 'estateAdjustmentsTotal')
      )
  },
  {
    fieldId: 'estateBalanceDifference',
    calculate: formValues =>
      formatDerivedAmount(
        readAmount(formValues, 'undefined_60') - readAmount(formValues, 'estateCalculatedEndingBalance')
      )
  },
  {
    fieldId: 'undefined_81',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_67', 'undefined_69', 'undefined_71', 'undefined_73', 'undefined_75', 'undefined_77', 'undefined_79']))
  },
  {
    fieldId: 'undefined_82',
    calculate: formValues => formatDerivedAmount(sumFields(formValues, ['undefined_68', 'undefined_70', 'undefined_72', 'undefined_74', 'undefined_76', 'undefined_78', 'undefined_80']))
  },
  {
    fieldId: 'undefined_83',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_82') * 12)
  },
  {
    fieldId: 'fill_45',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_82') * 12)
  },
  {
    fieldId: 'blockedAccountsTotal',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_36'))
  },
  {
    fieldId: 'unblockedAccountsTotal',
    calculate: formValues => formatDerivedAmount(readAmount(formValues, 'undefined_28'))
  }
]

function buildFormSteps(
  templateFields: TemplateField[],
  formValues: TemplateFormData,
  maxUnitsPerCard: number
): FormStep[] {
  const fieldsBySection = templateFields.reduce<Map<string, TemplateField[]>>((sections, field) => {
    if (field.includeInForm === false) {
      return sections
    }

    if (!shouldShowField(field, formValues)) {
      return sections
    }

    const sectionName = field.section || 'Other'
    const existing = sections.get(sectionName) || []
    existing.push(field)
    sections.set(sectionName, existing)
    return sections
  }, new Map<string, TemplateField[]>())

  const balanceSheetOptionalGroups = BALANCE_SHEET_OPTIONAL_GROUPS.map(config => {
    const matchedFields = templateFields.filter(field => {
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

  const optionalGroupByFieldId = new Map<string, (typeof balanceSheetOptionalGroups)[number]>()
  balanceSheetOptionalGroups.forEach(group => {
    group.matchedFieldIds.forEach(fieldId => {
      optionalGroupByFieldId.set(fieldId, group)
    })
  })

  const getOptionalGroupIdsForChunk = (chunk: TemplateField[]) =>
    Array.from(
      new Set(
        chunk
          .map(field => optionalGroupByFieldId.get(field.id)?.id)
          .filter((groupId): groupId is string => Boolean(groupId))
      )
    )

  return Array.from(fieldsBySection.entries()).flatMap(([sectionName, sectionFields]) => {
    const chunks = chunkFieldsForCards(sectionName, sectionFields, maxUnitsPerCard).filter(chunk => {
      const fieldIds = chunk.map(field => field.id)

      if (!shouldIncludeStepChunk(sectionName, fieldIds, formValues)) {
        return false
      }

      return chunk.some(field => isFieldVisibleInStep(field, formValues))
    })
    const display = SECTION_DISPLAY[sectionName] ?? { title: sectionName, description: undefined }

    return chunks.map((chunk, index) => {
      const chunkTitle = getSectionChunkTitle(sectionName, chunk)
      const stableStepId = `${sectionName}:${chunk.map(field => field.id).join('|')}`
      const sectionProgressLabel = getSectionProgressLabel(display.title)
      const fieldStep: FormStep = {
        id: stableStepId,
        sectionName,
        sectionTitle: display.title,
        progressLabel:
          chunks.length > 1
            ? `${sectionProgressLabel} (${index + 1} of ${chunks.length})`
            : sectionProgressLabel,
        title:
          `${display.title}${chunkTitle ? `: ${chunkTitle}` : ''}`,
        description:
          chunkTitle && chunkTitle !== display.title
            ? `Complete the ${chunkTitle.toLowerCase()} questions.`
            : display.description ?? 'Complete the next few questions in this section.',
        fieldIds: chunk.map(field => field.id),
        questionCount: chunk.length,
        controlOnly: false
      }
      if (sectionName === 'Conservator Balance Sheet') {
        const optionalGroupIds = getOptionalGroupIdsForChunk(chunk)
        if (optionalGroupIds.length > 0) {
          fieldStep.visibleOptionalGroupIds = optionalGroupIds
        }
      }

      return fieldStep
    })
  })
}

function getStepIdsSignature(formSteps: FormStep[]): string {
  return formSteps.map(formStep => formStep.id).join('>')
}

function findEquivalentStepIndex(
  formSteps: FormStep[],
  previousStep: StepSnapshot | null,
  fallbackStep: number
): number | null {
  if (!previousStep) {
    return null
  }

  const exactMatchIndex = formSteps.findIndex(formStep => formStep.id === previousStep.id)
  if (exactMatchIndex >= 0) {
    return exactMatchIndex
  }

  const previousFieldIds = new Set(previousStep.fieldIds)
  const matchingSectionSteps = formSteps
    .map((formStep, index) => ({ formStep, index }))
    .filter(({ formStep }) => formStep.sectionName === previousStep.sectionName)

  if (matchingSectionSteps.length === 0) {
    return null
  }

  const bestMatch = matchingSectionSteps.reduce((currentBest, candidate) => {
    const overlapCount = candidate.formStep.fieldIds.filter(fieldId => previousFieldIds.has(fieldId)).length
    const distanceFromFallback = Math.abs(candidate.index - fallbackStep)

    if (!currentBest) {
      return { ...candidate, overlapCount, distanceFromFallback }
    }

    if (overlapCount > currentBest.overlapCount) {
      return { ...candidate, overlapCount, distanceFromFallback }
    }

    if (overlapCount === currentBest.overlapCount && distanceFromFallback < currentBest.distanceFromFallback) {
      return { ...candidate, overlapCount, distanceFromFallback }
    }

    return currentBest
  }, null as null | {
    formStep: FormStep
    index: number
    overlapCount: number
    distanceFromFallback: number
  })

  return bestMatch?.index ?? null
}

function getStepNavigationDestination(
  formSteps: FormStep[],
  navigation: Pick<
    PendingStepNavigation,
    'direction' | 'sourceStepId' | 'sourceStepIndex' | 'sourceStepSnapshot'
  >
): { index: number; stepId: string | null } | null {
  if (formSteps.length === 0) {
    return null
  }

  const exactSourceIndex = formSteps.findIndex(formStep => formStep.id === navigation.sourceStepId)

  if (exactSourceIndex >= 0) {
    const destinationIndex =
      navigation.direction === 'forward'
        ? Math.min(exactSourceIndex + 1, formSteps.length - 1)
        : Math.max(exactSourceIndex - 1, 0)

    return {
      index: destinationIndex,
      stepId: formSteps[destinationIndex]?.id ?? null
    }
  }

  const fallbackSourceIndex = Math.min(navigation.sourceStepIndex, formSteps.length - 1)
  const equivalentSourceIndex = findEquivalentStepIndex(
    formSteps,
    navigation.sourceStepSnapshot,
    fallbackSourceIndex
  )

  if (equivalentSourceIndex == null) {
    return null
  }

  return {
    index: equivalentSourceIndex,
    stepId: formSteps[equivalentSourceIndex]?.id ?? null
  }
}

function getPersonalPropertyDestination(
  formSteps: FormStep[],
  sourceStep: StepSnapshot,
  formValues: TemplateFormData,
  direction: StepNavigationDirection
): { index: number; stepId: string | null } | null {
  if (direction !== 'forward' || sourceStep.sectionName !== 'Conservator Balance Sheet') {
    return null
  }

  const sourceFieldIds = new Set(sourceStep.fieldIds)
  let targetFieldId: string | null = null

  if (sourceFieldIds.has('hasLiquidAssets') && !sourceFieldIds.has('liquidAssetItem1')) {
    targetFieldId = 'liquidAssetItem1'
  } else if (sourceFieldIds.has('liquidAssetItem1') && !sourceFieldIds.has('hasAdditionalLiquidAssetItem2')) {
    targetFieldId = 'hasAdditionalLiquidAssetItem2'
  } else if (
    sourceFieldIds.has('hasAdditionalLiquidAssetItem2') &&
    formValues.hasAdditionalLiquidAssetItem2 === 'yes'
  ) {
    targetFieldId = 'liquidAssetItem2'
  }

  if (!targetFieldId) {
    return null
  }

  const index = formSteps.findIndex(step => step.fieldIds.includes(targetFieldId!))
  if (index < 0) {
    return null
  }

  return { index, stepId: formSteps[index]?.id ?? null }
}

function findClosestEquivalentStepIndex(
  formSteps: FormStep[],
  previousStep: StepSnapshot | null,
  fallbackStep: number
): number {
  return findEquivalentStepIndex(formSteps, previousStep, fallbackStep) ?? fallbackStep
}

/**
 * Template-based form that generates PDF on submission
 */
export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  className = '',
  onSuccess,
  onError,
  showSuccessMessage = true,
  submitButtonText = 'Submit',
  clearRequest = 0,
  onClear
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [hasReviewReturnPath, setHasReviewReturnPath] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<StepNavigationDirection>('forward')
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    reset
  } = useForm<TemplateFormData>({
    defaultValues: getDefaultValues(template)
  })

  const formValues = watch()
  const maxUnitsPerCard = useMemo(() => getMaxUnitsPerCard(viewportWidth), [viewportWidth])
  const currentStepSnapshotRef = useRef<StepSnapshot | null>(null)
  const currentStepIndexRef = useRef(0)
  const previousRenderedStepRef = useRef<{
    index: number
    snapshot: StepSnapshot
  } | null>(null)
  const pendingStepNavigationRef = useRef<PendingStepNavigation | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (clearRequest === 0 || isSubmitting) {
      return
    }

    setConfirmationModal({
      type: 'clear',
      title: 'Clear Form?',
      message: 'Are you sure you want to clear your form? This will remove all entered answers.',
      confirmLabel: 'Clear Form'
    })
  }, [clearRequest, isSubmitting])

  useEffect(() => {
    DERIVED_FIELD_RULES.forEach(({ fieldId, calculate }) => {
      const nextValue = calculate(formValues)
      const currentValue = formValues[fieldId]

      if (currentValue !== nextValue) {
        setValue(fieldId as keyof TemplateFormData, nextValue, {
          shouldDirty: false,
          shouldTouch: false
        })
      }
    })
  }, [formValues, setValue])

  useEffect(() => {
    template.fields.forEach(field => {
      if (field.includeInForm === false || !field.conditional) {
        return
      }

      if (shouldShowField(field, formValues)) {
        return
      }

      const currentValue = formValues[field.id]
      const emptyValue = getEmptyFieldValue(field)

      if (currentValue !== emptyValue) {
        setValue(field.id as keyof TemplateFormData, emptyValue, {
          shouldDirty: false,
          shouldTouch: false
        })
      }
    })
  }, [formValues, setValue, template.fields])

  useEffect(() => {
    const shouldKeepSecondPersonalPropertyItem =
      formValues.hasLiquidAssets === 'yes' &&
      (
        formValues.hasAdditionalLiquidAssetItem2 === 'yes' ||
        hasSecondPersonalPropertyItemData(formValues)
      )
    const secondPersonalPropertyFieldIds = template.fields
      .filter(field => {
        const pdfFieldNames = field.pdfFieldNames ?? []
        return (
          field.id === 'liquidAssetItem2' ||
          pdfFieldNames.includes('undefined_39') ||
          pdfFieldNames.includes('undefined_40')
        )
      })
      .map(field => field.id)

    if (shouldKeepSecondPersonalPropertyItem) {
      return
    }

    secondPersonalPropertyFieldIds.forEach(fieldId => {
      if (formValues[fieldId] === '') {
        return
      }

      setValue(fieldId as keyof TemplateFormData, '', {
        shouldDirty: false,
        shouldTouch: false
      })
    })
  }, [
    formValues,
    formValues.hasAdditionalLiquidAssetItem2,
    formValues.hasLiquidAssets,
    setValue,
    template.fields
  ])

  const formSteps = useMemo(
    () => buildFormSteps(template.fields, formValues, maxUnitsPerCard),
    [formValues, maxUnitsPerCard, template.fields]
  )
  const formStepIdsSignature = useMemo(() => getStepIdsSignature(formSteps), [formSteps])

  const currentStepConfig = formSteps[currentStep]
  const hasSteps = formSteps.length > 0
  const isFirstStep = !hasSteps || currentStep === 0
  const isLastStep = !hasSteps || currentStep === formSteps.length - 1
  const progressPercent = hasSteps ? ((currentStep + 1) / formSteps.length) * 100 : 0
  const roundedProgressPercent = Math.round(progressPercent)
  const reviewSections = useMemo(() => buildReviewSections(template, formValues), [formValues, template])
  const displayedProgressPercent = isReviewMode ? 100 : roundedProgressPercent
  const displayedProgressWidth = isReviewMode ? 100 : progressPercent

  useEffect(() => {
    if (formSteps.length === 0) {
      return
    }

    setCurrentStep(step => {
      const fallbackStep = Math.min(step, formSteps.length - 1)
      const pendingNavigation = pendingStepNavigationRef.current

      if (pendingNavigation) {
        const destinationIndex = pendingNavigation.requestedDestinationStepId == null
          ? -1
          : formSteps.findIndex(formStep => formStep.id === pendingNavigation.requestedDestinationStepId)

        if (destinationIndex >= 0) {
          return destinationIndex
        }

        if (formStepIdsSignature !== pendingNavigation.requestedStepIdsSignature) {
          // A conditional answer can rebuild the step list between the click
          // and this effect. Keep the requested navigation alive until the
          // list matching that request has rendered; otherwise a click on
          // "Next" can leave the user on the same conditional card.
          return fallbackStep
        }

        pendingStepNavigationRef.current = null
      }

      return findClosestEquivalentStepIndex(formSteps, currentStepSnapshotRef.current, fallbackStep)
    })
  }, [formStepIdsSignature, formSteps])

  useEffect(() => {
    if (!currentStepConfig) {
      return
    }

    const nextStepSnapshot = {
      id: currentStepConfig.id,
      sectionName: currentStepConfig.sectionName,
      fieldIds: currentStepConfig.fieldIds
    }

    if (currentStepSnapshotRef.current) {
      previousRenderedStepRef.current = {
        index: currentStepIndexRef.current,
        snapshot: currentStepSnapshotRef.current
      }
    }

    currentStepSnapshotRef.current = nextStepSnapshot
    currentStepIndexRef.current = currentStep

    const pendingNavigation = pendingStepNavigationRef.current
    if (!pendingNavigation) {
      return
    }

    if (currentStepConfig.id === pendingNavigation.requestedDestinationStepId) {
      pendingStepNavigationRef.current = null
    }
  }, [currentStep, currentStepConfig, formStepIdsSignature, formSteps])

  useEffect(() => {
    if (formSteps.length > 0) {
      return
    }

    setIsReviewMode(false)
    pendingStepNavigationRef.current = null
  }, [formSteps.length])

  const requestStepNavigation = (direction: StepNavigationDirection) => {
    if (!currentStepConfig) {
      return
    }

    const currentSourceStepSnapshot: StepSnapshot = {
      id: currentStepConfig.id,
      sectionName: currentStepConfig.sectionName,
      fieldIds: currentStepConfig.fieldIds
    }
    const previousRenderedStep = previousRenderedStepRef.current
    // Use the watched render state for conditional navigation. `getValues()`
    // can briefly lag the radio change event in WebKit/Firefox, while this is
    // the same state used to build the currently visible card list.
    const latestFormValues = formValues
    const latestFormSteps = buildFormSteps(template.fields, latestFormValues, maxUnitsPerCard)
    const currentSourceStillExists = latestFormSteps.some(
      formStep => formStep.id === currentSourceStepSnapshot.id
    )
    const previousSourceStillExists = previousRenderedStep != null && latestFormSteps.some(
      formStep => formStep.id === previousRenderedStep.snapshot.id
    )
    const shouldUsePreviousRenderedStepAsSource =
      previousRenderedStep != null &&
      !currentSourceStillExists &&
      previousSourceStillExists &&
      previousRenderedStep.index === currentStep &&
      previousRenderedStep.snapshot.sectionName === currentSourceStepSnapshot.sectionName &&
      previousRenderedStep.snapshot.id !== currentSourceStepSnapshot.id &&
      previousRenderedStep.snapshot.fieldIds.some(fieldId => currentSourceStepSnapshot.fieldIds.includes(fieldId))
    const sourceStepSnapshot = shouldUsePreviousRenderedStepAsSource
      ? previousRenderedStep.snapshot
      : currentSourceStepSnapshot
    const requestedStepIdsSignature = getStepIdsSignature(latestFormSteps)
    const requestedDestination = getPersonalPropertyDestination(
      latestFormSteps,
      sourceStepSnapshot,
      latestFormValues,
      direction
    ) ?? getStepNavigationDestination(latestFormSteps, {
      direction,
      sourceStepId: sourceStepSnapshot.id,
      sourceStepIndex: currentStep,
      sourceStepSnapshot
    })
    const fallbackIndex =
      latestFormSteps.length === 0
        ? 0
        : direction === 'forward'
          ? Math.min(currentStep + 1, latestFormSteps.length - 1)
          : Math.max(currentStep - 1, 0)

    pendingStepNavigationRef.current = {
      direction,
      sourceStepId: sourceStepSnapshot.id,
      sourceStepIndex: currentStep,
      sourceStepSnapshot,
      requestedStepIdsSignature,
      requestedDestinationStepId: requestedDestination?.stepId ?? null
    }

    if (shouldUsePreviousRenderedStepAsSource) {
      previousRenderedStepRef.current = null
    }

    const currentDestinationIndex = requestedDestination?.stepId == null
      ? -1
      : formSteps.findIndex(formStep => formStep.id === requestedDestination.stepId)

    // Resolve by stable step ID. If the destination is not in the current
    // render because a conditional answer is still rebuilding the list, the
    // pending navigation effect will select it as soon as it appears.
    if (currentDestinationIndex >= 0) {
      setCurrentStep(currentDestinationIndex)
    } else if (!requestedDestination) {
      setCurrentStep(fallbackIndex)
    }
  }

  const performSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      // Generate PDF using the template
      const { generatePdfFromTemplateUrl } = await import('../utils/templatePdfGenerator')
      const pdfBlob = await generatePdfFromTemplateUrl(
        template,
        data,
        template.pdfPath
      )

      // Trigger download
      const fileName = `${template.id}_${new Date().toISOString().split('T')[0]}.pdf`
      downloadBlob(pdfBlob, fileName)

      // Show success message
      if (showSuccessMessage) {
        setSuccessMessage('✅ PDF generated and downloaded successfully!')
      }

      // Call success callback
      onSuccess?.(pdfBlob, data)

      // Reset form and navigation state together so conditional step
      // reconciliation cannot restore the pre-submit card.
      resetToInitialState()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate PDF'
      console.error('❌ Error during form submission:', error)
      setErrorMessage(errorMsg)
      onError?.(error instanceof Error ? error : new Error(errorMsg))
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestSubmitConfirmation: SubmitHandler<TemplateFormData> = async (data: TemplateFormData) => {
    if (
      typeof data.verificationSignature !== 'string' ||
      !data.verificationSignature.startsWith('data:image/png;base64,')
    ) {
      const signatureStepIndex = formSteps.findIndex(step =>
        step.fieldIds.includes('verificationSignature')
      )
      setError('verificationSignature', {
        type: 'validate',
        message: 'Please draw your handwritten signature before submitting.'
      })
      if (signatureStepIndex >= 0) {
        setTransitionDirection('backward')
        setIsReviewMode(false)
        setHasReviewReturnPath(true)
        setCurrentStep(signatureStepIndex)
      }
      return
    }

    setConfirmationModal({
      type: 'submit',
      title: 'Submit Form?',
      message: 'Are you sure you want to submit this report and generate the PDF?',
      confirmLabel: 'Submit Form',
      formData: data
    })
  }

  const goToNextStep = () => {
    if (!currentStepConfig) {
      return
    }

    if (isLastStep) {
      openReview()
      return
    }

    setIsReviewMode(false)
    setTransitionDirection('forward')
    requestStepNavigation('forward')
  }

  const goToPreviousStep = () => {
    if (!isFirstStep && currentStepConfig) {
      setIsReviewMode(false)
      setTransitionDirection('backward')
      requestStepNavigation('backward')
    }
  }

  const openReview = () => {
    setTransitionDirection('forward')
    setIsReviewMode(true)
    setHasReviewReturnPath(false)
  }

  const closeReview = () => {
    setTransitionDirection('backward')
    setIsReviewMode(false)
    setHasReviewReturnPath(false)
  }

  const jumpToSection = (sectionName: string) => {
    const targetStepIndex = formSteps.findIndex(formStep => formStep.sectionName === sectionName)
    if (targetStepIndex < 0) {
      return
    }

    setTransitionDirection('backward')
    setIsReviewMode(false)
    setHasReviewReturnPath(true)
    setCurrentStep(targetStepIndex)
  }

  const handleInvalidSubmit = (submitErrors: FieldErrors<TemplateFormData>) => {
    const firstInvalidField = template.fields.find(field => submitErrors[field.id])
    if (firstInvalidField) {
      const targetStepIndex = formSteps.findIndex(formStep =>
        formStep.fieldIds.includes(firstInvalidField.id)
      )
      if (targetStepIndex >= 0) {
        setTransitionDirection('backward')
        setIsReviewMode(false)
        setHasReviewReturnPath(true)
        setCurrentStep(targetStepIndex)
      }
    }
  }

  const returnToReview = () => {
    setTransitionDirection('forward')
    setIsReviewMode(true)
    setHasReviewReturnPath(false)
  }

  const handleClearForm = () => {
    setConfirmationModal({
      type: 'clear',
      title: 'Clear Form?',
      message: 'Are you sure you want to clear your form? This will remove all entered answers.',
      confirmLabel: 'Clear Form'
    })
  }

  const resetToInitialState = () => {
    // Clear the navigation snapshots as well as the form values. Otherwise
    // the step-list reconciliation effect can restore the card that was
    // active before the reset when conditional cards are removed.
    currentStepSnapshotRef.current = null
    currentStepIndexRef.current = 0
    previousRenderedStepRef.current = null
    pendingStepNavigationRef.current = null
    setCurrentStep(0)
    setIsReviewMode(false)
    setHasReviewReturnPath(false)
    reset()
  }

  const closeConfirmationModal = () => {
    if (isSubmitting) {
      return
    }

    setConfirmationModal(null)
  }

  const confirmModalAction = async () => {
    if (!confirmationModal) {
      return
    }

    if (confirmationModal.type === 'clear') {
      resetToInitialState()
      setSuccessMessage('')
      setErrorMessage('')
      setConfirmationModal(null)
      onClear?.()
      return
    }

    const submitData = confirmationModal.formData
    setConfirmationModal(null)
    await performSubmit(submitData)
  }

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || event.defaultPrevented || isSubmitting || confirmationModal) {
      return
    }

    const target = event.target as HTMLElement
    const tagName = target.tagName

    if (
      tagName === 'TEXTAREA' ||
      tagName === 'BUTTON' ||
      tagName === 'A'
    ) {
      return
    }

    event.preventDefault()

    if (isReviewMode) {
      return
    }

    goToNextStep()
  }

  return (
    <form
      onSubmit={handleSubmit(requestSubmitConfirmation, handleInvalidSubmit)}
      onKeyDown={handleFormKeyDown}
      className={`template-form ${className}`}
    >
      <div className="template-form-header">
        <div className="template-form-header-main">
          <h1>{template.name}</h1>
          {template.description && <p>{template.description}</p>}
        </div>
        <button
          type="button"
          onClick={handleClearForm}
          disabled={isSubmitting}
          className="clear-form-button"
        >
          Clear Form
        </button>
      </div>

      {successMessage && (
        <div className="success-message" role="alert">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      {currentStepConfig && (
        <div className="form-progress" aria-label="Form progress">
          <div className="form-progress-meta">
            <span className="form-progress-label">
              {isReviewMode ? 'Review Your Answers' : currentStepConfig.progressLabel}
            </span>
            <span className="form-progress-completion">{displayedProgressPercent}% complete</span>
          </div>
          <div
            className="form-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayedProgressPercent}
            aria-valuetext={`${displayedProgressPercent}% complete`}
          >
            <div className="form-progress-fill" style={{ width: `${displayedProgressWidth}%` }} />
          </div>
        </div>
      )}

      {currentStepConfig && !isReviewMode && (
        <div
          key={currentStepConfig.id}
          data-step-id={currentStepConfig.id}
          className={`form-card-shell ${transitionDirection === 'forward' ? 'is-forward' : 'is-backward'}`}
        >
          <div className="form-page-header">
            <span className="form-page-kicker">{currentStepConfig.sectionTitle}</span>
            <h2>{currentStepConfig.title}</h2>
            <p>{currentStepConfig.description}</p>
          </div>

          <div className="form-card-content">
            <DynamicForm
              template={template}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              visibleSections={[currentStepConfig.sectionName]}
              visibleFieldIds={currentStepConfig.fieldIds}
              visibleOptionalGroupIds={currentStepConfig.visibleOptionalGroupIds}
              controlOnly={currentStepConfig.controlOnly}
            />
          </div>
        </div>
      )}

      {currentStepConfig && isReviewMode && (
        <div
          key="review-screen"
          data-step-id="review-screen"
          className={`form-card-shell ${transitionDirection === 'forward' ? 'is-forward' : 'is-backward'}`}
        >
          <div className="form-page-header review-page-header">
            <span className="form-page-kicker">Final Review</span>
            <h2>Review Your Answers</h2>
            <p>Check each section before generating the PDF. Use Edit to jump back and make changes without losing your answers.</p>
          </div>

          <div className="form-card-content">
            <div className="review-sections">
              {reviewSections.map(section => (
                <section key={section.sectionName} className="review-section-card">
                  <div className="review-section-header">
                    <span className="form-page-kicker review-section-kicker">{section.sectionTitle}</span>
                    <button
                      type="button"
                      className="review-edit-button"
                      onClick={() => jumpToSection(section.sectionName)}
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                  </div>

                  <dl className="review-answer-list">
                    {section.answers.length > 0 ? (
                      section.answers.map(answer => (
                        <div key={answer.fieldId} className="review-answer-row">
                          <dt>{answer.label}</dt>
                          <dd>
                            {answer.signatureImage ? (
                              <img
                                className="review-signature-image"
                                src={answer.signatureImage}
                                alt="Your handwritten signature"
                              />
                            ) : answer.value}
                          </dd>
                        </div>
                      ))
                    ) : (
                      <div className="review-answer-row review-answer-row-empty">
                        <dt>No answers captured yet</dt>
                        <dd>Return to this section if you want to add or update information before submission.</dd>
                      </div>
                    )}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="form-bottom-bar">
        <div className="form-actions">
          <div className="form-action-navigation">
            {isReviewMode ? (
              <>
                <button
                  type="button"
                  onClick={closeReview}
                  disabled={isSubmitting}
                  className="secondary-button"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(requestSubmitConfirmation, handleInvalidSubmit)}
                  disabled={isSubmitting}
                  className="submit-button"
                >
                  {isSubmitting ? 'Generating...' : submitButtonText}
                </button>
              </>
            ) : (
              <>
                {hasReviewReturnPath && (
                  <button
                    type="button"
                    onClick={returnToReview}
                    disabled={isSubmitting}
                    className="review-button"
                  >
                    Back to Review
                  </button>
                )}

                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={isSubmitting || isFirstStep}
                  className="secondary-button"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isSubmitting}
                  className="submit-button"
                >
                  {isSubmitting ? 'Generating...' : 'Next'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="form-footer">
          <p>Template: {template.name} v{template.version}</p>
          <p>Fields: {template.fields.length}</p>
        </div>
      </div>

      {confirmationModal && (
        <div
          className="confirmation-modal-backdrop"
          role="presentation"
          onClick={closeConfirmationModal}
        >
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            aria-describedby="confirmation-modal-message"
            onClick={event => event.stopPropagation()}
          >
            <h3 id="confirmation-modal-title">{confirmationModal.title}</h3>
            <p id="confirmation-modal-message">{confirmationModal.message}</p>

            <div className="confirmation-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeConfirmationModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={confirmationModal.type === 'clear' ? 'reset-button' : 'submit-button'}
                onClick={confirmModalAction}
                disabled={isSubmitting}
              >
                {isSubmitting && confirmationModal.type === 'submit'
                  ? 'Generating...'
                  : confirmationModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

function getMaxUnitsPerCard(viewportWidth: number): number {
  if (viewportWidth <= 640) {
    return 1
  }

  if (viewportWidth <= 1024) {
    return 1
  }

  return 2
}

function chunkFieldsForCards(sectionName: string, fields: TemplateField[], maxUnitsPerCard: number): TemplateField[][] {
  const sectionSpecificChunks = getSectionSpecificChunks(sectionName, fields, maxUnitsPerCard)
  if (sectionSpecificChunks) {
    return sectionSpecificChunks
  }

  const chunks: TemplateField[][] = []
  let currentChunk: TemplateField[] = []
  let currentUnits = 0

  for (const field of fields) {
    const units = getFieldCardUnits(field)
    const wouldOverflow = currentChunk.length > 0 && currentUnits + units > maxUnitsPerCard

    if (wouldOverflow) {
      chunks.push(currentChunk)
      currentChunk = []
      currentUnits = 0
    }

    currentChunk.push(field)
    currentUnits += units
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return rebalanceCardChunks(chunks, maxUnitsPerCard)
}

function getSectionSpecificChunks(
  sectionName: string,
  fields: TemplateField[],
  maxUnitsPerCard: number
): TemplateField[][] | null {
  if (sectionName === 'General Information') {
    const fieldById = new Map(fields.map(field => [field.id, field] as const))
    const chunks: TemplateField[][] = []

    const pushChunkByIds = (ids: string[]) => {
      const chunk = ids
        .map(id => fieldById.get(id))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    pushChunkByIds(['countyName', 'caseNumber'])
    pushChunkByIds(['individualName'])
    pushChunkByIds(['reportType'])
    pushChunkByIds(['guardianshipScope'])
    pushChunkByIds(['conservatorshipScope'])

    const usedFieldIds = new Set(chunks.flatMap(chunk => chunk.map(field => field.id)))
    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))

    if (remainingFields.length > 0) {
      return finalizeSectionChunks(chunks, remainingFields, maxUnitsPerCard)
    }

    return splitOversizedChunks(chunks, maxUnitsPerCard)
  }

  if (sectionName === 'Interested Governmental Agencies') {
    return [fields]
  }

  if (sectionName === 'Attorney Fees') {
    const fieldById = new Map(fields.map(field => [field.id, field] as const))
    const chunks: TemplateField[][] = []

    const pushChunkByIds = (ids: string[]) => {
      const chunk = ids
        .map(id => fieldById.get(id))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    pushChunkByIds(['attorneyLawOffice'])
    pushChunkByIds(['attorneyFeesAmount'])
    pushChunkByIds(['attorneyFeesFromDate', 'attorneyFeesToDate'])

    return chunks
  }

  if (sectionName === "Guardian's Report") {
    const fieldById = new Map(fields.map(field => [field.id, field] as const))
    const chunks: TemplateField[][] = []

    const pushChunkByIds = (ids: string[]) => {
      const chunk = ids
        .map(id => fieldById.get(id))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    pushChunkByIds(['individualStatus', 'individualStatusChangeRequested', 'individualConcerns'])
    pushChunkByIds(['servicesReceived', 'livingArrangements'])
    pushChunkByIds(['medicalCondition', 'mentalCondition'])
    pushChunkByIds(['socialArrangements', 'functionalAbility'])
    pushChunkByIds(['guardianActivities', 'visitedOrContactedIndividual', 'guardianVisits', 'visitDates'])
    pushChunkByIds(['individualParticipation', 'carePlanConsistent', 'carePlanChangeRecommended', 'carePlanChanges'])
    pushChunkByIds(['giftsReceived'])
    pushChunkByIds(['professionalNames', 'professionalServicesProvided', 'professionalServices'])
    pushChunkByIds(['delegatedAuthority', 'planDeviated', 'deviationExplanation'])
    pushChunkByIds(['futureCarePlanChanged', 'futureCarePlan', 'scopeChangeRecommended', 'scopeChangeDetails'])

    const usedFieldIds = new Set(chunks.flatMap(chunk => chunk.map(field => field.id)))
    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))

    if (remainingFields.length > 0) {
      return finalizeSectionChunks(chunks, remainingFields, maxUnitsPerCard)
    }

    return splitOversizedChunks(chunks, maxUnitsPerCard)
  }

  if (sectionName === 'Benefits') {
    const fieldById = new Map(fields.map(field => [field.id, field] as const))
    const chunks: TemplateField[][] = []

    const pushChunkByIds = (ids: string[]) => {
      const chunk = ids
        .map(id => fieldById.get(id))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    pushChunkByIds(['ssdiAmount', 'ssiAmount'])
    pushChunkByIds(['vaPensionAmount', 'gAUAmount'])
    pushChunkByIds(['foodStampsAmount', 'medicaidAmount'])
    pushChunkByIds(['medicareAmount', 'copesAmount'])
    pushChunkByIds(['tanfAmount', 'hudAmount'])
    pushChunkByIds(['ddaAmount', 'otherBenefits'])

    const usedFieldIds = new Set(chunks.flatMap(chunk => chunk.map(field => field.id)))
    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))

    if (remainingFields.length > 0) {
      return [...chunks, ...chunkFieldsForCardsFallback(remainingFields, maxUnitsPerCard)]
    }

    return chunks
  }

  if (sectionName === 'Conservator Estate Information') {
    const fieldLookup = new Map<string, TemplateField>()
    fields.forEach(field => {
      fieldLookup.set(field.id, field)
      field.pdfFieldNames?.forEach(pdfFieldName => {
        fieldLookup.set(pdfFieldName, field)
      })
    })
    const usedFieldIds = new Set<string>()
    const chunks: TemplateField[][] = []

    const pushChunkByNames = (names: string[]) => {
      const chunk = names
        .map(name => fieldLookup.get(name))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length === 0) {
        return
      }

      chunk.forEach(field => usedFieldIds.add(field.id))
      chunks.push(chunk)
    }

    pushChunkByNames([
      'estateInfoStartDate',
      'estateInfoEndDate',
      'undefined_55',
      'undefined_56',
      'Social Security SSA',
      'fill_10',
      'SSI',
      'fill_12'
    ])

    pushChunkByNames([
      'VARailroadCSA Pension',
      'fill_14',
      'Retirement Pension',
      'fill_16',
      'Wages',
      'fill_18',
      'Interest and Dividends',
      'fill_20',
      'hasOtherEstateIncome'
    ])

    pushChunkByNames([
      'Other_2',
      'fill_22',
      'undefined_57'
    ])

    pushChunkByNames([
      'fill_24',
      'Personal Funds',
      'fill_26',
      'Entertainment  Travel',
      'fill_28',
      'Conservator Fees if allowed',
      'fill_29',
      'Medical and Dental',
      'fill_31',
      'fill_33',
      'fill_35',
      'hasOtherEstateExpense'
    ])

    pushChunkByNames([
      'Other_3',
      'fill_37',
      'undefined_58',
      'undefined_59',
      'undefined_60'
    ])

    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))
    if (remainingFields.length > 0) {
      return finalizeSectionChunks(chunks, remainingFields, maxUnitsPerCard)
    }

    return splitOversizedChunks(chunks, maxUnitsPerCard)
  }

  if (sectionName === 'Conservator Explanations & Plan') {
    const fieldLookup = new Map<string, TemplateField>()
    fields.forEach(field => {
      fieldLookup.set(field.id, field)
      field.pdfFieldNames?.forEach(pdfFieldName => {
        fieldLookup.set(pdfFieldName, field)
      })
    })
    const usedFieldIds = new Set<string>()
    const chunks: TemplateField[][] = []

    const pushChunkByNames = (names: string[]) => {
      const chunk = names
        .map(name => fieldLookup.get(name))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length === 0) {
        return
      }

      chunk.forEach(field => usedFieldIds.add(field.id))
      chunks.push(chunk)
    }

    pushChunkByNames([
      'hasLargeExpenditureExplanation1',
      'Explain any large or unusual expenditures adjustments or purchases 1',
      'hasAdditionalLargeExpenditureExplanation2'
    ])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 2'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation3'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 3'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation4'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 4'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation5'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 5'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation6'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 6'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation7'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 7'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation8'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 8'])
    pushChunkByNames(['hasAdditionalLargeExpenditureExplanation9'])
    pushChunkByNames(['Explain any large or unusual expenditures adjustments or purchases 9'])

    pushChunkByNames([
      'hasServicesReceived1',
      'The the protected person receives the following services 1',
      'hasAdditionalServicesReceived2'
    ])

    pushChunkByNames([
      'The the protected person receives the following services 2',
      'hasAdditionalServicesReceived3',
      'undefined_64'
    ])

    pushChunkByNames(['conservatorScopeChangeRecommended'])

    pushChunkByNames([
      'Recommended changes in scope of the conservators authority',
      'hasAdditionalScopeChangeDetail2',
      'changed as follows 1_2',
      'hasAdditionalScopeChangeDetail3',
      'changed as follows 2_2',
      'hasAdditionalScopeChangeDetail4',
      'undefined_65'
    ])

    pushChunkByNames(['conservatorPlanDeviated'])
    pushChunkByNames(['conservatorPlanDetail1'])
    pushChunkByNames(['hasAdditionalConservatorPlanDetail2'])
    pushChunkByNames(['conservatorPlanDetail2'])
    pushChunkByNames(['hasAdditionalConservatorPlanDetail3'])
    pushChunkByNames(['conservatorPlanDetail3'])
    pushChunkByNames(['hasAdditionalConservatorPlanDetail4'])
    pushChunkByNames(['conservatorPlanDetail4'])

    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))
    if (remainingFields.length > 0) {
      return finalizeSectionChunks(chunks, remainingFields, maxUnitsPerCard)
    }

    return splitOversizedChunks(chunks, maxUnitsPerCard)
  }

  if (sectionName === 'Conservator Proposed Budget') {
    const fieldLookup = new Map<string, TemplateField>()
    fields.forEach(field => {
      fieldLookup.set(field.id, field)
      field.pdfFieldNames?.forEach(pdfFieldName => {
        fieldLookup.set(pdfFieldName, field)
      })
    })
    const usedFieldIds = new Set<string>()
    const chunks: TemplateField[][] = []

    const pushChunkByNames = (names: string[]) => {
      const chunk = names
        .map(name => fieldLookup.get(name))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length === 0) {
        return
      }

      chunk.forEach(field => usedFieldIds.add(field.id))
      chunks.push(chunk)
    }

    pushChunkByNames([
      'undefined_67',
      'undefined_68',
      'fill_33_2'
    ])
    pushChunkByNames([
      'undefined_69',
      'undefined_70',
      'fill_34'
    ])
    pushChunkByNames([
      'undefined_71',
      'undefined_72',
      'fill_35_2'
    ])
    pushChunkByNames(['hasBudgetOtherItem1'])
    pushChunkByNames([
      'Other_4',
      'Other_5',
      'undefined_73',
      'undefined_74',
      'fill_36',
      'hasAdditionalBudgetOtherItem2'
    ])
    pushChunkByNames([
      'Other_6',
      'Other_7',
      'undefined_75',
      'undefined_76',
      'fill_37_2',
      'hasAdditionalBudgetOtherItem3'
    ])
    pushChunkByNames(['Other_8', 'Other_9', 'undefined_77', 'undefined_78', 'fill_38'])
    pushChunkByNames(['undefined_79', 'undefined_80', 'fill_39'])
    pushChunkByNames(['hasGiftDisclosures'])
    pushChunkByNames(['the following gifts from the protected person worth more than a minimal value listed below 1'])
    pushChunkByNames(['hasAdditionalGiftDetail2'])
    pushChunkByNames(['the following gifts from the protected person worth more than a minimal value listed below 2'])
    pushChunkByNames(['hasAdditionalGiftDetail3'])
    pushChunkByNames(['the following gifts from the protected person worth more than a minimal value listed below 3'])
    pushChunkByNames(['hasBusinessBenefitDisclosures'])
    pushChunkByNames([
      'those businesses have benefitted from the estate of the protected person by 1',
      'hasAdditionalBusinessBenefit2'
    ])
    pushChunkByNames([
      'those businesses have benefitted from the estate of the protected person by 2',
      'hasAdditionalBusinessBenefit3'
    ])
    pushChunkByNames(['those businesses have benefitted from the estate of the protected person by 3'])

    const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))
    const flexibleChunks = splitOversizedChunks(chunks.slice(0, 1), maxUnitsPerCard)
    const pinnedDisclosureChunks = chunks.slice(1)

    if (remainingFields.length > 0) {
      return [...flexibleChunks, ...pinnedDisclosureChunks, ...chunkFieldsForCardsFallback(remainingFields, maxUnitsPerCard)]
    }

    return [...flexibleChunks, ...pinnedDisclosureChunks]
  }

  if (sectionName === 'Verification') {
    const fieldById = new Map(fields.map(field => [field.id, field] as const))
    const fieldByPdfName = new Map(
      fields.map(field => [field.pdfFieldNames?.[0] ?? field.id, field] as const)
    )
    const chunks: TemplateField[][] = []

    const pushChunkByIds = (ids: string[]) => {
      const chunk = ids
        .map(id => fieldById.get(id))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    const pushChunkByNames = (names: string[]) => {
      const chunk = names
        .map(name => fieldByPdfName.get(name))
        .filter((field): field is TemplateField => Boolean(field))

      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    }

    pushChunkByIds(['hasAdditionalRequestedOrder2'])
    pushChunkByNames(['Other 1'])
    pushChunkByNames(['Other 2'])
    pushChunkByIds(['isWsba', 'isCpg'])
    pushChunkByNames([
      'I declare under penalty of perjury under the laws of the State of Washington that the statements',
      'state',
      'on date',
      'undefined_84',
      '  WSBA   CPG'
    ])
    pushChunkByIds(['verificationSignature'])

    return chunks
  }

  if (sectionName !== 'Conservator Balance Sheet') {
    return null
  }

  const fieldLookup = new Map<string, TemplateField>()
  fields.forEach(field => {
    fieldLookup.set(field.id, field)
    field.pdfFieldNames?.forEach(pdfFieldName => {
      fieldLookup.set(pdfFieldName, field)
    })
  })
  const usedFieldIds = new Set<string>()
  const chunks: TemplateField[][] = []

  const pushChunkByNames = (names: string[]) => {
    const chunk = names
      .map(name => fieldLookup.get(name))
      .filter((field): field is TemplateField => Boolean(field))

    if (chunk.length === 0) {
      return
    }

    chunk.forEach(field => usedFieldIds.add(field.id))
    chunks.push(chunk)
  }

  pushChunkByNames(['balanceSheetStartDate', 'balanceSheetEndDate'])

  pushChunkByNames([
    'hasRealPropertyAssets',
    'realPropertyItem1',
    'realPropertyWorth1',
    'showRealPropertyItem2',
    'realPropertyItem2',
    'realPropertyWorth2',
    'showRealPropertyItem3',
    'realPropertyItem3',
    'realPropertyWorth3'
  ])

  pushChunkByNames([
    'realPropertyOtherValue'
  ])

  pushChunkByNames([
    'hasReceivables',
    'receivableItem1',
    'receivableWorth1',
    'showReceivableItem2',
    'receivableItem2',
    'receivableWorth2',
    'showReceivableItem3',
    'receivableItem3',
    'receivableWorth3'
  ])

  pushChunkByNames([
    'receivableOtherValue'
  ])

  pushChunkByNames([
    'hasUnblockedLiquidAssets'
  ])

  pushChunkByNames([
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
  ])

  pushChunkByNames([
    'hasBalanceSheetInstitution2',
  ])

  pushChunkByNames([
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
  ])

  pushChunkByNames([
    'hasBalanceSheetInstitution3'
  ])

  pushChunkByNames([
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
  ])

  pushChunkByNames([
    'hasAdditionalBlockedAccountUnderInstitution1'
  ])

  pushChunkByNames([
    'Account No last 4 digits_5',
    'Interest Rate_3',
    'Maturity Date_3',
    'undefined_31',
    'undefined_32',
    'Balance as of_5'
  ])

  pushChunkByNames([
    'hasBalanceSheetInstitution4'
  ])

  pushChunkByNames([
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
  ])

  pushChunkByNames([
    'hasLiquidAssets'
  ])

  pushChunkByNames([
    'liquidAssetItem1',
    'undefined_37',
    'undefined_38'
  ])

  pushChunkByNames([
    'hasAdditionalLiquidAssetItem2'
  ])

  pushChunkByNames([
    'liquidAssetItem2',
    'undefined_39',
    'undefined_40'
  ])

  pushChunkByNames([
    'hasAdditionalBalanceSheetDetails'
  ])

  pushChunkByNames([
    '1_8',
    'undefined_43',
    'undefined_44',
    '2_8',
    'undefined_45',
    'undefined_46'
  ])

  pushChunkByNames([
    '3_7',
    'undefined_47',
    'undefined_48'
  ])

  pushChunkByNames([
    'Loan',
    'undefined_49',
    'undefined_50'
  ])

  const remainingFields = fields.filter(field => !usedFieldIds.has(field.id))
  if (remainingFields.length > 0) {
    const pinnedChunks = chunks.slice(0, 13)
    const flexibleChunks = splitOversizedChunks(chunks.slice(13), maxUnitsPerCard)
    return [...pinnedChunks, ...flexibleChunks, ...chunkFieldsForCardsFallback(remainingFields, maxUnitsPerCard)]
  }

  const pinnedChunks = chunks.slice(0, 13)
  const flexibleChunks = splitOversizedChunks(chunks.slice(13), maxUnitsPerCard)
  return [...pinnedChunks, ...flexibleChunks]
}

function finalizeSectionChunks(
  chunks: TemplateField[][],
  remainingFields: TemplateField[],
  maxUnitsPerCard: number
): TemplateField[][] {
  const normalizedChunks = splitOversizedChunks(chunks, maxUnitsPerCard)

  if (remainingFields.length === 0) {
    return normalizedChunks
  }

  return [...normalizedChunks, ...chunkFieldsForCardsFallback(remainingFields, maxUnitsPerCard)]
}

function splitOversizedChunks(chunks: TemplateField[][], maxUnitsPerCard: number): TemplateField[][] {
  return chunks.flatMap(chunk => {
    if (getChunkUnits(chunk) <= maxUnitsPerCard) {
      return [chunk]
    }

    return chunkFieldsForCardsFallback(chunk, maxUnitsPerCard)
  })
}

function chunkFieldsForCardsFallback(fields: TemplateField[], maxUnitsPerCard: number): TemplateField[][] {
  const chunks: TemplateField[][] = []
  let currentChunk: TemplateField[] = []
  let currentUnits = 0

  for (const field of fields) {
    const units = getFieldCardUnits(field)
    const wouldOverflow = currentChunk.length > 0 && currentUnits + units > maxUnitsPerCard

    if (wouldOverflow) {
      chunks.push(currentChunk)
      currentChunk = []
      currentUnits = 0
    }

    currentChunk.push(field)
    currentUnits += units
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return rebalanceCardChunks(chunks, maxUnitsPerCard)
}

function getFieldCardUnits(field: TemplateField): number {
  if (field.type === 'textarea') {
    return 3
  }

  if (field.type === 'radio') {
    return 2
  }

  if (field.type === 'checkbox') {
    return 2
  }

  if (field.type === 'select') {
    return 1
  }

  if ((field.width || 12) >= 12) {
    return 2
  }

  if (field.type === 'date') {
    return 1
  }

  return 1
}

function getChunkUnits(fields: TemplateField[]): number {
  return fields.reduce((total, field) => total + getFieldCardUnits(field), 0)
}

function rebalanceCardChunks(chunks: TemplateField[][], maxUnitsPerCard: number): TemplateField[][] {
  const balancedChunks = [...chunks]

  for (let index = 0; index < balancedChunks.length; index += 1) {
    const chunk = balancedChunks[index]

    if (chunk.length !== 1) {
      continue
    }

    const chunkUnits = getChunkUnits(chunk)
    const previousChunk = balancedChunks[index - 1]
    const nextChunk = balancedChunks[index + 1]

    if (previousChunk && getChunkUnits(previousChunk) + chunkUnits <= maxUnitsPerCard) {
      previousChunk.push(...chunk)
      balancedChunks.splice(index, 1)
      index -= 1
      continue
    }

    if (nextChunk && chunkUnits + getChunkUnits(nextChunk) <= maxUnitsPerCard) {
      nextChunk.unshift(...chunk)
      balancedChunks.splice(index, 1)
      index -= 1
    }
  }

  return balancedChunks
}

function isFieldVisibleInStep(field: TemplateField, formValues: TemplateFormData): boolean {
  if (
    field.section === 'Conservator Balance Sheet' &&
    BALANCE_SHEET_HIDDEN_TRIGGER_FIELDS.has(field.id)
  ) {
    return false
  }

  if (field.section === 'Conservator Balance Sheet') {
    const pdfFieldName = field.pdfFieldNames?.[0]

    if (pdfFieldName) {
      const optionalGroup = BALANCE_SHEET_OPTIONAL_GROUPS.find(group =>
        group.sectionName === field.section && group.groupPdfNames.includes(pdfFieldName)
      )

      if (optionalGroup) {
        const expandValue = optionalGroup.expandValue ?? true
        const isExpanded = formValues[optionalGroup.triggerFieldId] === expandValue
        const isLeaderField = pdfFieldName === optionalGroup.leaderPdfName
        const dependencyValue = optionalGroup.dependsOnTriggerFieldId
          ? formValues[optionalGroup.dependsOnTriggerFieldId]
          : true
        const canOfferAdd =
          optionalGroup.dependsOnTriggerFieldId == null ||
          dependencyValue === true ||
          dependencyValue === 'yes'

        if (!isExpanded) {
          return isLeaderField && canOfferAdd
        }
      }
    }
  }

  return shouldShowField(field, formValues)
}

function shouldShowField(field: TemplateField, formValues: TemplateFormData): boolean {
  if (!field.conditional) return true

  const { fieldId, anyOfFieldIds, anyOfValues, equals, notEquals } = field.conditional

  if (anyOfFieldIds && anyOfFieldIds.length > 0) {
    const expectedValue = equals !== undefined ? equals : true
    return anyOfFieldIds.some(conditionalFieldId => formValues[conditionalFieldId] === expectedValue)
  }

  if (anyOfValues && anyOfValues.length > 0) {
    return anyOfValues.includes(formValues[fieldId])
  }

  const watchedValue = formValues[fieldId]

  if (equals !== undefined) {
    return watchedValue === equals
  }

  if (notEquals !== undefined) {
    return watchedValue !== notEquals
  }

  return true
}

function getEmptyFieldValue(field: TemplateField): any {
  if (field.type === 'checkbox') {
    return false
  }

  return ''
}

function shouldIncludeStepChunk(
  sectionName: string,
  fieldIds: string[],
  formValues: TemplateFormData
): boolean {
  if (sectionName !== 'Conservator Balance Sheet') {
    return true
  }

  const hasAnyField = (fieldSet: Set<string>) => fieldIds.some(fieldId => fieldSet.has(fieldId))

  if (hasAnyField(UNBLOCKED_INSTITUTION_1_CHUNK_FIELDS)) {
    return formValues.hasUnblockedLiquidAssets === 'yes'
  }

  if (fieldIds.includes('hasBalanceSheetInstitution2')) {
    return formValues.hasUnblockedLiquidAssets === 'yes'
  }

  if (hasAnyField(UNBLOCKED_INSTITUTION_2_CHUNK_FIELDS)) {
    return formValues.hasUnblockedLiquidAssets === 'yes' && formValues.hasBalanceSheetInstitution2 === 'yes'
  }

  if (hasAnyField(BLOCKED_INSTITUTION_1_CHUNK_FIELDS)) {
    return formValues.hasBalanceSheetInstitution3 === 'yes'
  }

  if (fieldIds.includes('hasAdditionalBlockedAccountUnderInstitution1')) {
    return formValues.hasBalanceSheetInstitution3 === 'yes'
  }

  if (
    fieldIds.includes('Account No last 4 digits_5') ||
    fieldIds.includes('Interest Rate_3') ||
    fieldIds.includes('Maturity Date_3') ||
    fieldIds.includes('undefined_31') ||
    fieldIds.includes('undefined_32') ||
    fieldIds.includes('Balance as of_5')
  ) {
    return (
      formValues.hasBalanceSheetInstitution3 === 'yes' &&
      formValues.hasAdditionalBlockedAccountUnderInstitution1 === 'yes'
    )
  }

  if (fieldIds.includes('hasBalanceSheetInstitution4')) {
    return formValues.hasBalanceSheetInstitution3 === 'yes'
  }

  if (hasAnyField(BLOCKED_INSTITUTION_2_CHUNK_FIELDS)) {
    return formValues.hasBalanceSheetInstitution3 === 'yes' && formValues.hasBalanceSheetInstitution4 === 'yes'
  }

  if (fieldIds.includes('hasAdditionalLiquidAssetItem2')) {
    return (
      formValues.hasLiquidAssets === 'yes' &&
      !hasSecondPersonalPropertyItemData(formValues)
    )
  }

  if (
    fieldIds.includes('liquidAssetItem2') ||
    fieldIds.includes('undefined_39') ||
    fieldIds.includes('undefined_40')
  ) {
    return (
      formValues.hasLiquidAssets === 'yes' &&
      (
        formValues.hasAdditionalLiquidAssetItem2 === 'yes' ||
        hasSecondPersonalPropertyItemData(formValues)
      )
    )
  }

  return true
}

function buildReviewSections(template: PdfTemplate, formValues: TemplateFormData): ReviewSection[] {
  const sections = new Map<string, ReviewSection>()

  template.fields.forEach(field => {
    if (field.includeInForm === false) {
      return
    }

    if (REVIEW_HIDDEN_FIELD_IDS.has(field.id)) {
      return
    }

    if (!shouldShowField(field, formValues)) {
      return
    }

    const sectionName = field.section || 'Other'

    if (!shouldIncludeStepChunk(sectionName, [field.id], formValues)) {
      return
    }

    if (!isFieldVisibleInStep(field, formValues)) {
      return
    }

    const existingSection = sections.get(sectionName)
    if (!existingSection) {
      sections.set(sectionName, {
        sectionName,
        sectionTitle: SECTION_DISPLAY[sectionName]?.title ?? sectionName,
        answers: []
      })
    }

    const fieldValue = formValues[field.id]
    if (!hasReviewableValue(field, fieldValue)) {
      return
    }

    const reviewAnswer: ReviewAnswer = {
      fieldId: field.id,
      label: getDisplayLabel(field.label, formValues.individualName, field.id),
      value: field.type === 'signature' ? '' : formatReviewValue(field, fieldValue),
      ...(field.type === 'signature' &&
        typeof fieldValue === 'string' &&
        fieldValue.startsWith('data:image/png;base64,')
        ? { signatureImage: fieldValue }
        : {})
    }

    sections.get(sectionName)?.answers.push(reviewAnswer)
  })

  return Array.from(sections.values())
}

/**
 * Get default values from template fields
 */
function getDefaultValues(template: PdfTemplate): TemplateFormData {
  const defaults: TemplateFormData = {}

  for (const field of template.fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.id] = field.defaultValue
    } else if (field.type === 'checkbox') {
      defaults[field.id] = false
    } else if (field.type === 'signature') {
      defaults[field.id] = ''
    }
  }

  return defaults
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export default TemplateForm
