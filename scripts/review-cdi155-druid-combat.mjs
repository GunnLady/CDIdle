// Deterministic neutral/combat contact sheets; never changes the source images.
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const root = "assets/design/hero-sprites/cdi-155";
const { entries } = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const cards = await Promise.all(entries.map(async (entry) => {
  const neutral = (await readFile(entry.neutral)).toString("base64");
  const combat = (await readFile(entry.runtime)).toString("base64");
  return `<article><header>${entry.key}</header><div><img src="data:image/png;base64,${neutral}"><img src="data:image/webp;base64,${combat}"></div></article>`;
}));
await mkdir(`${root}/review`, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1900 } });
  for (const [theme, background, color] of [["light", "#eee9df", "#20252d"], ["dark", "#20252d", "#eee9df"]]) {
    await page.setContent(`<style>body{margin:0;background:${background};color:${color};font:16px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr)}article{height:375px;border:1px solid #888;box-sizing:border-box}header{text-align:center;padding:8px}article div{display:flex;height:330px;align-items:end;justify-content:center}img{max-width:49%;max-height:100%;object-fit:contain}</style><main>${cards.join("")}</main>`);
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await page.locator("main").screenshot({ path: `${root}/review/neutral-combat-${theme}.png` });
  }
} finally {
  await browser.close();
}
