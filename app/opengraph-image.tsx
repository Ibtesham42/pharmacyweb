import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — Pharmacy & Medical Jobs in India`;

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
          padding: "80px",
          background: "linear-gradient(135deg, #0d9488 0%, #0b5d57 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>
          {`💊 ${siteConfig.name}`}
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, marginTop: 24, lineHeight: 1.1 }}>
          {"Pharmacy & Medical Jobs in India"}
        </div>
        <div style={{ fontSize: 32, marginTop: 24, opacity: 0.9, maxWidth: 900 }}>
          {"Jobs · Medical News · Articles · Study Material"}
        </div>
      </div>
    ),
    size,
  );
}
