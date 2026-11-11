// Desktop slot grid for the demo icons. Pure functions; positions are in CSS px
// relative to the desktop's top-left corner.

import type { Rect, Vec2 } from "./engine/types";

/** One grid cell on the desktop, like a Windows icon slot */
export const SLOT = { width: 88, height: 96 } as const;
/** The icon's box, centred inside its slot */
export const ICON_SIZE = { width: 80, height: 88 } as const;
/** Space between the desktop edges and the slot grid */
export const DESKTOP_INSET = 8;

export type Slot = { col: number; row: number };
export type SlotGrid = { cols: number; rows: number };
export type Direction = "up" | "down" | "left" | "right";

const STEP: Record<Direction, Slot> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

/** How many whole slots fit in a desktop of this size */
export function slotGrid(width: number, height: number): SlotGrid {
  return {
    cols: Math.max(0, Math.floor((width - 2 * DESKTOP_INSET) / SLOT.width)),
    rows: Math.max(0, Math.floor((height - 2 * DESKTOP_INSET) / SLOT.height)),
  };
}

/** Top-left of the icon box when it sits in this slot */
export function iconPosition(slot: Slot): Vec2 {
  return {
    x: DESKTOP_INSET + slot.col * SLOT.width + (SLOT.width - ICON_SIZE.width) / 2,
    y: DESKTOP_INSET + slot.row * SLOT.height + (SLOT.height - ICON_SIZE.height) / 2,
  };
}

export function slotCentre(slot: Slot): Vec2 {
  return {
    x: DESKTOP_INSET + (slot.col + 0.5) * SLOT.width,
    y: DESKTOP_INSET + (slot.row + 0.5) * SLOT.height,
  };
}

/** The icon's bounds when its top-left is at (x, y) */
export function iconRect({ x, y }: Vec2): Rect {
  return { x, y, width: ICON_SIZE.width, height: ICON_SIZE.height };
}

export const sameSlot = (a: Slot, b: Slot) => a.col === b.col && a.row === b.row;

const inGrid = (grid: SlotGrid, s: Slot) => s.col >= 0 && s.row >= 0 && s.col < grid.cols && s.row < grid.rows;

const isFree = (s: Slot, occupied: readonly Slot[]) => !occupied.some((o) => sameSlot(o, s));

/** Column-major order from the top-left: down the first column, then the next */
export function initialSlots(count: number, grid: SlotGrid): Slot[] {
  const rows = Math.max(1, grid.rows);
  return Array.from({ length: count }, (_, i) => ({ col: Math.floor(i / rows), row: i % rows }));
}

export function firstFreeSlot(grid: SlotGrid, occupied: readonly Slot[]): Slot | null {
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      if (isFree({ col, row }, occupied)) return { col, row };
    }
  }
  return null;
}

/** The free slot whose centre is closest to a point (ties go to the first in column-major order) */
export function nearestFreeSlot(grid: SlotGrid, point: Vec2, occupied: readonly Slot[]): Slot | null {
  let best: Slot | null = null;
  let bestDistance = Infinity;
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      const slot = { col, row };
      if (!isFree(slot, occupied)) continue;
      const c = slotCentre(slot);
      const d = (c.x - point.x) ** 2 + (c.y - point.y) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = slot;
      }
    }
  }
  return best;
}

/** One slot in a direction, skipping taken slots; null if the way out is the edge of the grid */
export function stepSlot(grid: SlotGrid, from: Slot, direction: Direction, occupied: readonly Slot[]): Slot | null {
  const { col: dc, row: dr } = STEP[direction];
  let next = { col: from.col + dc, row: from.row + dr };
  while (inGrid(grid, next)) {
    if (isFree(next, occupied)) return next;
    next = { col: next.col + dc, row: next.row + dr };
  }
  return null;
}

/**
 * After a resize: slots that still fit stay put; the rest move to the nearest free
 * slot to where they'd be clamped. If the grid is full, they're clamped (and may overlap).
 */
export function fitIntoGrid(grid: SlotGrid, slots: readonly Slot[]): Slot[] {
  const result: (Slot | null)[] = slots.map(() => null);
  const taken: Slot[] = [];

  slots.forEach((slot, i) => {
    if (inGrid(grid, slot) && isFree(slot, taken)) {
      result[i] = slot;
      taken.push(slot);
    }
  });

  slots.forEach((slot, i) => {
    if (result[i]) return;
    const clamped = {
      col: Math.min(Math.max(slot.col, 0), Math.max(grid.cols - 1, 0)),
      row: Math.min(Math.max(slot.row, 0), Math.max(grid.rows - 1, 0)),
    };
    const free = nearestFreeSlot(grid, slotCentre(clamped), taken);
    result[i] = free ?? clamped;
    if (free) taken.push(free);
  });

  return result as Slot[];
}
