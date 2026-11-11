"use client";

import type { DesktopIconData } from "../icons";
import { iconPosition, type Slot } from "../slots";
import { DesktopIcon, type DesktopIconHandlers } from "./DesktopIcon";

export type PlacedIcon = DesktopIconData & { slot: Slot };

/** The icon being dragged and where its top-left currently is */
export type Drag = { id: string; x: number; y: number };

type Props = DesktopIconHandlers & {
  icons: readonly PlacedIcon[];
  drag: Drag | null;
  wiggles: Readonly<Record<string, number>>;
};

export function IconLayer({ icons, drag, wiggles, ...handlers }: Props) {
  return icons.map((icon) => {
    const dragging = drag?.id === icon.id;
    const { x, y } = dragging ? drag : iconPosition(icon.slot);
    return (
      <DesktopIcon
        key={icon.id}
        icon={icon}
        x={x}
        y={y}
        dragging={dragging}
        wiggle={wiggles[icon.id] ?? 0}
        {...handlers}
      />
    );
  });
}
