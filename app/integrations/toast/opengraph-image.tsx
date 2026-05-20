import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Toast POS Voice AI Integration | Belan AI";
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

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "820px" }}>
          <p style={{ color: "#10B981", fontSize: "20px", fontFamily: "sans-serif", margin: 0 }}>
            INTEGRATION
          </p>
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "72px",
              fontFamily: "sans-serif",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Belan AI{"\n"}× Toast POS
          </h1>
          <p style={{ color: "#6B7280", fontSize: "26px", fontFamily: "sans-serif", margin: 0 }}>
            Every call answered · Every order fired to Toast
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "80px",
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#7C2D12",
              borderRadius: "999px",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#FCA5A5", fontSize: "18px", fontFamily: "sans-serif" }}>
              Toast POS
            </span>
          </div>
          <div
            style={{
              background: "#1F2937",
              borderRadius: "999px",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#9CA3AF", fontSize: "18px", fontFamily: "sans-serif" }}>
              $200/month flat
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
