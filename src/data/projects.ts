import { Boxes, CalendarDays, Cloud, NotebookPen, type LucideIcon } from "lucide-react";

/** next/image quality for project screenshots; must be listed in images.qualities in next.config.ts */
export const SCREENSHOT_QUALITY = 90;

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  client: string;
  role: string;
  year?: string;
  confidential?: boolean;
  stack: { group: string; items: string[] }[];
  problem: string;
  approach: { title: string; body: string }[];
  outcome: string;
  links?: { live?: string; repos?: { label: string; href: string }[] };
  note?: string;
  /** Desktop icon for the home page. Projects that have one are the featured ones. */
  icon?: { label: string; glyph: LucideIcon };
  images: ProjectImage[];
};

export const projects: Project[] = [
  {
    slug: "vladimir",
    icon: { label: "Vladimir", glyph: Boxes },
    title: "Vladimir",
    summary:
      "An enterprise fixed asset management system that tracks company assets from requisition and procurement all the way to disposal.",
    client: "Enterprise organization (confidential)",
    role: "Front-End Developer",
    confidential: true,
    stack: [
      {
        group: "Core",
        items: ["React 18", "Vite", "JavaScript (JSX)", "React Router", "Redux Toolkit"],
      },
      { group: "UI", items: ["Material UI", "MUI Data Grid", "SCSS"] },
      { group: "Forms", items: ["React Hook Form", "Yup"] },
      { group: "Charts", items: ["Chart.js", "MUI X Charts"] },
      {
        group: "Devices & documents",
        items: ["React Webcam", "Barcode scanning", "React Signature Canvas", "React-to-Print", "ExcelJS"],
      },
      { group: "Offline", items: ["PWA", "Workbox"] },
    ],
    problem:
      "Organizations that manage large asset registers often track assets by hand. That makes it hard to know where an asset is, who approved what, and what stage it has reached. Vladimir replaces that with one system covering the full asset lifecycle, built for asset-management, warehouse, finance and operations teams.",
    approach: [
      {
        title: "Asset Requisition",
        body: "I coordinated every stage of an asset request: the initial requisition, purchase order synchronization, delivery, tagging, and finally release from the warehouse. That meant complex forms, validation rules, API integrations, and a lot of asset and requisition statuses that had to stay consistent from one stage to the next.",
      },
      {
        title: "Asset Movement",
        body: "Assets move through pickup, evaluation, pullout, transfer, bidding and disposal, and each process has its own rules, required information and status transitions. I made sure the interface always reflected the backend state and blocked invalid actions before they could happen.",
      },
      {
        title: "Physical Inventory",
        body: "This went well beyond displaying and updating records. It combined barcode scanning, camera integration, asset status validation, signature capture and report generation in one workflow.",
      },
    ],
    outcome:
      "Vladimir manages assets for 1,500+ staff across 20 departments. These modules weren't CRUD screens. Each one was a real business process, so I had to understand the workflow first and then turn it into a usable interface. The work sharpened my skills in complex state management, API integration, form validation and business logic in React.",
    images: [
      {
        src: "/projects/vladimir/dashboard.png",
        alt: "Vladimir dashboard with summary cards for registered assets, open movements, pending approvals and control exceptions",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/vladimir/requisition.png",
        alt: "Vladimir requisition timeline: a request at the For Tagging stage, with its approval and purchasing history",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/vladimir/transfer.png",
        alt: "Vladimir transfer request moving five assets to a branch, each with its new custodian and receiver",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/vladimir/physical-inventory.png",
        alt: "Vladimir physical inventory session: 128 of 162 assets scanned, with the scan field and recent scans",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/vladimir/scanner.png",
        alt: "Vladimir phone scanner pointed at an asset tag, with the session's scan progress at the bottom",
        width: 824,
        height: 1830,
      },
    ],
  },
  {
    slug: "camac-web",
    icon: { label: "CAMAC Web", glyph: CalendarDays },
    title: "CAMAC Web",
    summary:
      "A shareable events and announcements calendar for my church, built so every event link turns into a clean preview card when it's posted to Facebook or Messenger.",
    client: "Personal project",
    role: "Full-Stack Developer",
    year: "2026",
    stack: [
      { group: "Core", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4"] },
      { group: "UI", items: ["shadcn/ui", "Base UI", "lucide-react", "Sonner"] },
      { group: "Data", items: ["PostgreSQL (Neon)", "Prisma 7", "Zod 4", "Server Actions"] },
      { group: "Auth", items: ["Auth.js (Google sign-in)", "Role-based access"] },
      { group: "Services", items: ["Cloudinary", "Nodemailer", "Sentry", "Vercel Cron"] },
      { group: "Quality", items: ["Vitest", "Playwright", "ESLint", "GitHub Actions CI"] },
    ],
    problem:
      "CAMAC – San Fernando is a church of around 50 people who meet every week. Event announcements lived in scattered Facebook posts and Messenger threads, so details got buried and people missed things. I volunteered to build one place for every event and announcement, designed around how the church already communicates: links shared to the Facebook page and the group chat.",
    approach: [
      {
        title: "Recurring events",
        body: "Events can repeat weekly with skipped dates, last all day, or span several days. Times are stored in UTC and shown in Manila time, and the agenda groups everything by week and month with a ministry filter. Adding an event to a calendar brings the whole series, minus the skipped dates, to Google Calendar or as an .ics file.",
      },
      {
        title: "Built for sharing",
        body: "Every event gets a generated 1200×630 preview card. The card is versioned, so an edited event never shows a stale image in Messenger. Admins can copy an announcement in the volunteers' own posting format or use the phone's share sheet, and printable QR pages put events on the bulletin board and on slides. Opens, copies and shares are counted without cookies and with bots excluded, so we can tell whether it's working.",
      },
      {
        title: "Roles and access",
        body: "Members sign in with Google against an allowlist. Admins, the prayer team, members and people managers each see different things, and every check happens on the server. Nobody can change their own access, and the last people manager can't be removed, so the church can't lock itself out.",
      },
      {
        title: "Prayer requests",
        body: "Anyone can send a prayer request, anonymously if they want, behind a honeypot and a per-IP rate limit. The prayer team moves each request from New to Prayed to Answered. Notification emails never include the request itself, and a daily job archives requests after 60 days and deletes them after a year.",
      },
      {
        title: "Readable for everyone",
        body: "The congregation spans all ages, so the app uses Atkinson Hyperlegible, a typeface designed for low-vision readers, with a palette taken from the church logo, light and dark modes, and a bottom tab bar on phones.",
      },
    ],
    outcome:
      "This was my first project with real stakeholders. I talked to the people who'd use it and wrote a brief before writing any code. I shipped it through 20 pull requests, with CI running type checks, lint, over 200 Vitest cases, a Playwright smoke test and a production build. It taught me to design around how people actually communicate, not how I'd like them to.",
    links: {
      live: "https://camac-sf-web.vercel.app",
      repos: [{ label: "Source code", href: "https://github.com/Jampord/camac-sf-web" }],
    },
    images: [
      {
        src: "/projects/camac-web/home-top.png",
        alt: "CAMAC Web home page on a phone: Sunday service at 9:00 AM, prayer meeting times, and directions",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/events-top.png",
        alt: "Upcoming events on a phone, grouped by week, with a ministry filter",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/event-top.png",
        alt: "Event page for a three-day youth camp, with Add to calendar and Open in Maps buttons",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/og-xmas.png",
        alt: "Generated preview card for a Christmas service, as it appears when the link is shared",
        width: 1200,
        height: 630,
      },
      {
        src: "/projects/camac-web/event-poster.png",
        alt: "Event page showing the event's poster",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/event-cal.png",
        alt: "Choosing between Google Calendar and another calendar when adding an event",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/schedule-in.png",
        alt: "Sunday serving schedule for members: service leader, music team, Sunday school and after-service roles",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/admin-home.png",
        alt: "Admin home with new prayer requests, the success metric panel, and the month's events",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/admin-new.png",
        alt: "Admin form for creating a new event",
        width: 824,
        height: 1678,
      },
      {
        src: "/projects/camac-web/admin-schedule-date.png",
        alt: "Admin form for filling in the serving schedule for one Sunday",
        width: 824,
        height: 1678,
      },
    ],
  },
  {
    slug: "cleos-transaction-tracker",
    icon: { label: "Cleo's Tracker", glyph: NotebookPen },
    title: "Cleo's Transaction Tracker",
    summary:
      "An offline Android app that replaces the paper notebook in my mom's shop. It records GCash, mobile load and water sales, tracks who owes what, and checks the cash drawer at the end of the day.",
    client: "Personal project for my mom's shop",
    role: "Mobile Developer",
    year: "2026",
    note: "An Android app that isn't on a store yet. It's being piloted alongside the paper notebook it replaces, and the source code is public.",
    stack: [
      { group: "Core", items: ["Expo SDK 57", "React Native 0.86", "React 19", "TypeScript"] },
      { group: "Navigation", items: ["Expo Router"] },
      { group: "Data", items: ["SQLite (expo-sqlite)", "Drizzle ORM", "Drizzle Kit migrations"] },
      { group: "Files", items: ["expo-file-system", "expo-sharing", "expo-document-picker"] },
      { group: "UI", items: ["React Native Reanimated", "Ionicons"] },
      { group: "Tooling", items: ["EAS Build", "ESLint"] },
    ],
    problem:
      "My mom, Cleo, runs a small shop in the Philippines that handles GCash cash-in and cash-out, mobile load and mineral water. Everything went into a paper notebook: each transaction, its fee, who still owed money, and at the end of the day, whether the cash drawer and the GCash wallet added up. That's slow, easy to get wrong, and hard to look back through. I built an app that does the same job on her phone, works with no internet connection, and does the arithmetic for her.",
    approach: [
      {
        title: "An entry form that knows the fees",
        body: "As the amount is typed, the fee fills in from an editable fee table, and it stops filling in the moment she types her own. A cash-out fee can be added on top or deducted, and an \"At the counter\" panel shows exactly how much to hand over. Amounts above ₱10,000 need a manual fee before they can be saved.",
      },
      {
        title: "Utang (credit)",
        body: "Customers who owe money can pay in parts, by cash or GCash, and each payment goes to their oldest entries first or to one she picks. Once an entry has payments it's locked except for the name, so balances can't drift.",
      },
      {
        title: "Cash check",
        body: "Starting from the opening balances, the app works out how much cash and GCash there should be from every kind of entry, then shows Matches, Short ₱X or Over ₱X against what she counts.",
      },
      {
        title: "Data she can't lose",
        body: "Everything is stored on the phone in SQLite through Drizzle ORM. Money is kept in whole centavos, and totals are always calculated from the entries, never stored. She can back up the database through the share sheet, export every table to CSV, and restore a backup once it's been checked.",
      },
    ],
    outcome:
      "This was my first React Native app, and my first time designing for one specific person instead of \"users\": my mom, at her own counter, with no internet to rely on. The hardest part wasn't the code but the rules: how fees work, where a partial payment goes, what counts as short. I kept all of that in plain TypeScript functions and documented every formula with worked examples, which made the app much easier to trust. Next on the roadmap are automated tests, weekly charts and an optional sync backend.",
    links: {
      repos: [{ label: "Source code", href: "https://github.com/Jampord/Cleos-Transaction-Tracker" }],
    },
    images: [
      {
        src: "/projects/cleos-transaction-tracker/today.jpg",
        alt: "Today screen: ₱510 owed in utang, 7 gallons of water left, and the day's cash-in, cash-out, load and water entries with their fees",
        width: 1220,
        height: 2587,
      },
      {
        src: "/projects/cleos-transaction-tracker/cash-check.jpg",
        alt: "Cash check comparing what the cash drawer and GCash wallet should have with what was counted, showing Short ₱500 and Over ₱1,500",
        width: 1220,
        height: 2587,
      },
      {
        src: "/projects/cleos-transaction-tracker/settings.jpg",
        alt: "Settings with the GCash fee table, the small-load fee and threshold, load cost, and water pricing",
        width: 1220,
        height: 2587,
      },
    ],
  },
  {
    slug: "deskcloud",
    icon: { label: "Deskcloud", glyph: Cloud },
    title: "Deskcloud",
    summary:
      "A wallpaper concept where clouds drift across a desktop and part around the icons, built as a live, draggable demo on a hand-written Canvas 2D engine.",
    client: "Personal project",
    role: "Design & front-end",
    year: "2026",
    stack: [
      { group: "Core", items: ["Next.js 16", "React 19", "TypeScript"] },
      { group: "Rendering", items: ["Canvas 2D (hand-written)", "requestAnimationFrame"] },
      { group: "UI", items: ["Tailwind CSS 4", "next-themes", "lucide-react"] },
      { group: "Waitlist", items: ["Upstash Redis", "Resend", "Zod", "React Hook Form"] },
      { group: "Quality", items: ["Vitest", "ESLint", "GitHub Actions CI"] },
    ],
    problem:
      "Desktop wallpapers ignore what's on your desktop: your files sit on top of whatever the picture happens to have there. I wanted to try the opposite. Could the scenery make room for your files instead, and move out of the way when you rearrange them?",
    approach: [
      {
        title: "Engine",
        body: "The icons become an occupancy grid. A two-pass chamfer distance transform turns that grid into a clearance field: how far every point is from the nearest icon, and which way leads away from it. Each cloud is a cluster of puffs, and every puff eases toward a target on a critically damped spring, sliding aside where the field says it's too close and shrinking only by what the push can't clear. I wrote it in plain Canvas 2D with no library, because I wanted to understand and own every frame. The puffs aren't drawn one by one: each adds a soft bump of density to a coarse grid, and a threshold turns that density into a single shape, so a cloud reads as one mass of vapour that thins and tears when it's pulled apart and heals when it comes back together. That shape is shaded from the sun's or moon's side, with greyer bases where more cloud sits overhead, in about a millisecond a frame. Over it all runs a coarse grid of air: a moving cursor, a finger or a dragged icon pushes a gust into it, the air carries itself along and slides around icons instead of through them, and the puffs ride it, stretching into streaks, before easing home over a few seconds.",
      },
      {
        title: "Icons",
        body: "The icons are real HTML buttons layered over the canvas, so they're focusable and have proper names. They snap to a Windows-style slot grid and can be dragged with a mouse, finger or pen. While you drag, the icon's box is fed to the engine once per frame, so the clouds reflow live instead of waiting for the drop.",
      },
      {
        title: "Performance",
        body: "The sky renders at 30 frames per second at most, with the pixel ratio capped at 2. The loop stops completely when the canvas is scrolled out of view or the tab is hidden, and I confirmed in the browser that no frames are drawn or requested then. The whole demo loads lazily, behind a placeholder of the same size, so the headline and text arrive first.",
      },
      {
        title: "Accessibility",
        body: "Arrow keys move the focused icon one slot and Enter opens it, with each move announced to screen readers. With reduced motion on, the sky stays still and settles instantly whenever an icon lands somewhere new. The canvas is purely decorative and hidden from assistive tech, and the headline is server-rendered.",
      },
      {
        title: "Waitlist",
        body: "The sign-up reuses the contact form's patterns: Zod validation, a honeypot, and per-IP plus global rate limits on a shared Redis client. Addresses go into a Redis set, so a repeat sign-up is harmless, and I'm only notified the first time.",
      },
    ],
    outcome:
      "The most useful lesson was splitting the work cleanly: the grid, field and clouds are plain TypeScript with unit tests, and only the renderer and the loop touch the browser. A real Windows version could reuse the whole engine and only replace the renderer. Building it also taught me a lot about spring physics, distance fields, and keeping an animation cheap enough to leave running all day.",
    links: {
      live: "/lab/deskcloud",
      repos: [{ label: "Source code", href: "https://github.com/Jampord/Developer-Portfolio" }],
    },
    images: [
      {
        src: "/projects/deskcloud/day.png",
        alt: "Deskcloud demo by day: a blue sky with flat white clouds and a sun, with desktop icons down the left edge",
        width: 1725,
        height: 1140,
      },
      {
        src: "/projects/deskcloud/parting.gif",
        alt: "Animation: the GitHub icon is dragged into the sky, the clouds part around it, and it's dragged back",
        width: 690,
        height: 456,
      },
      {
        src: "/projects/deskcloud/night.png",
        alt: "Deskcloud demo at night: a dark blue sky with stars, moonlit clouds and a moon, with the same desktop icons",
        width: 1725,
        height: 1140,
      },
    ],
  },
  {
    slug: "spotify-clone",
    title: "Spotify Clone",
    summary:
      "A full-stack, Spotify-inspired music streaming app with a React front end, a Node and Express API, real-time updates and cloud media storage.",
    client: "Personal project",
    role: "Full-Stack Developer",
    note: "An independent learning project, not affiliated with Spotify. There is no live demo, but both repositories are public.",
    stack: [
      {
        group: "Frontend",
        items: [
          "React 19",
          "TypeScript",
          "Vite",
          "Tailwind CSS",
          "Zustand",
          "React Router",
          "Radix UI",
          "Axios",
          "Socket.IO Client",
        ],
      },
      {
        group: "Backend",
        items: ["Node.js", "Express", "MongoDB", "Mongoose", "Socket.IO"],
      },
      { group: "Services", items: ["Clerk (authentication)", "Cloudinary (media)"] },
      { group: "Tooling", items: ["ESLint", "Responsive UI"] },
    ],
    problem:
      "I wanted to understand how a production-style application fits together, not just build individual front-end screens. So I built a Spotify-inspired streaming app covering both the front end and the back end, with authentication, a database, media storage and real-time communication.",
    approach: [
      {
        title: "Browsing and playback",
        body: "On the front end I built the music browsing and playback experience with React, TypeScript, Tailwind CSS and React Router. Zustand manages application and player state, including the currently playing song and the playback controls.",
      },
      {
        title: "API, data and media",
        body: "On the back end I used Node.js, Express, and MongoDB with Mongoose. I integrated Clerk for authentication and Cloudinary to manage music and album media.",
      },
      {
        title: "Real-time activity",
        body: "I used Socket.IO so player and application activity could be reflected without constantly refreshing the page. Connecting the front end, back end and real-time layer was the most interesting challenge.",
      },
    ],
    outcome:
      "This project gave me experience building a complete application. It forced me to think about the whole architecture: authentication and database models, API design, file and media management, state management, responsive UI and real-time communication. It taught me how the front end and back end work together.",
    links: {
      repos: [
        {
          label: "Frontend repo",
          href: "https://github.com/Jampord/spotify-clone-frontend",
        },
        {
          label: "Backend repo",
          href: "https://github.com/Jampord/spotify-clone-backend",
        },
      ],
    },
    images: [
      {
        src: "/projects/spotify-clone/home.png",
        alt: "Spotify Clone home screen with album browsing and a playback bar",
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/spotify-clone/player.png",
        alt: "Spotify Clone player view with playback controls and the current song",
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/spotify-clone/upload.png",
        alt: "Spotify Clone upload view with file selection and upload controls",
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "json-toolbox",
    title: "JSON Toolbox",
    summary:
      "A browser-based developer utility for formatting, validating, minifying and converting JSON into TypeScript interfaces.",
    client: "Personal project",
    role: "Solo Developer",
    stack: [
      { group: "Core", items: ["React 19", "TypeScript 6", "Vite 8"] },
      { group: "Styling", items: ["Sass"] },
      { group: "Quality", items: ["Vitest", "ESLint"] },
      { group: "Hosting", items: ["GitHub Pages"] },
    ],
    problem:
      "Developers constantly handle JSON from APIs and other data sources, and inspecting or transforming it often means repetitive manual work. JSON Toolbox is a simple, focused workspace for the common JSON tasks, with nothing to install. It's designed mainly for front-end developers, TypeScript developers, and anyone working with API responses.",
    approach: [
      {
        title: "A focused workspace",
        body: "I built it in React and TypeScript with dedicated input and output panels. You can format, minify, validate, copy and clear JSON, and generate TypeScript interfaces from the data.",
      },
      {
        title: "Useful feedback states",
        body: "Each action tells you what happened, so you aren't left guessing whether the JSON was valid, the copy worked, or an operation failed.",
      },
      {
        title: "Typed and maintainable",
        body: "I kept the implementation strongly typed and set up linting, testing and production builds from the start, so the codebase stays maintainable as it grows.",
      },
    ],
    outcome:
      "I turned a small utility idea into a complete, deployed developer tool with a clean workflow. It's the project where I practiced shipping end to end: building, testing, linting and publishing it myself.",
    links: {
      live: "https://jampord.github.io/Json-Toolbox/",
      repos: [{ label: "Source code", href: "https://github.com/jampord/Json-Toolbox" }],
    },
    images: [
      {
        src: "/projects/json-toolbox/workspace.png",
        alt: "JSON Toolbox workspace with a JSON input panel and a formatted output panel",
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/json-toolbox/interfaces.png",
        alt: "JSON Toolbox generating TypeScript interfaces from sample JSON",
        width: 1600,
        height: 900,
      },
    ],
  },
];

/** Shown as cards in Selected Work, and as icons on the home page */
export const featuredProjects = projects.filter((p) => p.icon);

/** Listed under "also built"; each still has its own case-study page */
export const otherProjects = projects.filter((p) => !p.icon);

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
