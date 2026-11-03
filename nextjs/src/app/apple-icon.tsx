import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #0b2452, #061331)", borderRadius: 38 }}>
        <div style={{ width: 142, height: 142, borderRadius: 80, border: "8px solid #f6b813", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", color: "#f6b813" }}>
          <svg width="108" height="108" viewBox="0 0 48 48">
            <path d="M8 35V27M18 35V20M28 35V15M38 35V8" stroke="#f6b813" strokeWidth="4" strokeLinecap="round" />
            <path d="M7 18 18 13 26 17 40 5" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 5h8v8" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
