/**
 * A small hand-off between the case study, the Selected Work section and `SmoothScroll`, so that
 * "Back to work" returns to the project you were reading instead of the top of the section.
 *
 * 1. The link on the case study names its project (`data-work-return`), and `SmoothScroll`
 *    remembers it when the link is clicked.
 * 2. Selected Work, as it mounts, works out where the page must be for that project's card to be
 *    in view (on top of the deck, or at its place in the plain list) and leaves that here.
 * 3. `SmoothScroll` lands there instead of on the section's own anchor.
 *
 * Each value is handed over once and then forgotten.
 */

/** The attribute a link sets to say which project it is going back to */
export const WORK_RETURN_ATTR = "data-work-return";

let returning: string | null = null;
let landing: number | null = null;

export function rememberProject(slug: string) {
  returning = slug;
}

export function takeProject(): string | null {
  const slug = returning;
  returning = null;
  return slug;
}

export function setLanding(top: number) {
  landing = top;
}

export function takeLanding(): number | null {
  const top = landing;
  landing = null;
  return top;
}
