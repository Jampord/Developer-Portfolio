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

export const MAX_ICONS = 12;

export function newFileIcon(n: number): DesktopIconData {
  return { id: `new-file-${n}`, label: en.demo.newFileLabel(n), glyph: File, action: { type: "wiggle" } };
}
