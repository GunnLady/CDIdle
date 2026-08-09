import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "mobile", width: 360, height: 800 },
  { name: "desktop", width: 1440, height: 1000 },
] as const) {
  test(`keeps the UI catalog within the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/?ui-catalog=1");
    await expect(page.getByTestId("ui-catalog-root")).toBeVisible();

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - window.innerWidth,
      offenders: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.right > window.innerWidth + 1 || box.left < -1;
        })
        .slice(0, 10)
        .map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${[...element.classList].join(".")}`),
    }));

    expect(overflow.document, overflow.offenders.join("\n")).toBeLessThanOrEqual(0);
    expect(overflow.offenders).toEqual([]);
  });
}
