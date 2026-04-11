import { test, expect } from "@playwright/test";
import { seedStore, TEST_ATHLETES } from "../helpers";

const SESSION_WITH_RESULTS = {
  id: "session-1", name: "PDF Session", date: "2026-03-15",
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

test.describe("PDF export", () => {
  test("PDF download triggers with correct filename", async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [SESSION_WITH_RESULTS] });
    await page.goto("/#/sessions");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /^PDF$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
