import { ImageResponse } from "next/og";
import { LOCALES, SITE, isLocale } from "@/lib/site";
import { ALL_TOOLS } from "@/tools/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function OgImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  isLocale(lang); // 每语言一张,但图内文案固定英文(Satori 默认字体排不了 CJK/阿拉伯文)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: "linear-gradient(135deg, #ffffff 0%, #f5f5f7 55%, #eef3fb 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#1d1d1f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="52" height="52" viewBox="0 0 64 64">
            <path d="M32 12l4.8 13.8L50.5 30l-13.7 4.6L32 48.5l-4.8-13.9L13.5 30l13.7-4.2L32 12Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, color: "#1d1d1f", letterSpacing: -4, display: "flex" }}>
          {`${ALL_TOOLS.length}+ free browser tools`}
        </div>
        <div style={{ fontSize: 36, color: "#6e6e73", display: "flex" }}>Your files never leave your device</div>
        <div style={{ fontSize: 28, color: "#1a7f37", fontWeight: 600, display: "flex" }}>
          {SITE.domain.replace("https://", "")}
        </div>
      </div>
    ),
    size,
  );
}
