import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.owner.name} — ${site.owner.title}`;
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0b0e14",
          color: "#e6eaf2",
          fontFamily: "monospace",
        }}
      >
        {/* One string child: Satori rejects a div with several children that is
            not display:flex, and text + expression counts as several. */}
        <div style={{ color: "#4fd1c5", fontSize: 28 }}>
          {`${site.owner.name} // RESEARCH FACILITY`}
        </div>
        <div style={{ fontSize: 72, fontWeight: 700 }}>{site.owner.title}</div>
        <div style={{ fontSize: 32, color: "#8b94a7" }}>
          {site.owner.tagline}
        </div>
      </div>
    ),
    size,
  );
}
