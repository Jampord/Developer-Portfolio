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
    "I build software people rely on. From an asset system for 1,500+ staff across 20 departments to an offline ledger for my mom's shop, and a church calendar in between.",
  /** Credit for the hero's background */
  sky: {
    caption: "Drawn by Deskcloud, a canvas engine I wrote by hand. 30fps, no libraries.",
    href: "/lab/deskcloud",
    place: "San Fernando, Pampanga",
    /** The weather card: "29°", "Light rain · Wind 12 km/h", "San Fernando, Pampanga · 9:14 PM · Live" */
    weather: {
      label: (place: string) => `Live weather over ${place}`,
      temperature: (celsius: number) => `${celsius}°`,
      temperatureLabel: (celsius: number) => `${celsius} degrees Celsius`,
      wind: (kmh: number) => `Wind ${kmh} km/h`,
      /** Before the weather arrives, or if it can't be fetched */
      unknown: "Live sky",
      live: "Live",
    },
    switchLabel: "Day and night follow",
    skyLabel: "Sky",
    /** Whether the clouds part around the page's content, or drift on behind it */
    interactiveLabel: "Interactive clouds",
    turnOn: "Turn on the sky",
    turnOnHint: "Show the live sky over San Fernando, Pampanga",
    modes: { clock: "Pampanga clock", theme: "My theme" },
    palette: {
      toClock: "Follow the Pampanga clock for day and night",
      toTheme: "Stop following the Pampanga clock",
      skyOff: "Turn the live sky off",
      skyOn: "Turn the live sky on",
      interactiveOn: "Turn interactive clouds on",
      interactiveOff: "Turn interactive clouds off",
    },
  },
  cvPath: "/john-ford-actub-cv.pdf",
  /** Read out after the logo, which is the link home */
  homeLabel: "home",
  /** The button that shows the section links on small screens */
  menu: { open: "Open menu", close: "Close menu" },
  nav: [
    { label: "About", href: "/#about" },
    { label: "Work", href: "/#work" },
    { label: "Experience", href: "/#experience" },
    { label: "Contact", href: "/#contact" },
  ],
};
