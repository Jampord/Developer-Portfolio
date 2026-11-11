import { describe, expect, it } from "vitest";
import { COMPACT_BELOW, INITIAL_ICONS, initialIcons } from "../icons";

const ids = (width: number) => initialIcons(width).map((i) => i.id);

describe("initialIcons", () => {
  it("shows the full set on wider desktops", () => {
    expect(ids(1280)).toEqual(INITIAL_ICONS.map((i) => i.id));
    expect(ids(COMPACT_BELOW)).toHaveLength(7);
  });

  it("shows four icons on small screens: CV, GitHub, the case study and one decorative file", () => {
    expect(COMPACT_BELOW).toBe(640);
    expect(ids(COMPACT_BELOW - 1)).toEqual(["resume", "github", "case-study", "notes"]);
    expect(ids(360)).toHaveLength(4);
  });
});
