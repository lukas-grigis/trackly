import { test, expect } from "@playwright/test";
import { seedStore, TEST_ATHLETES } from "../helpers";

const SESSION_WITH_HEATS = {
  id: "session-1",
  name: "LB Session",
  date: "2026-03-15",
  athleteIds: ["athlete-1", "athlete-2"],
  heats: [{
    id: "heat-1", sessionId: "session-1", disciplineType: "sprint_60",
    participantIds: ["athlete-1", "athlete-2"],
    startedAt: "2026-03-15T10:00:00Z",
    results: [
      { athleteId: "athlete-1", value: 8500, unit: "ms", recordedAt: "2026-03-15T10:00:08.500Z" },
      { athleteId: "athlete-2", value: 9200, unit: "ms", recordedAt: "2026-03-15T10:00:09.200Z" },
    ],
  }],
};

test.describe("Leaderboard", () => {
  test.beforeEach(async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [SESSION_WITH_HEATS] });
    await page.goto("/#/session/session-1/leaderboard");
  });

  test("shows discipline section with athletes ranked", async ({ page }) => {
    await expect(page.getByText(/60M SPRINT/i)).toBeVisible();
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
  });

  test("TV mode button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /TV/i })).toBeVisible();
  });
});
