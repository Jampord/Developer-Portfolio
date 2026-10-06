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
  links?: { live?: string; repo?: string };
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
      repo: "https://github.com/jampord/Json-Toolbox",
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

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
