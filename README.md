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
