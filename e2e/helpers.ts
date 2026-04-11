import { type Page } from "@playwright/test";

export const TEST_ATHLETES = [
  { id: "athlete-1", name: "Alice", yearOfBirth: 2015, gender: "female" as const },
  { id: "athlete-2", name: "Bob", yearOfBirth: 2014, gender: "male" as const },
  { id: "athlete-3", name: "Charlie", yearOfBirth: 2013, gender: "male" as const },
];

export const TEST_SESSION = {
  id: "session-1",
  name: "Spring Meet 2026",
  date: "2026-03-15",
  athleteIds: ["athlete-1", "athlete-2", "athlete-3"],
  heats: [],
};

export async function seedStore(
  page: Page,
  data: { athletes?: Array<Record<string, unknown>>; sessions?: Array<Record<string, unknown>> },
) {
  const state = {
    athletes: data.athletes ?? [],
    sessions: data.sessions ?? [],
  };
  await page.addInitScript((storeState) => {
    localStorage.clear();
    localStorage.setItem("trackly-lang", JSON.stringify({ state: { lang: "en" }, version: 0 }));
    localStorage.setItem("trackly-storage", JSON.stringify({ state: storeState, version: 0 }));
  }, state);
}

export async function resetApp(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("trackly-lang", JSON.stringify({ state: { lang: "en" }, version: 0 }));
  });
}

export async function seedStandard(page: Page) {
  await seedStore(page, { athletes: TEST_ATHLETES, sessions: [TEST_SESSION] });
}
