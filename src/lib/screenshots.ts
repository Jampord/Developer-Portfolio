import type { ProjectImage } from "@/data/projects";

/** Phone screenshots are taller than they are wide; desktop ones are wider. */
export const isPortrait = (image: ProjectImage) => image.height > image.width;

/** How many phone screenshots sit side by side in a cover */
export const MAX_COVER_PHONES = 3;

/**
 * The cover is the first image, or, when it's a phone screenshot, the run of phone
 * screenshots it starts (up to MAX_COVER_PHONES). Everything after goes to the gallery.
 */
export function splitCover(images: ProjectImage[]) {
  const first = images[0];
  if (!first) return { cover: [], gallery: [] };
  if (!isPortrait(first)) return { cover: [first], gallery: images.slice(1) };

  let count = 0;
  while (count < images.length && count < MAX_COVER_PHONES && isPortrait(images[count])) count++;
  return { cover: images.slice(0, count), gallery: images.slice(count) };
}

export type GalleryBlock = { kind: "wide"; image: ProjectImage } | { kind: "phones"; images: ProjectImage[] };

/** Groups consecutive phone screenshots so they can share a row; wide ones stay on their own. */
export function groupGallery(images: ProjectImage[]): GalleryBlock[] {
  const blocks: GalleryBlock[] = [];
  for (const image of images) {
    const last = blocks.at(-1);
    if (!isPortrait(image)) blocks.push({ kind: "wide", image });
    else if (last?.kind === "phones") last.images.push(image);
    else blocks.push({ kind: "phones", images: [image] });
  }
  return blocks;
}
