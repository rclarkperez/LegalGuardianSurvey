import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore'
import {
  deleteObject,
  getBytes,
  ref as storageRef,
  uploadBytes
} from 'firebase/storage'
import type { User } from 'firebase/auth'
import type { TemplateFormData } from '../types/template.types'
import { firebaseStorage, firestore } from '../firebase/client'

const DRAFT_ID = 'current'
const MAX_FORM_DATA_BYTES = 900_000
const MAX_PDF_BYTES = 10 * 1024 * 1024

export interface SavedReport {
  id: string
  title: string
  templateId: string
  templateVersion: string
  formData: TemplateFormData
  updatedAt: string
  currentStepId?: string
  pdfStoragePath?: string
}

function getFirestore() {
  if (!firestore) {
    throw new Error('Cloud report storage is not configured. Add the Firebase project settings and try again.')
  }

  return firestore
}

function getStorage() {
  if (!firebaseStorage) {
    throw new Error(
      'Cloud PDF storage is not configured. Create a Firebase Storage bucket and set VITE_FIREBASE_STORAGE_BUCKET.'
    )
  }

  return firebaseStorage
}

function validateFormDataSize(formData: TemplateFormData) {
  const size = new TextEncoder().encode(JSON.stringify(formData)).length
  if (size > MAX_FORM_DATA_BYTES) {
    throw new Error('This report is too large to save. Please shorten long entries or clear and redraw the signature.')
  }
}

function getUserDocument(user: User, collectionName: 'drafts' | 'reports', id: string) {
  return doc(getFirestore(), 'users', user.uid, collectionName, id)
}

function asSavedReport(id: string, data: Record<string, unknown>): SavedReport {
  if (
    typeof data.title !== 'string' ||
    typeof data.templateId !== 'string' ||
    typeof data.templateVersion !== 'string' ||
    typeof data.updatedAt !== 'string' ||
    (data.currentStepId !== undefined && typeof data.currentStepId !== 'string') ||
    (
      data.pdfStoragePath !== undefined &&
      (
        typeof data.pdfStoragePath !== 'string' ||
        !/^users\/[^/]+\/reports\/[^/]+\.pdf$/.test(data.pdfStoragePath)
      )
    ) ||
    !data.formData ||
    typeof data.formData !== 'object' ||
    Array.isArray(data.formData)
  ) {
    throw new Error('A saved report has an invalid format and cannot be opened.')
  }

  const savedReport: SavedReport = {
    id,
    title: data.title,
    templateId: data.templateId,
    templateVersion: data.templateVersion,
    formData: data.formData as TemplateFormData,
    updatedAt: data.updatedAt
  }
  if (typeof data.currentStepId === 'string') savedReport.currentStepId = data.currentStepId
  if (typeof data.pdfStoragePath === 'string') {
    savedReport.pdfStoragePath = data.pdfStoragePath
  }
  return savedReport
}

export async function loadDraft(user: User, templateId: string): Promise<SavedReport | null> {
  const snapshot = await getDoc(getUserDocument(user, 'drafts', DRAFT_ID))
  if (!snapshot.exists()) {
    return null
  }

  const savedDraft = asSavedReport(snapshot.id, snapshot.data())
  if (savedDraft.templateId !== templateId) {
    throw new Error('The saved progress belongs to a different report and cannot be resumed here.')
  }

  return savedDraft
}

export async function saveDraft(
  user: User,
  templateId: string,
  templateVersion: string,
  formData: TemplateFormData,
  currentStepId?: string
): Promise<void> {
  validateFormDataSize(formData)
  await setDoc(getUserDocument(user, 'drafts', DRAFT_ID), {
    title: 'In-progress annual report',
    templateId,
    templateVersion,
    formData,
    updatedAt: new Date().toISOString(),
    ...(currentStepId ? { currentStepId } : {})
  })
}

export async function deleteDraft(user: User): Promise<void> {
  await deleteDoc(getUserDocument(user, 'drafts', DRAFT_ID))
}

