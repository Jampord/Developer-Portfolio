import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { duration, ms, pressScale, stagger } from "../motion";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** The value of a custom property in globals.css, e.g. "150ms" */
const token = (name: string) => {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`${name} is not defined in globals.css`);
  return match[1].trim();
};

describe("motion tokens", () => {
  it.each(Object.entries(duration))("duration.%s matches its CSS token", (name, seconds) => {
    expect(token(`--duration-${name}`)).toBe(`${ms(seconds)}ms`);
  });

  it("stagger matches its CSS token", () => {
    expect(token("--stagger")).toBe(`${ms(stagger)}ms`);
  });

  it("press scale matches its CSS token", () => {
    expect(Number(token("--press-scale"))).toBe(pressScale);
  });

  it("keeps every UI duration at or under 300ms", () => {
    expect(Math.max(...Object.values(duration))).toBeLessThanOrEqual(0.3);
  });

  it("staggers items 40 to 60ms apart", () => {
    expect(stagger).toBeGreaterThanOrEqual(0.04);
    expect(stagger).toBeLessThanOrEqual(0.06);
  });

  it("leaves no hand-written curve outside the token block", () => {
    const outsideTokens = css.replace(/--ease-[\w-]+:\s*cubic-bezier\([^)]*\)/g, "");
    expect(outsideTokens).not.toMatch(/cubic-bezier|\blinear\b/);
  });
});
