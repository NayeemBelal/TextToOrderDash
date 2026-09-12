import { ImageResponse } from "next/og";
import { MARKETING_API_BASE_URL } from "@/lib/config";

// The link preview a customer sees under their coupon URL in iMessage /
// WhatsApp / Android Messages — generated per coupon from the restaurant's
// branding (logo, colour, hero photo) so every restaurant's texts unfurl in
// its own look. A restaurant can still override this with a static image
// via marketing_settings.og_image_url (see layout.tsx).
export const runtime = "edge";
export const alt = "Your reward";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface PrizeData {
  restaurant_name?: string;
  is_winner?: boolean;
  state?: string;
  prize_config?: { type?: string; itemName?: string; percent?: number };
  loser_discount?: number;
  logo_url?: string | null;
  brand_color?: string | null;
  background_image_url?: string | null;
}

function darken(hex: string, amount = 0.18): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function textOn(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
  const n = parseInt(h, 16);
  const L = (0.299 * ((n >> 16) & 0xff) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

function prizeLabel(d: PrizeData): string {
  if (d.is_winner) {
    if (d.prize_config?.type === "free-item") return `Free ${d.prize_config.itemName || "item"}`;
    return `${d.prize_config?.percent ?? 10}% off your order`;
  }
  return `${d.loser_discount ?? 10}% off your next order`;
}

export default async function Image({ params }: { params: Promise<{ prize_code: string }> }) {
  const { prize_code } = await params;
  let data: PrizeData = {};
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/prize/${prize_code}`, { cache: "no-store" });
    if (res.ok) data = (await res.json()) as PrizeData;
  } catch {
    /* fall back to the generic card */
  }

  const brand =
    data.brand_color && /^#?[0-9a-fA-F]{6}$/.test(data.brand_color)
      ? data.brand_color.startsWith("#") ? data.brand_color : `#${data.brand_color}`
      : "#1e293b";
  const fg = textOn(brand);
  const name = data.restaurant_name || "Belan";
  const headline = data.state === "used" ? "Coupon already used" : data.state === "expired" ? "This offer has expired" : data.is_winner ? "You won! 🎉" : "A reward for you 🎁";

  // Layout: a solid brand-coloured panel carries the text (always readable,
  // whatever the photo looks like); the hero photo sits in a rounded inset on
  // the right. Keeping the photo to ~40% of the canvas also keeps the PNG
  // small enough for messaging apps to fetch quickly. Satori needs explicit
  // top/left/width/height rather than the `inset` shorthand.
  const photo = data.background_image_url || null;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${brand} 0%, ${darken(brand, 0.35)} 100%)`,
          fontFamily: "sans-serif",
          color: fg,
        }}
      >
        {photo ? (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              width: 440,
              height: 550,
              borderRadius: 36,
              overflow: "hidden",
              display: "flex",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" style={{ width: 440, height: 550, objectFit: "cover" }} />
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: photo ? 700 : 1200,
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
                overflow: "hidden",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              {data.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logo_url} alt="" style={{ width: 90, height: 90, objectFit: "contain" }} />
              ) : (
                <div style={{ fontSize: 58, display: "flex" }}>🎁</div>
              )}
            </div>
            <div style={{ fontSize: 28, opacity: 0.9, letterSpacing: 2, textTransform: "uppercase", display: "flex" }}>{name}</div>
          </div>
          <div style={{ fontSize: photo ? 60 : 72, fontWeight: 800, lineHeight: 1.05, marginTop: 30, display: "flex" }}>{headline}</div>
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
            {prizeLabel(data)}
          </div>
          <div style={{ marginTop: 28, fontSize: 22, opacity: 0.85, display: "flex" }}>Tap to open your coupon · Powered by Belan</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
