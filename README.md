# Trackly

Polysport youth coaching PWA for community coaches — no cloud account, no cost, no fuss.

## Features

- **Session management** — create training sessions with name and date; edit or delete at any time
- **Global athlete roster** — add athletes by name with optional year of birth, gender, and photo; reuse across sessions
- **Athlete profiles** — per-athlete page showing personal bests and session history
- **30+ disciplines across 5 categories** — sprint, endurance, jumping, throwing, and games (football, basketball, handball, etc.)
- **Categorized discipline picker** — tabbed dialog with icons for quick selection; favorites support
- **Live stopwatch** — configurable countdown, tap each athlete as they finish; times saved automatically
- **Score counting for games** — +/− buttons per team with inline-editable team names; save game results per heat
- **Field events** — multi-attempt entry with foul tracking; best attempt shown automatically
- **Results views** — rankings (personal best per athlete), all runs (every result ranked), and heats/games view (grouped by heat)
- **Leaderboard** — per-discipline rankings with age group filtering; context-aware heat/game terminology
- **TV / presentation mode** — full-screen leaderboard display for spectators
- **PDF export** — formatted A4 results sheet with rank, name, age group, result, and heat/game columns
- **CSV export** — download session results with proper field escaping
- **Athlete avatars** — capture or upload photos; displayed throughout the app
- **Age groups from year of birth** — automatic U8–Senior classification
- **Gender field** — optional male/female/non-binary with badge display
- **Full i18n** — German and English UI; auto-detects browser language; toggle in navbar
- **Dark mode** — light / dark / system; persists across sessions
- **Offline-capable PWA** — installable on iOS and Android, works without internet after first load
- **Landing page** — public-facing overview with feature highlights and how-to guide
- **How-to guide** — step-by-step quick start for new users
- **No backend** — all data stored in browser localStorage

## Screenshots

<!-- Add screenshots here -->

## Tech Stack

| Layer | Library |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui) |
| State | Zustand 5 (persisted to localStorage) |
| Routing | React Router v7 (HashRouter for GitHub Pages) |
| Toasts | Sonner |
| Icons | Lucide React + @iconify/react (MDI) |
| PDF | jsPDF + jspdf-autotable |
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
├── App.tsx                        App wrapper
├── main.tsx                       React entry point
├── routes.tsx                     HashRouter + route definitions
├── index.css                      Global styles (Tailwind)
├── components/
│   ├── AgeGroupBadge.tsx          Age group display badge
│   ├── GenderBadge.tsx            Gender display badge
│   ├── layout/
│   │   ├── AppLayout.tsx          Main layout wrapper
│   │   ├── Navbar.tsx             Navigation bar
│   │   └── SaveIndicator.tsx      Auto-save status indicator
│   ├── session/
│   │   ├── DisciplinePicker.tsx   Tabbed discipline selection dialog
│   │   ├── SessionCard.tsx        Session card (edit + delete)
│   │   └── TVMode.tsx             Full-screen TV/presentation mode
│   └── ui/                        shadcn/ui primitives (14 components)
├── hooks/
│   ├── use-theme.ts               Dark mode toggle
│   └── useLeaderboard.ts          Leaderboard computation + age group filtering
├── lib/
│   ├── constants.ts               Discipline configs, categories, helpers
│   ├── i18n.ts                    DE / EN translations + useTranslation hook
│   ├── locale.ts                  Intl date/number formatting
│   ├── pdfExport.ts               PDF generation (jsPDF + autotable)
│   └── utils.ts                   cn, formatValue, getAgeGroup, CSV helpers
├── pages/
│   ├── AthletePage.tsx            Single athlete profile (PBs + history)
│   ├── AthletesPage.tsx           Global athlete roster management
│   ├── HomePage.tsx               Session list, create, CSV/PDF export
│   ├── HowToPage.tsx              Step-by-step quick start guide
│   ├── LandingPage.tsx            Public landing page
│   ├── LeaderboardPage.tsx        Per-discipline leaderboard + TV mode
│   ├── NotFoundPage.tsx           404 page
│   ├── RacePage.tsx               Live stopwatch race timing
│   └── SessionPage.tsx            Session detail: athletes, results, heats
└── store/
    └── session-store.ts           Zustand store (athletes, sessions, heats)
```

## Data Model

```
Athlete     { id, name, yearOfBirth?, gender?, avatarBase64? }
Session     { id, name, date, athleteIds[], heats[] }
Heat        { id, sessionId, disciplineType, customDisciplineName?, participantIds[], startedAt, results[] }
HeatResult  { athleteId, value, unit, note?, recordedAt }
```

All data is stored under the key `trackly-storage` in `localStorage`. Language preference is stored under `trackly-lang`. Theme under `trackly-theme`.
