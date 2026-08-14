import { useState } from 'react'
import { TemplateForm } from './components/TemplateForm'
import { guardianShipFormTemplate } from './templates/guardianShipForm.template'
import './styles/templateForm.css'
import './App.css'

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [clearRequest, setClearRequest] = useState(0)

  const handleLogoClick = () => {
    if (hasStarted) {
      setClearRequest(request => request + 1)
      return
    }

    setHasStarted(false)
  }

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
            <h2 className="brand-product-name">GuardianForm</h2>
            <span className="brand-status">IN PROGRESS</span>
            <span className="brand-name">Legal Guardian<br />Survey App</span>
            <span className="brand-tagline">Form workflows · PDF generation</span>
          </span>
        </button>
        <button
          className="account-toggle"
          type="button"
          onClick={(event) => event.preventDefault()}
          aria-label="Login and logout, coming soon"
          title="Login and logout will be available in a future update"
        >
          <span>Log in</span>
          <span className="account-toggle-divider">/</span>
          <span>Log out</span>
          <small>Coming soon</small>
        </button>
      </header>
      <main className={hasStarted ? 'survey-main' : 'landing-main'}>
        {hasStarted ? (
          <TemplateForm
            template={guardianShipFormTemplate}
            clearRequest={clearRequest}
            onClear={() => setHasStarted(false)}
          />
        ) : (
          <section className="landing-page" aria-labelledby="landing-title">
            <div className="landing-copy">
              <span className="landing-eyebrow">GuardianForm</span>
              <h1 id="landing-title">A clearer way to complete your guardian report.</h1>
              <p className="landing-intro">
                GuardianForm guides you through the information needed for a legal guardian
                survey and helps turn your answers into a completed PDF form.
              </p>
              <button className="get-started-button" type="button" onClick={() => setHasStarted(true)}>
                Get started
                <span aria-hidden="true">→</span>
              </button>
              <p className="landing-note">You can review your answers before generating the PDF.</p>
            </div>
            <div className="landing-panel" aria-hidden="true">
              <div className="landing-panel-header">
                <span className="landing-panel-dot" />
                <span>Guardian survey</span>
              </div>
              <div className="landing-panel-line landing-panel-line-wide" />
              <div className="landing-panel-line" />
              <div className="landing-panel-line landing-panel-line-short" />
              <div className="landing-panel-progress">
                <span />
              </div>
              <span className="landing-panel-caption">Step-by-step guidance</span>
            </div>
          </section>
        )}
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 GuardianForm. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
