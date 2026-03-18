# Trackly - Exploratory Code Review & Testing Report

**Date:** 2026-03-18
**Reviewer:** Claude (automated code review)
**Scope:** Full codebase — all pages, store, utilities, i18n, PWA config

---

## Summary

| Severity | Count |
|----------|-------|
| :red_circle: Critical | 5 |
| :yellow_circle: Important | 14 |
| :green_circle: Minor | 13 |

---

## :red_circle: Critical (data loss, crashes)

### C1. No store migration logic — version 5 has no `migrate()` handler

**File:** `src/store/session-store.ts:220`
**Description:** The Zustand persist middleware is at `version: 5`, but there is no `migrate()` function defined. If any user still has data from a previous schema version (e.g., version 4 where sessions had flat `results[]` instead of nested `heats[]`), their data will silently fail to load or will be misinterpreted, leading to data loss or crashes.

**Steps to reproduce:**
1. Load app with localStorage containing `"trackly-storage"` at version 4
2. App loads v5 code — no migration runs
3. Zustand deserializes old schema into new types — type mismatch causes silent failures or crashes

**Suggested fix:** Add a `migrate(persistedState, version)` function to the persist config that transforms v4 data (flat `results[]`) to v5 (nested `heats[].results[]`).

---

### C2. localStorage quota overflow silently drops data

**File:** `src/store/session-store.ts:237-248`
**Description:** The custom storage adapter catches `localStorage.setItem()` errors and sets `_saveError: true`, but the state mutation that triggered the save has already been applied in memory. This means the in-memory state diverges from localStorage. If the user refreshes, they lose all changes made after the quota was hit. The `avatarBase64` field on athletes (base64 JPEG data URIs) can be ~20-50KB each, and with many athletes, this can easily exhaust the ~5MB localStorage quota.

**Steps to reproduce:**
1. Add 30+ athletes with photos
2. Add many sessions with results
3. Eventually `setItem` throws `QuotaExceededError`
4. User sees brief "Save failed" toast but continues working
5. On page refresh, all recent work is lost

**Suggested fix:**
- Check available storage before saving avatars; warn proactively when approaching quota
- On `_saveError`, consider reverting the in-memory state or persisting a stripped version (without avatars)
- Show a persistent banner (not just a toast) when save fails

---

### C3. Race results use sequential ranking instead of competition ranking on RacePage

**File:** `src/pages/RacePage.tsx:311-318`
**Description:** The `rankedResults` on the finished race screen uses simple `i + 1` sequential ranking. If two athletes finish at exactly the same time (same millisecond), they get different ranks (e.g., 1 and 2) instead of the expected competition ranking (1 and 1). This is inconsistent with `SessionPage.tsx:219-248` and `useLeaderboard.ts:91-95` which both implement proper 1,1,3 competition ranking.

**Steps to reproduce:**
1. Start a timed race with 3 athletes
2. Tap two athletes at the exact same moment (they register the same ms value)
3. Finished screen shows ranks 1, 2, 3 instead of 1, 1, 3

**Suggested fix:** Apply the same competition ranking logic used in SessionPage:
```ts
for (let i = 0; i < sorted.length; i++) {
  if (i === 0) sorted[i].rank = 1;
  else if (sorted[i].time === sorted[i-1].time) sorted[i].rank = sorted[i-1].rank;
  else sorted[i].rank = i + 1;
}
```

---

### C4. No navigation-away warning during active race

**File:** `src/pages/RacePage.tsx:118-120`
**Description:** During the "running" phase, if the user navigates away (back button, clicks a nav link, or closes the tab), the timer is silently cleaned up and all unsaved finish times are lost. There is no `beforeunload` handler and no route-leave guard. The visibility change handler (line 123) only pauses the countdown, not the running timer.

**Steps to reproduce:**
1. Start a race with 5 athletes
2. Tap finish for 3 of them
3. Accidentally tap the browser back button or a nav link
4. All 3 finish times are lost with no warning

**Suggested fix:** Add a `beforeunload` event listener during the "running" and "finished" phases, and/or use React Router's `useBlocker` to prompt before navigation.

---

### C5. No React Error Boundary

**File:** `src/App.tsx`, `src/routes.tsx`
**Description:** The entire app has no Error Boundary. If any component throws during render (e.g., corrupt localStorage data, unexpected `undefined` from store), the entire app white-screens with no recovery path. This is especially risky given C1 (no migration logic).

**Steps to reproduce:**
1. Manually corrupt `localStorage["trackly-storage"]` with invalid JSON or wrong schema
2. Reload app
3. App crashes with blank screen — no way to recover without clearing localStorage manually

