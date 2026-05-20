import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "About Belan AI — The Team Behind Restaurant Phone AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0D1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "#10B981",
              borderRadius: "6px",
              width: "28px",
              height: "28px",
            }}
          />
          <span style={{ color: "#9CA3AF", fontSize: "18px", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>
            BELAN AI
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
          <p style={{ color: "#10B981", fontSize: "20px", fontFamily: "sans-serif", margin: 0 }}>
            OUR STORY
          </p>
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "62px",
              fontFamily: "sans-serif",
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            The Team Behind the AI That Never Misses a Call
          </h1>
          <p style={{ color: "#6B7280", fontSize: "24px", fontFamily: "sans-serif", margin: 0 }}>
            Built by restaurant obsessives. Solving missed calls since day one.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "80px",
            background: "#1F2937",
            borderRadius: "999px",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#9CA3AF", fontSize: "18px", fontFamily: "sans-serif" }}>
            belan.tech
          </span>
        </div>
      </div>
    ),
    size
  );
}
