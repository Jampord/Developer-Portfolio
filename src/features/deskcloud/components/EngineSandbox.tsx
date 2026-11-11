"use client";

// TEMPORARY (PR 2): fixed boxes standing in for desktop icons until the real icons land in PR 3

import { useMemo, useState } from "react";
import type { Rect } from "../engine/types";
import { DeskcloudCanvas } from "./DeskcloudCanvas";

const ICON = { width: 72, height: 80 };

// A Windows-style column down the left, like real desktop icons
const COLUMN: Rect[] = [0, 1, 2, 3].map((i) => ({ x: 16, y: 16 + i * 96, ...ICON }));

// Spots the loose box cycles through (all within a 360 px wide phone)
const SPOTS = [
  { x: 240, y: 200 },
  { x: 150, y: 330 },
  { x: 260, y: 60 },
];

export function EngineSandbox() {
  const [spot, setSpot] = useState(0);
  const obstacles = useMemo(() => [...COLUMN, { ...SPOTS[spot], ...ICON }], [spot]);

  return (
    <div className="relative h-[85svh] min-h-[560px] w-full overflow-hidden">
      <DeskcloudCanvas obstacles={obstacles} className="absolute inset-0 block h-full w-full" />
      {obstacles.map((r, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="absolute rounded-xl border-2 border-dashed border-white/80 transition-[left,top] duration-300"
          style={{ left: r.x, top: r.y, width: r.width, height: r.height }}
        />
      ))}
      <button
        type="button"
        onClick={() => setSpot((s) => (s + 1) % SPOTS.length)}
        className="absolute bottom-4 right-4 rounded-full bg-background/90 px-4 py-2 font-mono text-sm text-foreground shadow"
      >
        Move the loose box
      </button>
    </div>
  );
}