**Suggested fix:** Wrap `<AppRoutes />` in an Error Boundary that shows a recovery UI with a "Clear data and restart" button.

---

## :yellow_circle: Important (wrong behavior, bad UX)

### I1. Team IDs "team-a" / "team-b" leak into leaderboard computation

**File:** `src/hooks/useLeaderboard.ts:67-77`
**Description:** When game scores are saved, hardcoded IDs `"team-a"` and `"team-b"` are stored as `athleteId` in heat results (see `SessionPage.tsx:167-178`). While `LeaderboardPage.tsx:66-68` filters out game disciplines by checking `d !== "custom"`, the `computeLeaderboard` function itself does NOT filter by discipline mode. If a game discipline (e.g., football) were to be included, "team-a" and "team-b" would appear as "athletes" in the leaderboard with `athlete: undefined`.

Additionally, in `AthletePage.tsx:72`, game results are iterated and `heat.results.find((r) => r.athleteId === id)` would never match "team-a"/"team-b" for real athletes, but this relies on `heat.disciplineType === "custom"` being filtered first (line 69). The obstacle_run discipline is in the "games" category but has `mode: "timed"`, which means it goes through the normal athlete leaderboard path — this is correct, but edge-case-prone.

**Suggested fix:** Add explicit filtering in `computeLeaderboard` to skip results where `athleteId` starts with "team-" or is not in the athletes array.

---

### I2. PDF export with empty sessions generates an incomplete/empty PDF

**File:** `src/lib/pdfExport.ts:35-37, 64-130`
**Description:** If a session has zero heats, `disciplineKeys` is empty, `rows` is empty, and the PDF is generated with just a header and an empty table. No validation or user warning.

**Steps to reproduce:**
1. Create a session with no heats
2. Click the PDF export button (visible because `session.athleteIds.length > 0` check at `HomePage.tsx:224`)
3. An effectively empty PDF is downloaded

**Suggested fix:** Disable the PDF export button when `session.heats.length === 0` or show a toast warning.

---

### I3. CSV export has hardcoded English column headers

**File:** `src/pages/HomePage.tsx:39-40`
**Description:** The CSV header row is hardcoded as `["Athlete", "Discipline", "Value", "Unit", "Date"]` regardless of the user's language setting. German users will get English headers.

**Suggested fix:** Use translation keys for CSV headers: `[t.pdfName, t.disciplineLabel, t.pdfResult, t.unitLabel, t.sessionDate]`.

---

### I4. Heats view ranking in SessionPage ignores ties

**File:** `src/pages/SessionPage.tsx:761`
**Description:** In the "heats" view, ranks within a heat are computed as `ri + 1` (sequential index) instead of using competition ranking. Two athletes with the same time in a heat get different ranks.

```ts
const rank = hasResult ? ri + 1 : null;
```

**Suggested fix:** Implement competition ranking for per-heat results, similar to the "all runs" view.

---

### I5. AthletePage shows only first heat's result instead of best

**File:** `src/pages/AthletePage.tsx:126-131`
**Description:** The session history section finds only the first heat with a matching result using `.find()`, not the best result across all heats. If an athlete ran 60m sprint in heats 1 and 2, only heat 1's result appears, even if heat 2 was better.

```ts
const heat = session.heats
  .filter((h) => h.disciplineType === discipline)
  .find((h) => h.results.some((r) => r.athleteId === id));
```

**Suggested fix:** Find the best result across all heats for the discipline, not just the first.

---

### I6. TV mode only shows first discipline's leaderboard

**File:** `src/pages/LeaderboardPage.tsx:88-89`
**Description:** TV mode is hardcoded to show only the first discipline's entries:
```ts
const tvEntries = sections[0]?.entries ?? [];
const tvDiscipline = availableDisciplines[0] ?? "sprint_60";
```
If a session has multiple disciplines, only the first one is shown in TV mode.

**Suggested fix:** Add discipline tabs or auto-rotation in TV mode.

---

### I7. Age group filter excludes athletes without yearOfBirth

**File:** `src/hooks/useLeaderboard.ts:55-62`
**Description:** When any age group filter other than "All" is selected, athletes without a `yearOfBirth` are excluded entirely from the leaderboard. They simply disappear without explanation.

**Suggested fix:** Show filtered-out athletes in a separate "Unclassified" section, or show a note explaining why some athletes are hidden.

---

### I8. Custom discipline matching is case-insensitive but inconsistent

