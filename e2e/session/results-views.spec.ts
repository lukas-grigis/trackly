import { test, expect } from "@playwright/test";
import { seedStore, TEST_ATHLETES } from "../helpers";

const SESSION_WITH_HEATS = {
  id: "session-1",
  name: "Results Session",
  date: "2026-03-15",
  athleteIds: ["athlete-1", "athlete-2", "athlete-3"],
  heats: [{
    id: "heat-1", sessionId: "session-1", disciplineType: "sprint_60",
    participantIds: ["athlete-1", "athlete-2", "athlete-3"],
    startedAt: "2026-03-15T10:00:00Z",
    results: [
      { athleteId: "athlete-1", value: 8500, unit: "ms", recordedAt: "2026-03-15T10:00:08.500Z" },
      { athleteId: "athlete-2", value: 9200, unit: "ms", recordedAt: "2026-03-15T10:00:09.200Z" },
      { athleteId: "athlete-3", value: 8800, unit: "ms", recordedAt: "2026-03-15T10:00:08.800Z" },
    ],
  }],
};

test.describe("Results views", () => {
  test.beforeEach(async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [SESSION_WITH_HEATS] });
    await page.goto("/#/session/session-1");
  });

  test("leaderboard link navigates to leaderboard", async ({ page }) => {
    await page.getByRole("link", { name: /Leaderboard/i }).first().click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.getByText("Alice").first()).toBeVisible();
  });

  test("heats tab shows heat with participant count", async ({ page }) => {
    await page.getByText("Heats").click();
    await expect(page.getByText(/Heat 1/i)).toBeVisible();
  });
});
