import { ImageResponse } from "next/og";
import { MARKETING_API_BASE_URL } from "@/lib/config";

// Link-preview image for the landing-page demo coupon: the same layout the
// real /prize preview uses, in the fictional Stack & Smash Burgers branding.
export const runtime = "edge";
export const alt = "Your reward from Stack & Smash Burgers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#e11d48"; // Stack & Smash red
const BRAND_DARK = "#9f1239";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let won = code.startsWith("WIN");
  let label = "Your reward is inside";
  let name = "Stack & Smash Burgers";
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/marketing/demo/prize/${code}`, { cache: "no-store" });
    if (res.ok) {
      const d = (await res.json()) as { is_winner?: boolean; prize_label?: string; restaurant_name?: string };
      won = !!d.is_winner;
      if (d.prize_label) label = d.prize_label;
      if (d.restaurant_name) name = d.restaurant_name;
    }
  } catch {
    /* generic card */
  }
  const headline = won ? "You won! 🎉" : "A treat for you 🎁";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Big burger on the right, standing in for a restaurant's food photo. */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 440,
            height: 550,
            borderRadius: 36,
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 300,
            boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          }}
        >
          🍔
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 700,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: 999,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 60,
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              🍔
            </div>
            <div style={{ fontSize: 28, opacity: 0.9, letterSpacing: 2, textTransform: "uppercase", display: "flex" }}>{name}</div>
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, marginTop: 30, display: "flex" }}>{headline}</div>
          <div
            style={{
              marginTop: 30,
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              padding: "16px 30px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.95)",
              color: "#111827",
              fontSize: 36,
              fontWeight: 800,
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            {label}
          </div>
          <div style={{ marginTop: 28, fontSize: 22, opacity: 0.85, display: "flex" }}>Tap to open your coupon · Powered by Belan</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
