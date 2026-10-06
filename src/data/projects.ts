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
  images: ProjectImage[];
};

export const projects: Project[] = [
  {
    slug: "vladimir",
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
      "These modules weren't CRUD screens. Each one was a real business process, so I had to understand the workflow first and then turn it into a usable interface. The work sharpened my skills in complex state management, API integration, form validation and business logic in React.",
    images: [
      {
        src: "/projects/vladimir/fixed-asset.png",
        alt: "Vladimir fixed asset viewing interface (sensitive data redacted)",
        width: 1917,
        height: 947,
      },
      {
        src: "/projects/vladimir/dashboard1.png",
        alt: "Vladimir user dashboard with permission-based modules for requisitions, movements, inventory and reports",
        width: 1914,
        height: 947,
      },
      {
        src: "/projects/vladimir/dashboard.png",
        alt: "Vladimir admin dashboard with summary cards for assets, movements, approvals and exceptions",
        width: 1914,
        height: 947,
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
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
