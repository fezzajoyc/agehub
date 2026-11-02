import { ImageResponse } from "next/og";
import { CATEGORIES, LOCALES, SITE, isCategory } from "@/lib/site";
import { toolsByCategory } from "@/tools/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => CATEGORIES.map((cat) => ({ lang, cat })));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; cat: string }>;
}) {
  const { lang, cat } = await params;
  const name = cat.toUpperCase();
  const count = isCategory(cat) ? toolsByCategory(cat).length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #ffffff 0%, #f5f5f7 60%, #eef3fb 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1d1d1f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 64 64">
              <path d="M32 12l4.8 13.8L50.5 30l-13.7 4.6L32 48.5l-4.8-13.9L13.5 30l13.7-4.2L32 12Z" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#1d1d1f", letterSpacing: -1 }}>
            {SITE.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#1d1d1f", letterSpacing: -3, display: "flex" }}>
            {name}
          </div>
          <div style={{ fontSize: 34, color: "#6e6e73", display: "flex" }}>
            {count} free tools — no upload, no account
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#6e6e73" }}>{SITE.domain.replace("https://", "")}</div>
      </div>
    ),
    size,
  );
}