**File:** `src/pages/SessionPage.tsx:186-187`
**Description:** Custom discipline names are compared case-insensitively via `.toLowerCase()`, but are stored with their original casing. This means "Long Jump Custom" and "long jump custom" are treated as the same discipline in the results view but stored differently. This could confuse users and lead to apparent duplicates.

**Suggested fix:** Normalize custom discipline names at save time (e.g., trim and convert to title case), or make comparison consistent throughout.

---

### I9. PDF export does not use i18n for "Generated by Trackly" footer

**File:** `src/lib/pdfExport.ts:195`
**Description:** The footer text `"Generated by Trackly — ${new Date().toLocaleDateString()}"` is hardcoded in English.

**Suggested fix:** Pass this through the translation system.

---

### I10. Distance result input on SessionPage accepts raw unit values without conversion

**File:** `src/pages/SessionPage.tsx:112-131`
**Description:** The `handleAddResult()` function stores the entered value directly without unit conversion:
```ts
const value = parseFloat(resultValue);
addHeatResult(id, heatId, { athleteId, value, unit: disciplineConfig.unit, ... });
```
For `cm`-stored disciplines (e.g., long_jump), the user is expected to enter values in the stored unit (cm). But the RacePage field-entry mode shows the input in meters and converts to cm. This inconsistency means entering "5.23" for long jump on SessionPage stores 5.23 cm (0.05m), while the same entry on RacePage stores 523 cm (5.23m).

**Suggested fix:** Apply the same unit conversion logic from RacePage to SessionPage's distance entry, or show the correct unit label.

---

### I11. `_heatJustSaved` triggers duplicate toast notifications

**File:** `src/components/layout/Navbar.tsx:25-29`, `src/pages/RacePage.tsx:292`
**Description:** When saving race results, `handleSave()` calls `toast.success(t.resultsSaved)` directly AND the `_heatJustSaved` flag triggers another toast in Navbar. This results in duplicate "Results saved" toasts appearing.

**Steps to reproduce:**
1. Complete a race and click Save
2. Two "Results saved" toasts appear simultaneously

**Suggested fix:** Remove the direct `toast.success()` call in `handleSave()` since the Navbar already handles the notification via the `_heatJustSaved` flag, OR don't set `_heatJustSaved` when results are saved in bulk (only for individual inline saves).

---

### I12. PWA icon files are missing

**File:** `public/manifest.json:11-22`, `vite.config.ts:23-35`
**Description:** The manifest references `icons/icon-192.png` and `icons/icon-512.png`, but the `/public/icons/` directory does not exist and no PNG icon files are present. This means:
- PWA install prompt may not work on some browsers
- The app icon will be blank when installed to home screen
- Lighthouse PWA audit will fail

**Suggested fix:** Generate and add the required PNG icons to `public/icons/`.

---

### I13. Countdown resumes from scratch instead of remaining time

**File:** `src/pages/RacePage.tsx:201-204`
**Description:** When the countdown is paused (tab hidden) and resumed, `resumeCountdown` calls `startCountdown(countdownRemaining)` which starts a brand-new countdown interval. However, this also replays the first tick's beep immediately, and if `countdownRemaining` is 1, the user hears the beep and then Go! within 1 second. More importantly, `startCountdown` plays a beep for "tickIndex = 0" (line 158) with the wrong frequency calculation — the resumed frequency doesn't match where the countdown actually is.

**Suggested fix:** Track the actual tick position and resume with the correct frequency calculation.

---

### I14. Race "Cancel" during running phase transitions to "finished" with partial results

**File:** `src/pages/RacePage.tsx:276-279`
**Description:** Clicking "Cancel" during a running race calls `handleCancel()` which sets `phase = "finished"`. The finished screen then shows partial results (only athletes who were tapped before cancel). The user can then "Save" these partial results to the store. While this may be intentional, there's no indication that results are incomplete — the save button looks the same.

**Suggested fix:** Show a warning that results are incomplete, or offer to discard the heat entirely.

---

## :green_circle: Minor (polish, nice-to-have)

### M1. Hardcoded "Close" in dialog component

**File:** `src/components/ui/dialog.tsx:64`
**Description:** `<span className="sr-only">Close</span>` is hardcoded in English. Screen reader users always hear "Close" regardless of language setting.

**Suggested fix:** Pass the close label via context or prop from the i18n system.

---

### M2. Hardcoded "e.g. 1998" placeholder

**File:** `src/pages/AthletesPage.tsx:262`
**Description:** `placeholder="e.g. 1998"` is hardcoded in English, not translated.

**Suggested fix:** Add a translation key (e.g., `customYearPlaceholder`) and use it.

