import { useEffect, useState, type FormEvent } from 'react'
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword,
  type User
} from 'firebase/auth'
import { deleteAccountData } from '../services/reportStore'

interface AccountSettingsDialogProps {
  user: User
  onClose: () => void
  onDeleted: () => void
}

function getAccountSettingsError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'The current password is not correct.'
  }
  if (code === 'auth/email-already-in-use') {
    return 'That email address is already in use.'
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }
  if (code === 'auth/requires-recent-login') {
    return 'Please sign in again before changing account settings.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email changes are not available. Please contact support.'
  }
  return error instanceof Error
    ? error.message
    : 'We could not update your account. Please try again.'
}

export function AccountSettingsDialog({ user, onClose, onDeleted }: AccountSettingsDialogProps) {
  const [emailPassword, setEmailPassword] = useState('')
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [newEmail, setNewEmail] = useState(user.email ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteConfirmationFocused, setDeleteConfirmationFocused] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!toastMessage) return
    const timeoutId = window.setTimeout(() => setToastMessage(''), 10_000)
    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  const reauthenticate = async (password: string) => {
    if (!user.email || !password) {
      throw new Error('Enter your current password to continue.')
    }
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password)
    )
  }

  const runAction = async (action: string, errorField: string, callback: () => Promise<void>) => {
    setBusyAction(action)
    setToastMessage('')
    setFieldErrors({})
    try {
      await callback()
    } catch (error) {
      setFieldErrors({ [errorField]: getAccountSettingsError(error) })
    } finally {
      setBusyAction('')
    }
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newEmail.trim().toLowerCase() === (user.email ?? '').toLowerCase()) {
      setFieldErrors({ email: 'Enter a different email address.' })
      return
    }
    await runAction('email', 'email-password', async () => {
      await reauthenticate(emailPassword)
      await verifyBeforeUpdateEmail(user, newEmail.trim())
      setToastMessage('Check your new email for a verification link to finish the change.')
      setEmailPassword('')
    })
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setFieldErrors({ 'new-password': 'Choose a new password with at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ 'confirm-password': 'The new passwords do not match.' })
      return
    }
    await runAction('password', 'password-current', async () => {
      await reauthenticate(passwordCurrentPassword)
      await updatePassword(user, newPassword)
      setToastMessage('Your password was updated.')
      setPasswordCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  const handleDeleteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (deleteConfirmation !== 'DELETE') {
      setFieldErrors({ 'delete-confirmation': 'Type DELETE to confirm account deletion.' })
      return
    }
    await runAction('delete', 'delete-password', async () => {
      await reauthenticate(deletePassword)
      await deleteAccountData(user)
      await deleteUser(user)
      onDeleted()
    })
  }

  return (
    <div className="account-dialog-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !busyAction) onClose()
    }}>
      <section className="account-dialog account-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="account-settings-title">
        <button className="account-dialog-close" type="button" onClick={onClose} disabled={Boolean(busyAction)} aria-label="Close">×</button>
        <h2 id="account-settings-title">Account settings</h2>
        <p className="account-dialog-intro">Update your sign-in email or password. Sensitive changes require your current password.</p>

        <form className="account-form account-settings-section" onSubmit={handleEmailSubmit}>
          <h3>Update email</h3>
          <label htmlFor="settings-email">Email address</label>
          <input id="settings-email" type="email" required aria-invalid={Boolean(fieldErrors.email)} value={newEmail} onChange={event => setNewEmail(event.target.value)} />
          {fieldErrors.email && <p className="account-field-error" role="alert">{fieldErrors.email}</p>}
          <label htmlFor="settings-email-password">Current password</label>
          <input id="settings-email-password" type="password" required aria-invalid={Boolean(fieldErrors['email-password'])} value={emailPassword} onChange={event => setEmailPassword(event.target.value)} />
          {fieldErrors['email-password'] && <p className="account-field-error" role="alert">{fieldErrors['email-password']}</p>}
          <button className="account-submit-button" type="submit" disabled={Boolean(busyAction)}>{busyAction === 'email' ? 'Updating…' : 'Update email'}</button>
        </form>

        <form className="account-form account-settings-section" onSubmit={handlePasswordSubmit}>
          <h3>Update password</h3>
          <label htmlFor="settings-new-password">New password</label>
          <input id="settings-new-password" type="password" minLength={8} required aria-invalid={Boolean(fieldErrors['new-password'])} value={newPassword} onChange={event => setNewPassword(event.target.value)} />
          {fieldErrors['new-password'] && <p className="account-field-error" role="alert">{fieldErrors['new-password']}</p>}
          <label htmlFor="settings-confirm-password">Confirm new password</label>
          <input id="settings-confirm-password" type="password" minLength={8} required aria-invalid={Boolean(fieldErrors['confirm-password'])} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
          {fieldErrors['confirm-password'] && <p className="account-field-error" role="alert">{fieldErrors['confirm-password']}</p>}
          <label htmlFor="settings-password-current">Current password</label>
          <input id="settings-password-current" type="password" required aria-invalid={Boolean(fieldErrors['password-current'])} value={passwordCurrentPassword} onChange={event => setPasswordCurrentPassword(event.target.value)} />
          {fieldErrors['password-current'] && <p className="account-field-error" role="alert">{fieldErrors['password-current']}</p>}
          <button className="account-submit-button" type="submit" disabled={Boolean(busyAction)}>{busyAction === 'password' ? 'Updating…' : 'Update password'}</button>
        </form>

        <form className="account-form account-settings-section account-danger-section" onSubmit={handleDeleteSubmit}>
          <h3>Delete account</h3>
          <p>This permanently deletes your account, saved drafts, and completed reports.</p>
          <label htmlFor="settings-delete-confirmation">Type DELETE to confirm</label>
          <input
            id="settings-delete-confirmation"
            name="account-delete-confirmation"
            type="text"
            autoComplete="new-password"
            readOnly={!deleteConfirmationFocused}
            spellCheck={false}
            required
            aria-invalid={Boolean(fieldErrors['delete-confirmation'])}
            value={deleteConfirmation}
            onFocus={() => setDeleteConfirmationFocused(true)}
            onChange={event => setDeleteConfirmation(event.target.value)}
          />
          {fieldErrors['delete-confirmation'] && <p className="account-field-error" role="alert">{fieldErrors['delete-confirmation']}</p>}
          <label htmlFor="settings-delete-password">Current password</label>
          <input id="settings-delete-password" type="password" required aria-invalid={Boolean(fieldErrors['delete-password'])} value={deletePassword} onChange={event => setDeletePassword(event.target.value)} />
          {fieldErrors['delete-password'] && <p className="account-field-error" role="alert">{fieldErrors['delete-password']}</p>}
          <button className="account-delete-button" type="submit" disabled={Boolean(busyAction)}>{busyAction === 'delete' ? 'Deleting…' : 'Delete account'}</button>
        </form>
      </section>
      {toastMessage && <div className="account-toast" role="status">{toastMessage}</div>}
    </div>
  )
}
