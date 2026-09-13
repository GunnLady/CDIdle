import { expect, test, type Page } from "@playwright/test";

const challengeKinds = [
  "trap",
  "enigma",
  "ambush",
  "ritual",
  "obstacle",
  "negotiation",
] as const;

const challengeLabels = {
  trap: "Piège",
  enigma: "Énigme",
  ambush: "Embuscade",
  ritual: "Rituel",
  obstacle: "Obstacle",
  negotiation: "Négociation",
} as const;

async function openChallenge(
  page: Page,
  kind: typeof challengeKinds[number],
  outcome: "victory" | "defeat",
  animations = false,
) {
  const step = outcome === "victory" ? 6 : 5;
  await page.goto(
    `/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&integrated=1&challenge=${kind}&outcome=${outcome}&step=${step}${animations ? "" : "&animations=0"}`,
  );
  const scene = page.getByTestId("dungeon-combat-scene");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("data-encounter-kind", kind);
  await expect(scene.getByTestId("dungeon-combat-actor")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Explorer la salle" })).toBeVisible();
  return scene;
}

test("stages all six successful challenges with distinct props and animations", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const animationNames = new Set<string>();

  for (const kind of challengeKinds) {
    const scene = await openChallenge(page, kind, "victory", true);
    const accessory = scene.getByTestId("dungeon-non-combat-accessory");
    const selected = scene.locator("[data-testid='dungeon-combat-actor'][data-active='true']");
    await expect(accessory).toHaveAttribute("data-visual-key", `encounter:challenge:${kind}`);
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAccessibleName(/Céleste/);
    await expect(scene.getByRole("list", { name: challengeLabels[kind] })).toBeVisible();
    await expect(scene.getByText("Épreuve réussie")).toBeVisible();
    animationNames.add(await accessory.evaluate((element) => getComputedStyle(element).animationName));
  }

  expect(animationNames.size).toBe(challengeKinds.length);
});

test("shows exact failed consequences without presenting a party wipe", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const kind of challengeKinds) {
    const scene = await openChallenge(page, kind, "defeat");
    await expect(scene).toHaveAttribute("data-encounter-outcome", "defeat");
    await expect(scene.getByText("Épreuve échouée · progression maintenue")).toBeVisible();
    await expect(scene.getByTestId("dungeon-combat-result")).toHaveCount(0);

    const effects = scene.getByTestId("dungeon-combat-effect");
    if (kind === "trap" || kind === "ambush" || kind === "obstacle") {
      await expect(effects).toHaveCount(4);
      await expect(effects).toHaveText(["−3", "−3", "−3", "−3"]);
    } else if (kind === "enigma" || kind === "ritual") {
      await expect(effects).toHaveCount(1);
      await expect(effects).toHaveText("PM −2 · 17/20");
    } else {
      await expect(effects).toHaveCount(0);
      await expect(scene.getByText("Or −7")).toBeVisible();
    }
  }
});

test("keeps the challenge outcome readable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  const scene = await openChallenge(page, "ritual", "victory", true);
  const accessory = scene.getByTestId("dungeon-non-combat-accessory");
  const summary = scene.getByTestId("dungeon-non-combat-summary-item").first();

  await expect(accessory).toHaveCSS("animation-name", "none");
  await expect(summary).toHaveCSS("animation-name", "none");
  await expect(summary).toBeVisible();
});

test("keeps every challenge keyboard-focusable and loads one background plus its own prop", async ({ browser }) => {
  for (const kind of challengeKinds) {
    const page = await browser.newPage();
    const imageRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "image") imageRequests.push(request.url());
    });

    const scene = await openChallenge(page, kind, "victory");
    const accessoryImage = scene.getByTestId("dungeon-non-combat-accessory").locator("img");
    await expect(accessoryImage).toBeVisible();
    await scene.focus();
    await expect(scene).toBeFocused();
    expect(imageRequests.filter((url) => url.includes("rest-chamber-background-v1.jpg"))).toHaveLength(1);
    expect(imageRequests.filter((url) => url.includes(`challenge-${kind}-v1.png`))).toHaveLength(1);
    expect(imageRequests.filter((url) => url.includes("/challenge-") && !url.includes(`challenge-${kind}-v1.png`))).toHaveLength(0);
    await page.close();
  }
});
