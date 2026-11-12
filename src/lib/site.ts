export const site = {
  name: "John Ford Actub",
  shortName: "JFA",
  title: "Front-End Developer",
  /** Shown above the name in the hero */
  label: "Frontend developer · full-stack experience",
  email: "cs.actubjohnford@gmail.com",
  links: {
    github: "https://github.com/Jampord",
    linkedin:
      "https://www.linkedin.com/in/john-ford-actub-074b7029b?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  tagline:
    "Asset management for 1,500+ staff across 20 departments. An events platform for a church. An offline ledger for my mom's shop.",
  /** Credit for the hero's background */
  sky: {
    caption: "Drawn by Deskcloud, a canvas engine I wrote by hand. 30fps, no libraries.",
    href: "/lab/deskcloud",
    place: "San Fernando, Pampanga",
    /** e.g. "Live sky over San Fernando, Pampanga · 9:14 PM" */
    live: (place: string, time: string) => `Live sky over ${place} · ${time}`,
    switchLabel: "Day and night follow",
    modes: { clock: "Pampanga clock", theme: "My theme" },
    palette: { toClock: "Follow the Pampanga clock for day and night", toTheme: "Stop following the Pampanga clock" },
  },
  cvPath: "/john-ford-actub-cv.pdf",
  nav: [
    { label: "Work", href: "/#work" },
    { label: "About", href: "/#about" },
    { label: "Experience", href: "/#experience" },
    { label: "Contact", href: "/#contact" },
  ],
};
