import type { CSSProperties } from "react";
import { HERO_SKY_CLASS } from "@/lib/hero-sky";

/**
 * One puff of the bank: where its centre sits and how big it is (all as percentages of the sky's
 * box), and a small head start or lag in ms, so the bank breaks up unevenly instead of opening
 * like a curtain.
 */
type Puff = { x: number; y: number; w: number; h: number; lag: number };

const PUFFS: Puff[] = [
  { x: 8, y: 16, w: 60, h: 64, lag: 0 },
  { x: 50, y: 8, w: 66, h: 58, lag: 60 },
  { x: 92, y: 18, w: 60, h: 66, lag: 20 },
  { x: 2, y: 56, w: 54, h: 72, lag: 90 },
  { x: 50, y: 50, w: 78, h: 82, lag: 130 },
  { x: 98, y: 54, w: 54, h: 72, lag: 50 },
  { x: 14, y: 92, w: 62, h: 60, lag: 30 },
  { x: 54, y: 96, w: 68, h: 56, lag: 100 },
  { x: 90, y: 90, w: 60, h: 62, lag: 10 },
];

/** How far a puff starts toward the middle of the view, as a share of the way there */
const GATHER = 0.82;
/** How far past its place it flies as it goes by, as a share of its distance from the middle */
const PASS = 1.15;

/**
 * Flying forward, everything ahead of you starts near the middle of the view and spreads outward
 * as it gets close. So each puff has two offsets along the line from the middle of the box
 * through its own place: one back toward the middle (where it is first seen, small and far off)
 * and one further out (where it goes as it passes you). CSS translates in percentages of the
 * puff's own size, hence the division.
 */
function flightPath({ x, y, w, h, lag }: Puff): CSSProperties {
  const dx = x - 50;
  const dy = y - 50;
  // The middle puff has no direction of its own; it drifts down a little so it still moves
  const out = dx === 0 && dy === 0 ? { x: 0, y: 14 } : { x: dx, y: dy };
  const pct = (value: number, size: number) => `${((value / size) * 100).toFixed(1)}%`;
  return {
    "--x": `${x}%`,
    "--y": `${y}%`,
    "--w": `${w}%`,
    "--h": `${h}%`,
    "--near-x": pct(-dx * GATHER, w),
    "--near-y": pct(-dy * GATHER, h),
    "--far-x": pct(out.x * PASS, w),
    "--far-y": pct(out.y * PASS, h),
    "--lag": `${lag}ms`,
  } as CSSProperties;
}

/**
 * Turning the hero's sky on or off flies you out of, or into, a bank of cloud. It sits in the
 * sky's own box, behind the hero's content, and does nothing until the switch is used: the
 * animation is all CSS (see "sky-flight" in globals.css), started by an attribute on <html>.
 */
export function SkyFlight() {
  return (
    <div aria-hidden="true" className={`sky-flight ${HERO_SKY_CLASS}`}>
      {PUFFS.map((puff, i) => (
        <span key={i} className="sky-flight-puff" style={flightPath(puff)} />
      ))}
    </div>
  );
}
