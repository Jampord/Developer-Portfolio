// All user-facing Deskcloud copy lives here (English only for now).

const subhead =
  "Deskcloud is a wallpaper concept where clouds drift across your desktop and part around your icons, reshaping themselves whenever you move one.";

export const en = {
  meta: {
    title: "Deskcloud",
    /** Same sentence as the hero subhead */
    description: subhead,
    ogAlt: "Deskcloud: a sky that makes room for your files",
  },

  header: {
    back: "Back to portfolio",
  },

  hero: {
    eyebrow: "// lab – concept",
    title: "A sky that makes room for your files.",
    subhead,
    primaryCta: "Join the waitlist",
    secondaryCta: "How I built it",
    hint: "Try dragging an icon.",
  },

  howItWorks: {
    eyebrow: "// 01 – how it works",
    title: "How it works",
    steps: [
      {
        title: "It sees where your icons are",
        body: "Every icon becomes a small no-cloud zone, with a little breathing room around it.",
      },
      {
        title: "It keeps them clear",
        body: "Each cloud is a cluster of soft puffs that slide aside or shrink, so nothing ever covers your files.",
      },
      {
        title: "It reshapes when you move things",
        body: "Drop an icon somewhere new and the sky reflows around it, then fills back in where it used to be.",
      },
    ],
  },

  features: {
    eyebrow: "// 02 – features",
    title: "Small touches",
    items: [
      {
        title: "Knows your icons",
        body: "It only needs to know where your icons sit, never what's in them. This demo runs entirely in your browser.",
      },
      {
        title: "Reshapes as you go",
        body: "Drag an icon and the clouds part around it straight away, then drift back once it moves on.",
      },
      {
        title: "Easy on your battery",
        body: "The sky redraws 30 times a second at most, and stops completely whenever you can't see it.",
      },
      {
        title: "Day and night",
        body: "It follows your light or dark theme: blue skies and birds by day, a moon and stars by night.",
      },
    ],
  },

  faq: {
    eyebrow: "// 03 – faq",
    title: "Questions",
    items: [
      {
        question: "Is this a real app?",
        answer:
          "Not yet. Deskcloud is a concept, and this page is a working demo of the idea. A Windows version might follow if enough people want one, so join the waitlist if you would use it.",
      },
      {
        question: "Does it read my files?",
        answer:
          "No. It would only need to know where your icons are on screen, never what's inside them. This demo doesn't send anything anywhere.",
      },
      {
        question: "Will it slow my computer down?",
        answer:
          "It's built to stay light: simple flat shapes, a 30 frames per second limit, and a full stop whenever it's hidden or scrolled out of view.",
      },
      {
        question: "Does it work on phones?",
        answer:
          "This demo does: drag icons with your finger and tap one to open it. The app idea itself is for Windows desktops.",
      },
      {
        question: "What about Mac?",
        answer: "Windows comes first, since that's where the idea started. A Mac version would depend on interest.",
      },
      {
        question: "Is the code public?",
        answer:
          "Yes. The demo is part of my portfolio's source on GitHub, and the case study walks through how the sky works.",
      },
    ],
  },

  waitlist: {
    eyebrow: "// 04 – waitlist",
    title: "Join the waitlist",
    body: "If Deskcloud ever becomes a real Windows app, you'll be the first to know.",
    privacy: "I'll only use your email to tell you if Deskcloud becomes a real app. No spam, no sharing.",
    /** Shown until the sign-up form is ready */
    comingSoon: "The sign-up form opens soon.",
  },

  footer: {
    note: (name: string) => `Deskcloud is a concept project by ${name}.`,
    linksLabel: "Deskcloud links",
    links: {
      portfolio: "Portfolio",
      caseStudy: "Case study",
      github: "GitHub",
    },
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
