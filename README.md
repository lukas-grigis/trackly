# Trackly

Polysport youth coaching app for community coaches — no cloud account, no cost, no fuss.

## Features

- **Session management** — create training sessions with name and date; edit or delete at any time
- **Athlete roster** — add kids by name and optional birth year; remove with cascading result cleanup
- **25 disciplines across 4 categories** — running (timed stopwatch), jumping & throwing (distance input), games (score counting)
- **Categorized discipline picker** — tabbed dialog with icons for quick selection across 25+ disciplines
- **Live stopwatch** — tap each athlete as they finish; times saved automatically
- **Score counting** — +/− buttons per athlete for game scores, save all at once
- **Results table** — ranked view per discipline with delete button per entry
- **CSV export** — download session results with proper field escaping
- **Full i18n** — German and English UI; toggle in the navbar; auto-detects browser language
- **Dark mode** — light / dark / system; toggle in the navbar; persists across sessions
- **Offline-capable PWA** — installable on iOS and Android, works without internet after first load
- **No backend** — all data stored in browser localStorage

## Tech Stack

| Layer | Library |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui) |
| State | Zustand 5 (persisted to localStorage) |
| Routing | React Router v7 (HashRouter for GitHub Pages) |
| Toasts | Sonner |
| Icons | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build     # TypeScript check + Vite build → dist/
pnpm preview   # Serve the production build locally
```

## Deployment

The app deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

To enable:
1. Go to **Settings → Pages** in your GitHub repository
2. Set **Source** to **GitHub Actions**
3. Push to `main`

The workflow: installs pnpm dependencies → runs `pnpm build` → uploads `dist/` → deploys to `<username>.github.io/<repo>/`.

## PWA Icons

Place two PNG files in `public/icons/`:
- `icon-192.png` — 192 × 192 px
- `icon-512.png` — 512 × 512 px

These are referenced by the web app manifest. Use a track/running icon with the primary orange (`#FF6B2B`) brand color.

## Project Structure

```
src/
├── components/
│   ├── layout/         Navbar, AppLayout
│   ├── session/        SessionCard (edit + delete with confirmation)
│   └── ui/             shadcn/ui components
├── hooks/
│   └── use-theme.ts    Dark mode toggle
├── lib/
│   ├── constants.ts    Discipline config (unit, sort direction)
│   ├── i18n.ts         DE / EN translations + useTranslation hook
│   ├── locale.ts       Intl date/number formatting
│   └── utils.ts        cn, formatTime, formatDistance, escapeCsvField
├── pages/
│   ├── HomePage.tsx    Session list, create, CSV export, clear all
│   ├── SessionPage.tsx Athletes tab + Results tab
│   ├── RacePage.tsx    Live stopwatch race timing
│   └── NotFoundPage.tsx 404
├── routes.tsx          HashRouter + route definitions
└── store/
    └── session-store.ts Zustand store (sessions, children, results)
```

## Data Model

```
Session { id, name, date, children[], results[] }
Child   { id, name, yearOfBirth? }
Result  { id, childId, discipline, value, unit, recordedAt }
```

All data is stored under the key `trackly-storage` in `localStorage`. Language preference is stored under `trackly-lang`. Theme under `trackly-theme`.
