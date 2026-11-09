import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const pixels = size === "192" ? 192 : size === "512" ? 512 : null;
  if (!pixels) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #142B55, #06132E)", borderRadius: pixels * 0.22 }}>
        <svg width="82%" height="82%" viewBox="0 0 512 512">
          <defs>
            <linearGradient id="gold" x1="90" y1="80" x2="410" y2="430" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F8E7A0" />
              <stop offset=".48" stopColor="#D6B34D" />
              <stop offset="1" stopColor="#A87918" />
            </linearGradient>
          </defs>
          <path d="M256 61 408 116v116c0 103-61 171-152 219-91-48-152-116-152-219V116L256 61Z" fill="#071631" stroke="url(#gold)" strokeWidth="18" strokeLinejoin="round" />
          <path d="m164 300 66-66 48 48 88-104" fill="none" stroke="#FFF1C2" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M317 178h49v49" fill="none" stroke="#FFF1C2" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M163 337h186" stroke="#E7C86C" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: pixels, height: pixels }
  );
}
