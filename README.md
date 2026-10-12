# GuardianForm

GuardianForm is a React and TypeScript survey app for completing a legal guardian report and generating a filled PDF.

## Requirements

- Node.js 18 or later
- npm

## Setup

```bash
npm ci
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).

## Optional online accounts and saved reports

Without Firebase configuration, GuardianForm works locally and account saving is unavailable. To enable email/password accounts and cloud-saved progress:

1. Create a Firebase project and register a Web app.
2. In Firebase Authentication, enable the **Email/Password** provider. Add the local and production hostnames to the Authentication authorized domains.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env.local` and set the Firebase web-app values:

   ```dotenv
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   ```

5. Deploy the Firestore and Storage rules before enabling accounts in production:

   ```bash
   firebase deploy --only firestore:rules,storage --project your-project
   ```

   The included `firebase.json` points the CLI to `firestore.rules`; `--project` selects the Firebase project.
6. Restart the Vite server after changing environment variables.

The Firebase web-app settings are included in the browser bundle; they are identifiers, not service-account credentials. Restrict the API key to the required Firebase APIs and your application domains, and never put service-account keys in this frontend. Firestore security rules enforce per-account access. Review and test those rules before deployment.

### What the app does now

- Users can create an account, sign in, and request a password reset with Firebase Authentication (Email/Password).
- While signed in, a draft of the current report is automatically saved to that user's Firestore account and can be resumed later.
- Submitting a completed report saves its answers in Firestore and uploads its generated PDF to Firebase Storage. Users can reopen those answers, review them, regenerate the PDF, and download it.
- Users can delete saved completed reports, which removes both the Firestore record and its stored PDF.

Cloud Storage may require the Firebase project to use the **Blaze pay-as-you-go plan**. Review current pricing, budget alerts, retention/deletion behavior, and privacy implications before collecting real reports.

These forms may contain sensitive legal, personal, and financial information. Configure appropriate access, retention, privacy notices, and account-deletion procedures before collecting real user data. Firebase setup is optional for local use.

## Scripts

```bash
npm run build       # Type-check and build for production
npm run preview     # Preview the production build
npm run typecheck   # Check TypeScript without emitting files
npm run lint        # Run ESLint
npm test            # Run typecheck and lint
```

## Playwright tests

Install the browser dependencies once before running the end-to-end suite:

```bash
npx playwright install --with-deps
npx playwright test
```

The full suite covers Chromium, Firefox, WebKit, responsive flows, and PDF generation. Pull requests run the full Playwright suite automatically through the `PR Check` GitHub Actions workflow. Failed runs upload the Playwright report as an artifact.

## Project layout

- `src/components/` — survey and form components
- `src/templates/` — guardian report template definitions
- `src/utils/` — form derivation and PDF generation utilities
- `tests/` — Playwright and utility tests
- `public/` — static assets and the source PDF
