import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("UI semantic tokens", () => {
  const tokensSource = readFile(join(process.cwd(), "src/ui/foundations/tokens.css"), "utf8");
  const tokenValue = async (name: string) => {
    const source = await tokensSource;
    const value = source.match(new RegExp(`--${name}:\\s*(#[a-f\\d]{6})`, "i"))?.[1];
    expect(value, `missing token --${name}`).toBeDefined();
    return value!;
  };

  it.each([
    ["color-ui-text", "color-ui-canvas"],
    ["color-ui-text-muted", "color-ui-panel"],
    ["color-ui-accent", "color-ui-canvas"],
    ["color-ui-focus", "color-ui-panel-strong"],
    ["color-ui-info-text", "color-ui-info-surface"],
    ["color-ui-success-text", "color-ui-success-surface"],
    ["color-ui-warning-text", "color-ui-warning-surface"],
    ["color-ui-danger-text", "color-ui-danger-surface"],
    ["color-ui-observer-text", "color-ui-observer-surface"],
    ["color-ui-locked-text", "color-ui-locked-surface"],
  ])("keeps %s on %s at WCAG AA contrast", async (foregroundName, backgroundName) => {
    const foreground = await tokenValue(foregroundName);
    const background = await tokenValue(backgroundName);
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("defines a reduced-motion override", async () => {
    const source = await tokensSource;
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain("--ui-motion-fast: 1ms");
  });
});
