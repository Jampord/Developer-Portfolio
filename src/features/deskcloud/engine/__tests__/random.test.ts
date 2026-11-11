import { describe, expect, it } from "vitest";
import { mulberry32 } from "../random";

const take = (next: () => number, n: number) => Array.from({ length: n }, next);

describe("mulberry32", () => {
  it("gives the same sequence for the same seed", () => {
    expect(take(mulberry32(42), 20)).toEqual(take(mulberry32(42), 20));
  });

  it("gives a different sequence for a different seed", () => {
    expect(take(mulberry32(42), 20)).not.toEqual(take(mulberry32(43), 20));
  });

  it("returns numbers in [0, 1)", () => {
    for (const n of take(mulberry32(7), 1000)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
