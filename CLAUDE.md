# Trackly

## Branch protection

The `e2e` CI job (`.github/workflows/e2e.yml`) must pass before merging to `main`.

## Commands

- `pnpm test` — run Playwright e2e tests (Chromium only in CI)
- `pnpm test:ui` — open Playwright UI mode
- `pnpm test:debug` — run tests in debug mode
- `pnpm test:report` — open last HTML report
- `pnpm build` — TypeScript check + Vite build
- `pnpm dev` — dev server on :5173
- `pnpm preview` — preview built app on :4173

## Architecture

- React 19 + Vite SPA with HashRouter (all routes use `/#/` prefix)
- Zustand store persisted to localStorage — no backend
- i18n: German (de) + English (en), auto-detected from browser
- Base path: `/trackly/` (GitHub Pages deployment)
- Tests run against `pnpm preview` (built app on port 4173)
