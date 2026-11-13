/**
 * The motion system, for code that animates from JavaScript (GSAP, the Web Animations API).
 * The CSS side lives in the `:root` block of `src/app/globals.css`; `motion.test.ts` fails if the
 * two drift apart. Nothing in the UI runs longer than `duration.slow`.
 */

/** Seconds, as GSAP wants them */
export const duration = {
  /** The press itself: feedback inside 100ms */
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

/** Seconds between items that arrive one after another */
export const stagger = 0.05;

/** GSAP's closest named curves to the CSS easings */
export const ease = {
  /** ease-out: things arriving */
  enter: "power3.out",
  /** ease-in: things leaving */
  exit: "power3.in",
  /** ease-in-out: things moving on screen */
  move: "power2.inOut",
} as const;

/** Overshoot curves for physical interactions: a press releasing, a card settling */
export const spring = {
  snappy: "back.out(1.7)",
  gentle: "back.out(1.2)",
} as const;

/** How far buttons and cards squash while pressed */
export const pressScale = 0.97;

/** A duration in milliseconds, for the Web Animations API */
export const ms = (seconds: number) => Math.round(seconds * 1000);
