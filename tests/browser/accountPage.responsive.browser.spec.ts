import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "compact", width: 1024, height: 900 },
  { name: "desktop boundary", width: 1280, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps Account usable at ${viewport.name} ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/account-harness.html");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const identity = page.getByTestId("account-identity-panel");
    const sync = page.getByTestId("account-sync-panel");
    const summary = page.getByTestId("realm-summary-panel");
    const history = page.getByTestId("system-history-panel");
    const danger = page.getByTestId("account-danger-zone");
    const [identityBox, syncBox, summaryBox, historyBox, dangerBox] = await Promise.all([identity, sync, summary, history, danger].map((panel) => panel.boundingBox()));
    [identityBox, syncBox, summaryBox, historyBox, dangerBox].forEach((box) => expect(box).not.toBeNull());
    expect(identityBox!.y).toBeLessThan(syncBox!.y);
    if (viewport.width >= 1280) {
      expect(identityBox!.x).toBeLessThan(summaryBox!.x);
      expect(Math.abs(identityBox!.y - summaryBox!.y)).toBeLessThanOrEqual(2);
      const syncBottom = syncBox!.y + syncBox!.height;
      const summaryBottom = summaryBox!.y + summaryBox!.height;
      expect(Math.abs(syncBottom - summaryBottom)).toBeLessThanOrEqual(48);
    } else {
      expect(syncBox!.y).toBeLessThan(summaryBox!.y);
    }
    expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(historyBox!.y + 1);
    expect(historyBox!.y).toBeLessThan(dangerBox!.y);

    await danger.getByRole("button", { name: /Réinitialiser totalement/i }).click();
    await expect(danger.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByTestId("mutation-count")).toHaveText("0");
    await danger.getByRole("button", { name: "Annuler" }).click();
    await expect(danger.getByRole("alertdialog")).toHaveCount(0);
  });
}

test("locks every Account mutation while a canonical command is pending", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/account-harness.html?pending=1");
  await expect(page.getByRole("button", { name: /Fermer la session/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Actualisation serveur/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Réinitialiser totalement/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Supprimer définitivement/i })).toBeDisabled();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});
