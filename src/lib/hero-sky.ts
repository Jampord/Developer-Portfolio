// Shared by the hero's sky (lazy-loaded) and the parts of the hero that render straight away.
// Data only: importing this doesn't pull in the engine.

/** Elements with this attribute are boxes the clouds part around */
export const SKY_OBSTACLE_ATTR = "data-sky-obstacle";

/** Dispatched (bubbling) by an obstacle that moved without changing size, e.g. a dragged icon */
export const SKY_OBSTACLES_EVENT = "herosky:obstacles";

/**
 * The sky's box inside the hero section: edge to edge, and up behind the sticky nav.
 * The extra height above the page is cut off by the frame's rounded corners.
 */
export const HERO_SKY_CLASS = "pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10";

/** Blends the bottom of the sky into the page */
export const HERO_SKY_FADE_CLASS = "absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background";
