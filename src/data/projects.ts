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
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
