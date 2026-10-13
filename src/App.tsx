import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { AccountDialog } from './components/AccountDialog'
import { AccountSettingsDialog } from './components/AccountSettingsDialog'
import { DraftDeleteDialog } from './components/DraftDeleteDialog'
import { SavedDraftRow } from './components/SavedDraftRow'
import { TemplateForm } from './components/TemplateForm'
import { guardianShipFormTemplate } from './templates/guardianShipForm.template'
import { firebaseAuth } from './firebase/client'
import {
  deleteDraft,
  downloadSavedReportPdf,
  listSavedReports,
  loadDraft,
  removeSavedReport,
  saveDraft,
  saveReport,
  type SavedReport
} from './services/reportStore'
import type { TemplateFormData } from './types/template.types'
import './styles/templateForm.css'
import './App.css'

const SAVED_REPORTS_LOAD_TIMEOUT_MS = 3_000

function getSavedReportsErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline, so we couldn’t connect to your saved reports. Check your connection and try again.'
  }

  if (code === 'permission-denied') {
    return 'We couldn’t access your saved reports. Check that Firestore security rules are deployed for this project.'
  }

  if (code === 'failed-precondition' || code === 'not-found') {
    return 'Saved reports aren’t available yet. Check that the Firestore database is set up for this project.'
  }

  if (code === 'unauthenticated') {
    return 'Your session has expired. Sign in again to load your saved reports.'
  }

  return 'No connection to your saved reports. Check your internet connection and try again.'
}

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [clearRequest, setClearRequest] = useState(0)
  const [homeRequest, setHomeRequest] = useState(0)
  const [formSessionKey, setFormSessionKey] = useState(0)
  const [initialFormData, setInitialFormData] = useState<TemplateFormData | undefined>()
  const [initiallyReviewing, setInitiallyReviewing] = useState(false)
  const [initialStepId, setInitialStepId] = useState<string | undefined>()
  const [user, setUser] = useState<User | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [savedDraft, setSavedDraft] = useState<SavedReport | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [savedReportsError, setSavedReportsError] = useState('')
  const [savedReportsLoadAttempt, setSavedReportsLoadAttempt] = useState(0)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)
  const [draftDeletePromptOpen, setDraftDeletePromptOpen] = useState(false)

  useEffect(() => {
    if (!firebaseAuth) return

    return onAuthStateChanged(firebaseAuth, authenticatedUser => {
      setUser(authenticatedUser)
      setAccountLoading(Boolean(authenticatedUser))
      setSavedReports([])
      setSavedDraft(null)
      setAccountError('')
      setSavedReportsError('')
    }, error => {
      setAccountError(error.message || 'Your account could not be checked.')
    })
  }, [])

  useEffect(() => {
    if (!user) return

    let isActive = true
    setAccountLoading(true)
    setSavedReportsError('')
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const reportsRequest = Promise.all([
      loadDraft(user, guardianShipFormTemplate.id),
      listSavedReports(user)
    ])
    const timeoutRequest = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Saved reports request timed out.'))
      }, SAVED_REPORTS_LOAD_TIMEOUT_MS)
    })

    Promise.race([reportsRequest, timeoutRequest])
      .then(([draft, reports]) => {
        if (!isActive) return
        setSavedDraft(draft)
        setSavedReports(reports.filter(report => report.templateId === guardianShipFormTemplate.id))
      })
      .catch(error => {
        if (isActive) {
          setSavedReportsError(getSavedReportsErrorMessage(error))
        }
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId)
        if (isActive) setAccountLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [savedReportsLoadAttempt, user])

  const handleDraftSave = useCallback(async (formData: TemplateFormData, currentStepId?: string) => {
    if (!user) throw new Error('Sign in again to save your progress.')
    await saveDraft(user, guardianShipFormTemplate.id, guardianShipFormTemplate.version, formData, currentStepId)
    setSavedDraft({
      id: 'current',
      title: 'In-progress annual report',
      templateId: guardianShipFormTemplate.id,
      templateVersion: guardianShipFormTemplate.version,
      formData,
      updatedAt: new Date().toISOString()
      , currentStepId
    })
  }, [user])

  const handleReportSave = useCallback(async (formData: TemplateFormData, pdfBlob: Blob): Promise<string | void> => {
    if (!user) throw new Error('Sign in again before saving this report.')
    const report = await saveReport(
      user,
      guardianShipFormTemplate.id,
      guardianShipFormTemplate.version,
      formData,
      pdfBlob
    )
    setSavedReports(current => [report, ...current].slice(0, 50))
    try {
      await deleteDraft(user)
      setSavedDraft(null)
    } catch (error) {
      const notice = error instanceof Error
        ? `Your previous draft could not be removed: ${error.message}`
        : 'Your previous draft could not be removed.'
      setAccountError(
        `Your report was saved, but ${notice.charAt(0).toLowerCase()}${notice.slice(1)}`
      )
      return notice
    }
  }, [user])

  const handleClearForm = () => {
    setClearRequest(0)
    setHasStarted(false)
    setInitialFormData(undefined)

    if (user) {
      void deleteDraft(user).then(() => {
        setSavedDraft(null)
      }).catch(error => {
        setAccountError(
          error instanceof Error
            ? `The form was cleared on this device, but its saved draft could not be removed: ${error.message}`
            : 'The form was cleared on this device, but its saved draft could not be removed.'
        )
      })
    }
  }

  const startWithData = (formData?: TemplateFormData, review = false, stepId?: string) => {
    setInitialFormData(formData)
    setInitiallyReviewing(review)
    setInitialStepId(stepId)
    setFormSessionKey(key => key + 1)
    setHasStarted(true)
  }

  const handleSignOut = async () => {
    if (!firebaseAuth) return
    try {
      await signOut(firebaseAuth)
      setHasStarted(false)
      setInitialFormData(undefined)
      setInitialStepId(undefined)
      setInitiallyReviewing(false)
      setHomeRequest(0)
    } catch (error) {
      setAccountError(
        error instanceof Error
          ? `You could not be signed out: ${error.message}`
          : 'You could not be signed out. Check your connection and try again.'
      )
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!user || !window.confirm('Delete this saved report? This cannot be undone.')) return
    try {
      await removeSavedReport(user, reportId)
      setSavedReports(reports => reports.filter(report => report.id !== reportId))
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'The report could not be deleted.')
    }
  }

  const handleDeleteDraft = async () => {
    if (!user || !savedDraft) return
    try {
      await deleteDraft(user)
      setSavedDraft(null)
      setDraftDeletePromptOpen(false)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'The report draft could not be deleted.')
    }
  }

  const handleDownloadReport = async (report: SavedReport) => {
    if (!user) return
    setDownloadingReportId(report.id)
    setAccountError('')
    try {
      const pdfBlob = await downloadSavedReportPdf(user, report)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.templateId}_${report.id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'The saved PDF could not be downloaded.')
    } finally {
      setDownloadingReportId(null)
    }
  }

  const handleLogoClick = () => {
    if (hasStarted) {
      setHomeRequest(request => request + 1)
      return
    }

    setHasStarted(false)
  }

  const hasSavedReports = Boolean(savedDraft) || savedReports.length > 0

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          className="brand-lockup"
          type="button"
          onClick={handleLogoClick}
          aria-label="GuardianForm home"
        >
          <img className="brand-mark" src="/guardianform-mark.svg" alt="" />
          <span className="brand-copy">
            <span className="brand-name">GuardianForm</span>
            <span className="brand-tagline">Guardian and conservator report</span>
          </span>
        </button>
        {user ? (
          <div className="account-header">
            <span className="account-email">{user.email}</span>
            <button
              className="account-header-button"
              type="button"
              aria-label="Account menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen(open => !open)}
            >
              Account
            </button>
            {accountMenuOpen && (
              <div className="account-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => {
                  setAccountMenuOpen(false)
                  setAccountSettingsOpen(true)
                }}>Account settings</button>
                <button type="button" role="menuitem" onClick={() => {
                  setAccountMenuOpen(false)
                  void handleSignOut()
                }}>Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <button className="account-header-button" type="button" onClick={() => setAccountDialogOpen(true)}>
            Sign in
          </button>
        )}
      </header>
      <main className={hasStarted ? 'survey-main' : 'landing-main'}>
        {hasStarted ? (
          <TemplateForm
            key={formSessionKey}
            template={guardianShipFormTemplate}
            clearRequest={clearRequest}
            homeRequest={homeRequest}
            initialData={initialFormData}
            initialStepId={initialStepId}
            initiallyReviewing={initiallyReviewing}
            onDraftSave={user ? handleDraftSave : undefined}
            onRequestLogin={() => setAccountDialogOpen(true)}
            onHome={async (formData, shouldSave, currentStepId) => {
              if (shouldSave && user) {
                await handleDraftSave(formData, currentStepId)
              }
              // Choosing “Don't save” only leaves the current form session. It must not
              // overwrite or remove an already-saved draft; deletion is explicit.
              setHasStarted(false)
              setInitialFormData(undefined)
              setHomeRequest(0)
            }}
            onReportSave={user ? handleReportSave : undefined}
            onClear={handleClearForm}
          />
        ) : (
          <div className="landing-home">
            {user ? (
              <section className="account-welcome" aria-labelledby="account-welcome-title">
                <div>
                  <span className="landing-eyebrow">Your GuardianForm account</span>
                  <h1 id="account-welcome-title">Welcome back</h1>
                  <p>Signed in as <strong>{user.email}</strong>. Your saved reports are listed below.</p>
                </div>
                <button className="get-started-button" type="button" onClick={() => startWithData()}>
                  Start a new report
                  <span aria-hidden="true">→</span>
                </button>
              </section>
            ) : (
              <section className="landing-page" aria-labelledby="landing-title">
                <div className="landing-copy">
                  <span className="landing-eyebrow">For guardians and conservators</span>
                  <h1 id="landing-title">Your annual report made simple</h1>
                  <p className="landing-intro">
                    Answer a few questions at a time. We’ll turn your answers into a completed
                    report you can review, sign, and download.
                  </p>
                  <button className="get-started-button" type="button" onClick={() => startWithData()}>
                    Start my report
                    <span aria-hidden="true">→</span>
                  </button>
                  <p className="landing-note">
                    Create an account to save your progress and resume later.
                  </p>
                </div>
                <div className="landing-art">
                  <img
                    className="landing-photo"
                    src="/guardian-report-photo.png"
                    alt="People working together to complete paperwork at a table"
                  />
                </div>
              </section>
            )}
            {user && (
              <section className="saved-reports-panel" aria-labelledby="saved-reports-title">
                <div className="saved-reports-heading">
                  <div>
                    <h2 id="saved-reports-title">Saved reports</h2>
                    {hasSavedReports && <p>Drafts and completed reports saved to your account.</p>}
                  </div>
                </div>
                {accountLoading && (
                  <div className="saved-reports-loading" role="status" aria-live="polite">
                    <span className="saved-reports-spinner" aria-hidden="true" />
                    <span>Loading your saved reports…</span>
                  </div>
                )}
                {savedReportsError && (
                  <div className="saved-reports-error" role="alert">
                    <p>{savedReportsError}</p>
                    <button
                      className="saved-report-action"
                      type="button"
                      onClick={() => setSavedReportsLoadAttempt(attempt => attempt + 1)}
                      disabled={accountLoading}
                    >
                      Try again
                    </button>
                  </div>
                )}
                {accountError && <p className="account-message is-error" role="alert">{accountError}</p>}
                {!accountLoading && !savedReportsError && savedDraft && (
                  <SavedDraftRow
                    draft={savedDraft}
                    onResume={() => startWithData(savedDraft.formData, false, savedDraft.currentStepId)}
                    onDelete={() => setDraftDeletePromptOpen(true)}
                  />
                )}
                {!accountLoading && !savedReportsError && savedReports.length === 0 && !savedDraft && (
                  <p className="saved-reports-empty">
                    No saved reports yet. Start a report to see it here.
                  </p>
                )}
                {!accountLoading && !savedReportsError && savedReports.map(report => (
                  <article className="saved-report-row" key={report.id}>
                    <div>
                      <h3>{report.title}</h3>
                      <p>Saved {new Date(report.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="saved-report-actions">
                      <button
                        className="saved-report-action"
                        type="button"
                        onClick={() => startWithData(report.formData, true)}
                      >
                        Review
                      </button>
                      <button
                        className="saved-report-action"
                        type="button"
                        onClick={() => void handleDownloadReport(report)}
                        disabled={downloadingReportId === report.id}
                      >
                        {downloadingReportId === report.id ? 'Downloading…' : 'Download PDF'}
                      </button>
                      <button
                        className="saved-report-delete"
                        type="button"
                        onClick={() => void handleDeleteReport(report.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
      <footer className="app-footer">
        <p>Review your report before downloading.</p>
      </footer>
      {draftDeletePromptOpen && (
        <DraftDeleteDialog
          onCancel={() => setDraftDeletePromptOpen(false)}
          onConfirm={() => void handleDeleteDraft()}
        />
      )}
      {accountDialogOpen && <AccountDialog onClose={() => setAccountDialogOpen(false)} />}
      {accountSettingsOpen && user && (
        <AccountSettingsDialog
          user={user}
          onClose={() => setAccountSettingsOpen(false)}
          onDeleted={() => {
            setAccountSettingsOpen(false)
            setAccountMenuOpen(false)
            setHasStarted(false)
            setInitialFormData(undefined)
          }}
        />
      )}
    </div>
  )
}

export default App
