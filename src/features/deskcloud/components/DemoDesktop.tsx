"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { en } from "../content/en";
import type { Rect, Size } from "../engine/types";
import { MAX_ICONS, initialIcons, newFileIcon } from "../icons";
import {
  ICON_SIZE,
  fitIntoGrid,
  firstFreeSlot,
  iconPosition,
  iconRect,
  initialSlots,
  nearestFreeSlot,
  slotGrid,
  stepSlot,
  type Direction,
  type SlotGrid,
} from "../slots";
import { DEMO_FRAME_CLASS, TASKBAR_CLASS, TASKBAR_HEIGHT } from "./demoFrame";
import { DeskcloudCanvas } from "./DeskcloudCanvas";
import { DemoToolbar } from "./DemoToolbar";
import { IconLayer, type Drag, type PlacedIcon } from "./IconLayer";

const t = en.demo;

/** The starting icons for this desktop width (fewer on small screens), laid out column by column */
function initialLayout(width: number, grid: SlotGrid): PlacedIcon[] {
  const set = initialIcons(width);
  const slots = fitIntoGrid(grid, initialSlots(set.length, grid));
  return set.map((icon, i) => ({ ...icon, slot: slots[i] }));
}

function refit(icons: PlacedIcon[], grid: SlotGrid): PlacedIcon[] {
  const slots = fitIntoGrid(
    grid,
    icons.map((i) => i.slot),
  );
  return icons.map((icon, i) => ({ ...icon, slot: slots[i] }));
}

