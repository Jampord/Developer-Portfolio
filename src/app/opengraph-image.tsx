import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "#0D9373",
              color: "#F3F8F5",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            {site.shortName}
          </div>
          <div style={{ display: "flex", color: "#0D9373", fontSize: 30 }}>{`// ${site.title}`}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#0A1F19",
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 0.95,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>John Ford</div>
          <div style={{ display: "flex" }}>Actub</div>
        </div>

        <div style={{ display: "flex", maxWidth: 900, fontSize: 28, color: "#5B7A70" }}>{site.tagline}</div>
      </div>
    </div>,
    size,
  );
}
