import { describe, expect, it } from "vitest";
import type { ProjectImage } from "@/data/projects";
import { groupGallery, isPortrait, splitCover } from "../screenshots";

const wide = (name: string): ProjectImage => ({ src: `/${name}.png`, alt: name, width: 1600, height: 900 });
const phone = (name: string): ProjectImage => ({ src: `/${name}.png`, alt: name, width: 824, height: 1678 });

describe("isPortrait", () => {
  it("is true only when the image is taller than it is wide", () => {
    expect(isPortrait(phone("a"))).toBe(true);
    expect(isPortrait(wide("a"))).toBe(false);
    expect(isPortrait({ ...wide("a"), height: 1600 })).toBe(false);
  });
});

describe("splitCover", () => {
  it("returns nothing for a project without images", () => {
    expect(splitCover([])).toEqual({ cover: [], gallery: [] });
  });

  it("uses only the first image when it's a desktop screenshot", () => {
    const images = [wide("a"), phone("b"), wide("c")];
    expect(splitCover(images)).toEqual({ cover: [images[0]], gallery: [images[1], images[2]] });
  });

  it("takes up to three leading phone screenshots for the cover", () => {
    const images = [phone("a"), phone("b"), phone("c"), phone("d")];
    const { cover, gallery } = splitCover(images);
    expect(cover.map((i) => i.alt)).toEqual(["a", "b", "c"]);
    expect(gallery.map((i) => i.alt)).toEqual(["d"]);
  });

  it("stops the phone cover at the first desktop screenshot", () => {
    const images = [phone("a"), wide("b"), phone("c")];
    const { cover, gallery } = splitCover(images);
    expect(cover.map((i) => i.alt)).toEqual(["a"]);
    expect(gallery.map((i) => i.alt)).toEqual(["b", "c"]);
  });
});

describe("groupGallery", () => {
  it("keeps wide images apart and groups consecutive phones", () => {
    const blocks = groupGallery([phone("a"), phone("b"), wide("c"), phone("d"), wide("e"), wide("f")]);
    expect(blocks.map((b) => (b.kind === "wide" ? b.image.alt : b.images.map((i) => i.alt).join("+")))).toEqual([
      "a+b",
      "c",
      "d",
      "e",
      "f",
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["phones", "wide", "phones", "wide", "wide"]);
  });

  it("returns no blocks for no images", () => {
    expect(groupGallery([])).toEqual([]);
  });
});
