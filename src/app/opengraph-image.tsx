import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #07271b 0%, #0d3b2a 55%, #124834 100%)",
          padding: 80,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 34, color: "#ffffff", letterSpacing: -0.5 }}>So</span>
          <span style={{ width: 2, height: 38, background: "#c6a86b" }} />
          <span style={{ fontSize: 34, color: "#c6a86b", letterSpacing: -0.5 }}>Fresh</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, color: "#ffffff", lineHeight: 1.05, maxWidth: 900 }}>
            Cleaned properly. Not just made to look clean.
          </div>
          <div style={{ fontSize: 30, color: "rgba(234,223,199,0.82)", fontFamily: "system-ui, sans-serif" }}>
            Restoration deep cleaning across Essex and Suffolk
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 24, color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif" }}>
          <span>sofreshcleaning.co.uk</span>
          <span>Colchester · Ipswich · Braintree · Clacton</span>
        </div>
      </div>
    ),
    size,
  );
}
