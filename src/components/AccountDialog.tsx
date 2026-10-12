import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { firebaseAuth, firebaseConfigured } from '../firebase/client'

type AccountMode = 'sign-in' | 'create-account' | 'reset-password'

interface AccountDialogProps {
  onClose: () => void
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Try signing in instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password was not recognized.'
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 8 characters.'
    case 'auth/too-many-requests':
      return 'There have been too many attempts. Wait a moment and try again.'
    default:
      return 'We could not complete that account request. Check your connection and try again.'
  }
}

export function AccountDialog({ onClose }: AccountDialogProps) {
  const [mode, setMode] = useState<AccountMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!firebaseAuth) {
      setErrorMessage('Online accounts are not configured for this site yet.')
      return
    }

    if (mode === 'create-account' && password !== confirmation) {
      setErrorMessage('The passwords do not match.')
      return
    }

    setIsBusy(true)
    try {
      if (mode === 'reset-password') {
        await sendPasswordResetEmail(firebaseAuth, email)
        setSuccessMessage('If an account exists for that email, a password reset link has been sent.')
      } else if (mode === 'create-account') {
        await createUserWithEmailAndPassword(firebaseAuth, email, password)
        onClose()
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
        onClose()
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  const title = mode === 'create-account'
    ? 'Create your account'
    : mode === 'reset-password'
      ? 'Reset your password'
      : 'Sign in to GuardianForm'

  return (
    <div className="account-dialog-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !isBusy) onClose()
    }}>
      <section
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
        <button className="account-dialog-close" type="button" onClick={onClose} disabled={isBusy} aria-label="Close">
          ×
        </button>
        <h2 id="account-dialog-title">{title}</h2>
        {firebaseConfigured ? (
          <>
            <p className="account-dialog-intro">
              Sign in to save your progress and access reports from this account.
            </p>
            <form className="account-form" onSubmit={handleSubmit}>
              <label htmlFor="account-email">Email address</label>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
              {mode !== 'reset-password' && (
                <>
                  <label htmlFor="account-password">Password</label>
                  <input
                    id="account-password"
                    type="password"
                    autoComplete={mode === 'create-account' ? 'new-password' : 'current-password'}
                    minLength={8}
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </>
              )}
              {mode === 'create-account' && (
                <>
                  <label htmlFor="account-password-confirmation">Confirm password</label>
                  <input
                    id="account-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmation}
                    onChange={event => setConfirmation(event.target.value)}
                  />
                </>
              )}
              {errorMessage && <p className="account-message is-error" role="alert">{errorMessage}</p>}
              {successMessage && <p className="account-message" role="status">{successMessage}</p>}
              <button className="account-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? 'Please wait…' : mode === 'create-account' ? 'Create account' : mode === 'reset-password' ? 'Send reset link' : 'Sign in'}
              </button>
            </form>
            <div className="account-dialog-links">
              {mode === 'sign-in' && (
                <>
                  <button type="button" onClick={() => setMode('create-account')}>Create an account</button>
                  <button type="button" onClick={() => setMode('reset-password')}>Forgot password?</button>
                </>
              )}
              {mode !== 'sign-in' && (
                <button type="button" onClick={() => setMode('sign-in')}>Back to sign in</button>
              )}
            </div>
          </>
        ) : (
          <div className="account-setup-message" role="status">
            <p>Account saving is not configured for this site yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
