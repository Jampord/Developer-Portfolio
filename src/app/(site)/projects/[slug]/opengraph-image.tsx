import { ImageResponse } from "next/og";
import { getProject, projects } from "@/data/projects";
import { site } from "@/lib/site";

export const alt = "Project case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  const title = project?.title ?? site.name;
  const summary = project?.summary ?? site.tagline;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0A6B55",
        padding: 36,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F3F8F5",
          borderRadius: 56,
          padding: 64,
        }}
      >
        <div style={{ display: "flex", color: "#0D9373", fontSize: 30 }}>{"// case study"}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              color: "#0A1F19",
              fontSize: 104,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", maxWidth: 940, fontSize: 32, color: "#5B7A70" }}>{summary}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#0D9373",
              color: "#F3F8F5",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {site.shortName}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#0A1F19" }}>{site.name}</div>
        </div>
      </div>
    </div>,
    size,
  );
}
