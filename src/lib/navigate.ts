/**
 * Fired just before code moves to another address without a link being clicked (the command
 * palette, for one). `SmoothScroll` listens for it so those moves land in the same place a link
 * to the same address would.
 */
export const NAVIGATE_EVENT = "site:navigate";

/** Tell the page where it is about to go; call it right before `router.push(href)` */
export function announceNavigation(href: string) {
  window.dispatchEvent(new CustomEvent<string>(NAVIGATE_EVENT, { detail: href }));
}
