import { test, expect } from "@playwright/test";
import { seedStore, TEST_ATHLETES } from "../helpers";

const SESSION_WITH_HEATS = {
  id: "session-1",
  name: "TV Session",
  date: "2026-03-15",
  athleteIds: ["athlete-1", "athlete-2", "athlete-3"],
  heats: [
    {
      id: "heat-1", sessionId: "session-1", disciplineType: "sprint_60",
      participantIds: ["athlete-1", "athlete-2", "athlete-3"],
      startedAt: "2026-03-15T10:00:00Z",
      results: [
        { athleteId: "athlete-1", value: 8500, unit: "ms", recordedAt: "2026-03-15T10:00:08.500Z" },
        { athleteId: "athlete-2", value: 9200, unit: "ms", recordedAt: "2026-03-15T10:00:09.200Z" },
        { athleteId: "athlete-3", value: 8800, unit: "ms", recordedAt: "2026-03-15T10:00:08.800Z" },
      ],
    },
  ],
};

test.describe("TV mode", () => {
  test.beforeEach(async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [SESSION_WITH_HEATS] });
  });

  test("TV mode accessible via button on leaderboard", async ({ page }) => {
    await page.goto("/#/session/session-1/leaderboard");
    await page.getByRole("button", { name: /TV/i }).click();
    // TV mode should show the discipline and athlete names
    await expect(page.getByText(/60M SPRINT/i)).toBeVisible({ timeout: 5000 });
  });

  test("TV mode shows leaderboard content via query param", async ({ page }) => {
    await page.goto("/#/session/session-1/leaderboard?tv=1");
    await expect(page.getByText(/60M SPRINT/i)).toBeVisible({ timeout: 10000 });
  });
});
