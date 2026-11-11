import { ImageResponse } from "next/og";
import { en } from "@/features/deskcloud/content/en";
import { sky } from "@/features/deskcloud/themes/sky";
import type { Rgb } from "@/features/deskcloud/themes/types";

export const alt = en.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;
const day = sky.palettes.day;

/** A flat cloud in the demo's style: a shadow row, then the white puffs on top */
function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  const puffs = [
    { dx: 0, r: 34 },
    { dx: 46, r: 50 },
    { dx: 104, r: 42 },
    { dx: 150, r: 30 },
  ];
  const base = 60 * scale;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", width: 240 * scale, height: 120 * scale }}>
      {(["shadow", "main"] as const).map((pass) =>
        puffs.map(({ dx, r }) => {
          const radius = r * scale;
          return (
            <div
              key={`${pass}-${dx}`}
              style={{
                position: "absolute",
                left: dx * scale,
                top: base - radius * 2 + (pass === "shadow" ? radius * 0.18 + base * 0.5 : base * 0.5),
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                background: rgb(pass === "shadow" ? day.cloudShadow : day.cloud),
              }}
            />
          );
        }),
      )}
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `linear-gradient(${rgb(day.skyTop)}, ${rgb(day.skyBottom)})`,
      }}
    >
      {/* Sun with its glow */}
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 64,
          width: 200,
          height: 200,
          borderRadius: 100,
          background: rgb(day.orbGlow),
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 136,
          top: 104,
          width: 120,
          height: 120,
          borderRadius: 60,
          background: rgb(day.orb),
        }}
      />

      <Cloud x={700} y={250} scale={1.4} />
      <Cloud x={880} y={420} scale={1} />
      <Cloud x={560} y={470} scale={0.8} />

      <div
        style={{
          position: "absolute",
          left: 80,
          top: 120,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 620,
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, color: "#0A1F19", lineHeight: 1 }}>
          {en.meta.title}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#0A1F19", lineHeight: 1.2 }}>{en.hero.title}</div>
      </div>
    </div>,
    size,
  );
}