export async function deleteAccountData(user: User): Promise<void> {
  await deleteDraft(user)

  const reportsSnapshot = await getDocs(collection(getFirestore(), 'users', user.uid, 'reports'))
  for (const reportSnapshot of reportsSnapshot.docs) {
    const report = asSavedReport(reportSnapshot.id, reportSnapshot.data())
    if (report.pdfStoragePath) {
      try {
        await deleteObject(storageRef(getStorage(), report.pdfStoragePath))
      } catch (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''
        if (code !== 'storage/object-not-found') throw error
      }
    }
    await deleteDoc(reportSnapshot.ref)
  }
}

export async function saveReport(
  user: User,
  templateId: string,
  templateVersion: string,
  formData: TemplateFormData,
  pdfBlob: Blob
): Promise<SavedReport> {
  validateFormDataSize(formData)
  if (pdfBlob.type !== 'application/pdf' || pdfBlob.size === 0 || pdfBlob.size > MAX_PDF_BYTES) {
    throw new Error('The generated PDF must be a non-empty PDF smaller than 10 MB to save.')
  }

  const reportRef = doc(collection(getFirestore(), 'users', user.uid, 'reports'))
  const pdfStoragePath = `users/${user.uid}/reports/${reportRef.id}.pdf`
  const pdfRef = storageRef(getStorage(), pdfStoragePath)
  const report: SavedReport = {
    id: reportRef.id,
    title: typeof formData.individualName === 'string' && formData.individualName.trim()
      ? `${formData.individualName.trim()} — Annual Report`
      : 'Annual Report',
    templateId,
    templateVersion,
    formData,
    updatedAt: new Date().toISOString(),
    pdfStoragePath
  }

  await uploadBytes(pdfRef, pdfBlob, {
    contentType: 'application/pdf',
    customMetadata: { ownerUid: user.uid }
  })
  try {
    await setDoc(reportRef, {
      title: report.title,
      templateId: report.templateId,
      templateVersion: report.templateVersion,
      formData: report.formData,
      updatedAt: report.updatedAt,
      pdfStoragePath
    })
  } catch (error) {
    try {
      await deleteObject(pdfRef)
    } catch (cleanupError) {
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : 'unknown cleanup error'
      throw new Error(
        `The report record could not be saved, and its uploaded PDF could not be cleaned up: ${cleanupMessage}`
      )
    }
    throw error
  }
  return report
}

export async function listSavedReports(user: User): Promise<SavedReport[]> {
  const reportsRef = collection(getFirestore(), 'users', user.uid, 'reports')
  const reportsQuery = query(reportsRef, orderBy('updatedAt', 'desc'), limit(50))
  const snapshot = await getDocs(reportsQuery)
  return snapshot.docs.map(report => asSavedReport(report.id, report.data()))
}

export async function removeSavedReport(user: User, reportId: string): Promise<void> {
  const reportRef = getUserDocument(user, 'reports', reportId)
  const snapshot = await getDoc(reportRef)
  if (snapshot.exists()) {
    const report = asSavedReport(snapshot.id, snapshot.data())
    if (report.pdfStoragePath) {
      const expectedPrefix = `users/${user.uid}/reports/`
      if (!report.pdfStoragePath.startsWith(expectedPrefix)) {
        throw new Error('The saved PDF path does not belong to this account.')
      }
      try {
        await deleteObject(storageRef(getStorage(), report.pdfStoragePath))
      } catch (error) {
        if (
          typeof error !== 'object' ||
          error === null ||
          !('code' in error) ||
          error.code !== 'storage/object-not-found'
        ) {
          throw error
        }
      }
    }
  }
  await deleteDoc(reportRef)
}

export async function downloadSavedReportPdf(user: User, report: SavedReport): Promise<Blob> {
  const expectedPrefix = `users/${user.uid}/reports/`
  if (!report.pdfStoragePath || !report.pdfStoragePath.startsWith(expectedPrefix)) {
    throw new Error('This saved report does not have a stored PDF file.')
  }

  const bytes = await getBytes(storageRef(getStorage(), report.pdfStoragePath), MAX_PDF_BYTES)
  return new Blob([bytes], { type: 'application/pdf' })
}
