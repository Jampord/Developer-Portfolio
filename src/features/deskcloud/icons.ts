import { CodeXml, File, FileText, Hammer, House, Images, ListTodo, StickyNote, type LucideIcon } from "lucide-react";
import { site } from "@/lib/site";
import { en } from "./content/en";

/** What opening an icon does */
export type IconAction =
  | { type: "external"; href: string } // new tab
  | { type: "internal"; href: string } // same tab, client-side navigation
  | { type: "wiggle" }; // decorative: a small shake, no fake windows

export type DesktopIconData = {
  id: string;
  label: string;
  glyph: LucideIcon;
  action: IconAction;
};

const { icons: labels } = en.demo;

/** The desktop as it starts (and after Reset), in column-major slot order */
export const INITIAL_ICONS: readonly DesktopIconData[] = [
  { id: "resume", label: labels.resume, glyph: FileText, action: { type: "external", href: site.cvPath } },
  { id: "github", label: labels.github, glyph: CodeXml, action: { type: "external", href: site.links.github } },
  { id: "case-study", label: labels.caseStudy, glyph: Hammer, action: { type: "internal", href: "/projects/deskcloud" } },
  { id: "portfolio", label: labels.portfolio, glyph: House, action: { type: "internal", href: "/" } },
  { id: "notes", label: labels.notes, glyph: StickyNote, action: { type: "wiggle" } },
  { id: "photos", label: labels.photos, glyph: Images, action: { type: "wiggle" } },
  { id: "todo", label: labels.todo, glyph: ListTodo, action: { type: "wiggle" } },
];

/** Desktops narrower than this (in px) start with the compact set */
export const COMPACT_BELOW = 640;

/** The icons kept on small screens, in the same order as the full set */
const COMPACT_IDS = new Set(["resume", "github", "case-study", "notes"]);

/** The starting set for a desktop of this width (used on first layout and on Reset) */
export function initialIcons(width: number): readonly DesktopIconData[] {
  return width < COMPACT_BELOW ? INITIAL_ICONS.filter((i) => COMPACT_IDS.has(i.id)) : INITIAL_ICONS;
}

export const MAX_ICONS = 12;

export function newFileIcon(n: number): DesktopIconData {
  return { id: `new-file-${n}`, label: en.demo.newFileLabel(n), glyph: File, action: { type: "wiggle" } };
}
