import { describe, expect, it } from "vitest";
import {
  DESKTOP_INSET,
  ICON_SIZE,
  SLOT,
  firstFreeSlot,
  fitIntoGrid,
  iconPosition,
  initialSlots,
  nearestFreeSlot,
  slotCentre,
  slotGrid,
  stepSlot,
  type Slot,
} from "../slots";

const grid = { cols: 4, rows: 3 };
const s = (col: number, row: number): Slot => ({ col, row });

describe("slotGrid", () => {
  it("fits whole slots inside the inset", () => {
    const width = DESKTOP_INSET * 2 + SLOT.width * 4;
    const height = DESKTOP_INSET * 2 + SLOT.height * 6;
    expect(slotGrid(width, height)).toEqual({ cols: 4, rows: 6 });
    expect(slotGrid(width - 1, height - 1)).toEqual({ cols: 3, rows: 5 });
  });

  it("never goes negative on a tiny desktop", () => {
    expect(slotGrid(0, 0)).toEqual({ cols: 0, rows: 0 });
  });
});

describe("iconPosition", () => {
  it("centres the icon in its slot", () => {
    const p = iconPosition(s(1, 2));
    expect(p.x).toBe(DESKTOP_INSET + SLOT.width + (SLOT.width - ICON_SIZE.width) / 2);
    expect(p.y).toBe(DESKTOP_INSET + 2 * SLOT.height + (SLOT.height - ICON_SIZE.height) / 2);
  });
});

describe("initialSlots", () => {
  it("fills column by column from the top-left, like Windows", () => {
    expect(initialSlots(5, grid)).toEqual([s(0, 0), s(0, 1), s(0, 2), s(1, 0), s(1, 1)]);
  });
});

describe("firstFreeSlot", () => {
  it("returns the first free slot in column-major order", () => {
    expect(firstFreeSlot(grid, [s(0, 0), s(0, 1)])).toEqual(s(0, 2));
    expect(firstFreeSlot(grid, [s(0, 0), s(0, 1), s(0, 2)])).toEqual(s(1, 0));
  });

  it("returns null when every slot is taken", () => {
    const all = initialSlots(12, grid);
    expect(firstFreeSlot(grid, all)).toBeNull();
  });
});

describe("nearestFreeSlot", () => {
  it("picks the slot under the point when it's free", () => {
    const c = slotCentre(s(2, 1));
    expect(nearestFreeSlot(grid, c, [])).toEqual(s(2, 1));
  });

  it("picks the closest free neighbour when that slot is taken", () => {
    // Just right of (2, 1)'s centre, so (3, 1) is the closest other slot
    const c = slotCentre(s(2, 1));
    expect(nearestFreeSlot(grid, { x: c.x + 10, y: c.y }, [s(2, 1)])).toEqual(s(3, 1));
  });

  it("snaps points outside the grid to the nearest edge slot", () => {
    expect(nearestFreeSlot(grid, { x: -500, y: -500 }, [])).toEqual(s(0, 0));
    expect(nearestFreeSlot(grid, { x: 5000, y: 5000 }, [])).toEqual(s(3, 2));
  });

  it("returns null when every slot is taken", () => {
    expect(nearestFreeSlot(grid, { x: 0, y: 0 }, initialSlots(12, grid))).toBeNull();
  });
});

describe("stepSlot", () => {
  it("moves one slot in each direction", () => {
    expect(stepSlot(grid, s(1, 1), "right", [])).toEqual(s(2, 1));
    expect(stepSlot(grid, s(1, 1), "left", [])).toEqual(s(0, 1));
    expect(stepSlot(grid, s(1, 1), "up", [])).toEqual(s(1, 0));
    expect(stepSlot(grid, s(1, 1), "down", [])).toEqual(s(1, 2));
  });

  it("skips over taken slots", () => {
    expect(stepSlot(grid, s(0, 0), "right", [s(1, 0), s(2, 0)])).toEqual(s(3, 0));
  });

  it("stays put at the edge of the grid", () => {
    expect(stepSlot(grid, s(0, 0), "left", [])).toBeNull();
    expect(stepSlot(grid, s(3, 2), "down", [])).toBeNull();
  });

  it("stays put when every slot that way is taken", () => {
    expect(stepSlot(grid, s(0, 0), "right", [s(1, 0), s(2, 0), s(3, 0)])).toBeNull();
  });
});

describe("fitIntoGrid", () => {
  it("leaves slots that still fit where they are", () => {
    const slots = [s(0, 0), s(3, 2), s(1, 1)];
    expect(fitIntoGrid(grid, slots)).toEqual(slots);
  });

  it("moves slots outside a smaller grid to the nearest free slot inside it", () => {
    const fitted = fitIntoGrid(grid, [s(0, 0), s(6, 1), s(3, 1)]);
    expect(fitted[0]).toEqual(s(0, 0));
    expect(fitted[2]).toEqual(s(3, 1)); // already fitted, so it keeps its slot
    // Clamped to (3, 1), which is taken; (2, 1) is one column (88 px) away, nearer than a row (96 px)
    expect(fitted[1]).toEqual(s(2, 1));
  });

  it("never puts two icons in the same slot", () => {
    const fitted = fitIntoGrid(grid, [s(5, 5), s(6, 6), s(9, 9), s(3, 2)]);
    const keys = new Set(fitted.map((x) => `${x.col},${x.row}`));
    expect(keys.size).toBe(4);
    for (const x of fitted) {
      expect(x.col).toBeLessThan(grid.cols);
      expect(x.row).toBeLessThan(grid.rows);
    }
  });

  it("clamps into the grid when there's no free slot left", () => {
    const tiny = { cols: 1, rows: 1 };
    expect(fitIntoGrid(tiny, [s(0, 0), s(2, 2)])).toEqual([s(0, 0), s(0, 0)]);
  });
});
