/**
 * A project card and its case study share one part: the cover. Giving both sides the same name
 * lets the browser carry it from the card to the page, and back again. Only the cover travels:
 * the title sits under it on the card and above it on the page, so it would have to cross it.
 * The classes are styled in `src/app/globals.css`.
 */
export const projectMorph = {
  /** Phone covers are laid out differently on the two pages, so they cross-fade instead of being overlaid */
  cover: (slug: string, phones: boolean) =>
    ({ name: `project-cover-${slug}`, share: phones ? "morph-phones" : "morph-cover", default: "none" }) as const,
};