/** The live demo: sky canvas, draggable icons and a taskbar. Icon positions are kept in slot units. */
export function DemoDesktop() {
  const router = useRouter();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [icons, setIcons] = useState<PlacedIcon[] | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [wiggles, setWiggles] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");

  const nextFileNumber = useRef(1);
  const activeDrag = useRef<string | null>(null);
  const pendingDrag = useRef<Drag | null>(null);
  const dragFrame = useRef(0);

  const grid = useMemo(() => (size ? slotGrid(size.width, size.height) : null), [size]);

  // Measure before paint so the icons appear in place on the first frame
  useLayoutEffect(() => {
    const el = desktopRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = slotGrid(width, height);
      setSize({ width, height });
      setIcons((prev) => (prev ? refit(prev, next) : initialLayout(width, next)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(dragFrame.current), []);

  // Obstacles for the clouds: every icon's box, following the pointer during a drag
  const obstacles = useMemo(
    () => (icons ?? []).map((icon) => iconRect(drag?.id === icon.id ? drag : iconPosition(icon.slot))),
    [icons, drag],
  );

  if (!icons || !grid || !size) {
    return <Shell desktopRef={desktopRef} obstacles={obstacles} announcement={announcement} />;
  }

  const occupiedExcept = (id: string) => icons.filter((i) => i.id !== id).map((i) => i.slot);
  const canAddFile = icons.length < MAX_ICONS && firstFreeSlot(grid, icons.map((i) => i.slot)) !== null;

  const handlers = {
    onDragStart(id: string) {
      if (activeDrag.current) return false;
      activeDrag.current = id;
      return true;
    },

    onDragMove(id: string, x: number, y: number) {
      if (activeDrag.current !== id) return;
      // Keep the whole icon on the desktop
      pendingDrag.current = {
        id,
        x: Math.min(Math.max(x, 0), Math.max(size.width - ICON_SIZE.width, 0)),
        y: Math.min(Math.max(y, 0), Math.max(size.height - ICON_SIZE.height, 0)),
      };
      // At most one state update (and one obstacle update for the clouds) per frame
      if (!dragFrame.current) {
        dragFrame.current = requestAnimationFrame(() => {
          dragFrame.current = 0;
          setDrag(pendingDrag.current);
        });
      }
    },

    onDragEnd(id: string) {
      if (activeDrag.current !== id) return;
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = 0;
      const last = pendingDrag.current ?? drag;
      activeDrag.current = null;
      pendingDrag.current = null;
      setDrag(null);

      const icon = icons.find((i) => i.id === id);
      if (!icon || !last) return;
      // Snap to the nearest free slot to the icon's centre (its own old slot counts as free)
      const centre = { x: last.x + ICON_SIZE.width / 2, y: last.y + ICON_SIZE.height / 2 };
      const slot = nearestFreeSlot(grid, centre, occupiedExcept(id)) ?? icon.slot;
      setIcons(icons.map((i) => (i.id === id ? { ...i, slot } : i)));
      setAnnouncement(t.announce.moved(icon.label, slot.col + 1, slot.row + 1));
    },

    onOpen(id: string) {
      const icon = icons.find((i) => i.id === id);
      if (!icon) return;
      const { action } = icon;
      if (action.type === "external") {
        setAnnouncement(t.announce.opening(icon.label));
        window.open(action.href, "_blank", "noopener,noreferrer");
      } else if (action.type === "internal") {
        setAnnouncement(t.announce.opening(icon.label));
        router.push(action.href);
      } else {
        setWiggles((w) => ({ ...w, [id]: (w[id] ?? 0) + 1 }));
        setAnnouncement(t.announce.decorative(icon.label));
      }
    },

    onMove(id: string, direction: Direction) {
      if (activeDrag.current) return;
      const icon = icons.find((i) => i.id === id);
      if (!icon) return;
      const slot = stepSlot(grid, icon.slot, direction, occupiedExcept(id));
      if (!slot) {
        setAnnouncement(t.announce.cantMove(icon.label));
        return;
      }
      setIcons(icons.map((i) => (i.id === id ? { ...i, slot } : i)));
      setAnnouncement(t.announce.moved(icon.label, slot.col + 1, slot.row + 1));
    },
  };

  const addFile = () => {
    const slot = icons.length < MAX_ICONS ? firstFreeSlot(grid, icons.map((i) => i.slot)) : null;
    if (!slot) {
      setAnnouncement(t.announce.full);
      return;
    }
    const icon = { ...newFileIcon(nextFileNumber.current++), slot };
    setIcons([...icons, icon]);
    setAnnouncement(t.announce.added(icon.label));
  };

  const reset = () => {
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    activeDrag.current = null;
    pendingDrag.current = null;
    nextFileNumber.current = 1;
    setDrag(null);
    setWiggles({});
    setIcons(initialLayout(size.width, grid));
    setAnnouncement(t.announce.reset);
  };

  return (
    <Shell
      desktopRef={desktopRef}
      obstacles={obstacles}
      announcement={announcement}
      icons={<IconLayer icons={icons} drag={drag} wiggles={wiggles} {...handlers} />}
      toolbar={<DemoToolbar canAddFile={canAddFile} onNewFile={addFile} onReset={reset} className="h-full" />}
    />
  );
}

type ShellProps = {
  desktopRef: React.RefObject<HTMLDivElement | null>;
  obstacles: readonly Rect[];
  announcement: string;
  icons?: React.ReactNode;
  toolbar?: React.ReactNode;
};

/**
 * Canvas behind, the desktop area (everything above the taskbar) on top, and a status line for
 * screen readers. Both render paths use this same tree, so the canvas and engine survive the
 * first measurement.
 */
function Shell({ desktopRef, obstacles, announcement, icons, toolbar }: ShellProps) {
  return (
    <div className={DEMO_FRAME_CLASS}>
      <DeskcloudCanvas obstacles={obstacles} className="absolute inset-0 block h-full w-full" />
      <div
        ref={desktopRef}
        role="group"
        aria-label={t.desktopLabel}
        className="absolute inset-x-0 top-0"
        style={{ bottom: TASKBAR_HEIGHT }}
      >
        {icons}
      </div>
      <div style={{ height: TASKBAR_HEIGHT }} className={TASKBAR_CLASS}>
        {toolbar}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
