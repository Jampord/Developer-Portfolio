// All user-facing Deskcloud copy lives here (English only for now).

export const en = {
  /** Temporary intro under the demo until the full page sections land */
  preview: {
    eyebrow: "Lab · work in progress",
    title: "Deskcloud",
    body: "Drag the icons and the clouds make room. Double-click (or tap) to open one.",
    back: "← Back to portfolio",
  },
  demo: {
    desktopLabel: "Demo desktop",
    icons: {
      resume: "resume.pdf",
      github: "GitHub",
      caseStudy: "How I built this",
      portfolio: "Portfolio",
      notes: "notes.txt",
      photos: "photos",
      todo: "todo.md",
    },
    newFileLabel: (n: number) => `New file (${n}).txt`,
    /** Accessible name for every icon */
    iconName: (label: string) => `${label}. Press Enter to open, arrow keys to move.`,
    toolbar: {
      label: "Desktop actions",
      newFile: "New file",
      reset: "Reset",
    },
    /** Read out by screen readers after each action */
    announce: {
      moved: (label: string, col: number, row: number) => `${label} moved to column ${col}, row ${row}.`,
      cantMove: (label: string) => `${label} can't move further that way.`,
      decorative: (label: string) => `${label} is just for show.`,
      opening: (label: string) => `Opening ${label}.`,
      added: (label: string) => `${label} added.`,
      full: "The desktop is full.",
      reset: "Desktop reset.",
    },
  },
} as const;

export type Content = typeof en;