---

### M3. Language toggle uses hardcoded aria-labels

**File:** `src/components/layout/Navbar.tsx:125`
**Description:** `aria-label={l === "de" ? "Deutsch" : "English"}` — these language names should be in the translation system for consistency.

---

### M4. Score increment/decrement buttons have poor accessibility labels

**File:** `src/pages/SessionPage.tsx:532, 545`
**Description:** `aria-label="+"` and `aria-label="-"` are not descriptive for screen readers. Should be "Increment score" / "Decrement score" or translated equivalents.

---

### M5. No cross-tab synchronization for store

**File:** `src/store/session-store.ts:221-258`
**Description:** If the user opens Trackly in two tabs, there's no `storage` event listener to sync state. Edits in one tab silently overwrite the other on next save.

**Suggested fix:** Add a `window.addEventListener("storage", ...)` handler to detect external changes.

---

### M6. PDF filename sanitization strips non-Latin characters

**File:** `src/lib/pdfExport.ts:209-212`
**Description:** The regex `/[^a-zA-Z0-9\u00C0-\u024F _-]/g` only preserves Latin Extended characters. Session names with Cyrillic, CJK, Arabic, or emoji characters will be stripped entirely, potentially producing an empty filename like `trackly--2026-03-18.pdf`.

**Suggested fix:** Use a more permissive approach, e.g., replace only filesystem-unsafe characters (`/\\:*?"<>|`).

---

### M7. CSV export doesn't add BOM for Excel compatibility

**File:** `src/pages/HomePage.tsx:53-54`
**Description:** The CSV blob doesn't include a UTF-8 BOM (`\uFEFF`). When German users open the CSV in Excel, umlauts (ä, ö, ü) and special characters may display incorrectly because Excel defaults to ANSI encoding.

**Suggested fix:** Prepend `"\uFEFF"` to the CSV string before creating the Blob.

---

### M8. `formatCount` uses `toLocaleString()` inconsistently

**File:** `src/lib/utils.ts:36-38`
**Description:** `formatCount` uses `n.toLocaleString()` which produces locale-dependent output (e.g., "1,000" in English, "1.000" in German). But this formatted string is then used in ranking comparisons and CSV exports where locale-specific formatting could cause issues.

---

### M9. `jump_rope` discipline has mismatched mode/unit

**File:** `src/lib/constants.ts:53`
**Description:** `jump_rope` has `mode: "distance"` but `unit: "count"`. The "distance" mode in SessionPage shows a numeric input with the discipline's unit. `formatValue` with `unit: "count"` calls `formatCount()` which uses `toLocaleString()`. This works but is semantically confusing — "distance" mode with "count" unit doesn't match the mental model.

---

### M10. Unused translation keys: `favorites`, `addFavorite`, `removeFavorite`

**File:** `src/lib/i18n.ts:141-143` (interface), lines 404-406 (de), lines 667-669 (en)
**Description:** These three translation keys are defined in the interface and both language objects but are never used anywhere in the codebase. Likely leftover from a removed or unimplemented feature.

---

### M11. `Toaster` component has no theme prop

**File:** `src/App.tsx:19`
**Description:** `<Toaster />` from Sonner is rendered without a `theme` prop. Toast notifications may not respect the dark/light mode toggle, showing light toasts on a dark background or vice versa.

**Suggested fix:** Pass `theme={isDark ? "dark" : "light"}` or use the `<Toaster theme="system" />` prop.

---

### M12. AudioContext created on every beep without reuse

**File:** `src/pages/RacePage.tsx:36-49`
**Description:** Each call to `playBeep()` creates a new `AudioContext`, plays a tone, then closes it. During a 10-second countdown (10 ticks), this creates 10+ AudioContext instances. Some browsers limit concurrent AudioContexts and may throw warnings or errors.

**Suggested fix:** Create a single AudioContext at countdown start and reuse it for all beeps.

---

### M13. Manifest has duplicate definitions (static + Vite plugin)

**File:** `public/manifest.json` + `vite.config.ts:14-36`
**Description:** The PWA manifest is defined both as a static file in `public/manifest.json` AND inline in the Vite PWA plugin config. The Vite plugin generates its own `manifest.webmanifest` in the build output, which may conflict with or shadow the static `manifest.json`. The static file references absolute paths (`/icons/...`) while the Vite plugin uses relative paths.

**Suggested fix:** Remove `public/manifest.json` and rely solely on the Vite plugin's manifest generation, or vice versa.

---

*End of report. No changes were made to the codebase.*
