# Trackly

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Live](https://img.shields.io/badge/live-trackly-0E7C7B.svg)](https://lukas-grigis.github.io/trackly/)
[![PWA](https://img.shields.io/badge/PWA-offline--ready-5A0FC8.svg)](https://lukas-grigis.github.io/trackly/)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)

Every weekend, community coaches show up to athletics days armed with a stopwatch, a clipboard, and a lot of patience. There's no app for this. There should be.

Trackly is that app — vibe-coded into existence, shipped as an experiment, and built with real coaches in mind. Free. Offline. No account. No nonsense.

**[Try it →](https://lukas-grigis.github.io/trackly/)**

---

## What it does

- **30+ disciplines** — sprints, endurance, jumps, throws, team games
- **Live stopwatch** — countdown beep, tap to stop each athlete
- **Field events** — multiple attempts, foul tracking, auto-best
- **Score counter** — +/− per team, editable names
- **Leaderboard + TV mode** — full-screen results with age groups (U8–Senior) and medals
- **PDF & CSV export** — print-ready results in seconds
- **Athlete roster** — add once, reuse across sessions; photo, birth year, gender all optional
- **Offline-first [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)** — install on iOS or Android, works without internet
- **German / English** — auto-detects your browser language

All data stays on your device. Nothing is sent anywhere.

---

## Built with

[React 19](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zustand](https://zustand-demo.pmnd.rs) · [vite-plugin-pwa](https://vite-pwa-org.netlify.app)

---

## Run it locally

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # → dist/
```

---

## Deploy it

Static build — deploy `dist/` anywhere. GitHub Pages deploys automatically on push to `main` via the included workflow. Enable it under **Settings → Pages → Source: GitHub Actions**.

---

## Contributing

This is an experiment, not a finished product. If you're a coach with feedback, a dev who wants to hack on it, or just someone who stumbled in — you're welcome here.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run the project locally, the branch/PR flow, and what kinds of contributions are welcome. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## License

[MIT](LICENSE) © 2026 Lukas Grigis
