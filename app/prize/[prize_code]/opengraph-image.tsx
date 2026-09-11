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
  const fg = data.background_image_url ? "#ffffff" : textOn(brand);
  const name = data.restaurant_name || "Belan";
  const headline = data.state === "used" ? "Coupon already used" : data.state === "expired" ? "This offer has expired" : data.is_winner ? "You won! 🎉" : "A reward for you 🎁";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: brand,
          fontFamily: "sans-serif",
        }}
      >
        {data.background_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.background_image_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: data.background_image_url
              ? "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 100%)"
              : `linear-gradient(135deg, ${brand} 0%, rgba(0,0,0,0.35) 100%)`,
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 80px", color: fg, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
              }}
            >
              {data.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logo_url} alt="" style={{ width: 100, height: 100, objectFit: "contain" }} />
              ) : (
                <div style={{ fontSize: 64, display: "flex" }}>🎁</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30, opacity: 0.85, letterSpacing: 2, textTransform: "uppercase" }}>{name}</div>
              <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>{headline}</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 48,
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              padding: "18px 34px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.94)",
              color: "#111827",
              fontSize: 40,
              fontWeight: 800,
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            {prizeLabel(data)}
          </div>
          <div style={{ marginTop: 34, fontSize: 24, opacity: 0.8, display: "flex" }}>Tap to open your coupon · Powered by Belan</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
