import { CATEGORIES } from "@/lib/site";
import { toolsByCategory } from "@/tools/registry";

export const dynamic = "force-static";

type Badge = { label: string; value: string; color: string };

const BADGES: Record<string, Badge> = {
  "made-with-zoyku": { label: "made with", value: "Zoyku", color: "#0071e3" },
  "zoyku": { label: "tools on", value: "Zoyku", color: "#1d1d1f" },
  "privacy-first": { label: "privacy", value: "first", color: "#1a7f37" },
  "no-upload": { label: "files", value: "stay local", color: "#0071e3" },
  "free-browser-tools": { label: "tools", value: "free in browser", color: "#7a4dd6" },
};

/** shields.io 风格扁平徽章:文字宽度按 Verdana 11px 估算 */
function svg(label: string, value: string, color: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lw = Math.round(6.9 * label.length + 14);
  const vw = Math.round(6.9 * value.length + 14);
  const w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}">
<title>${esc(label)}: ${esc(value)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="20" fill="#555"/>
<rect x="${lw}" width="${vw}" height="20" fill="${color}"/>
<rect width="${w}" height="20" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="14">${esc(label)}</text>
<text x="${lw + vw / 2}" y="14" font-weight="bold">${esc(value)}</text>
</g>
</svg>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant: raw } = await params;
  const variant = raw.replace(/\.svg$/, ""); // .svg 后缀可选,与通用款一致
  let badge = BADGES[variant];

  // 分类徽章:/badge/pdf-tools.svg → "19 free tools · PDF"
  if (!badge) {
    const cat = variant.replace(/-tools$/, "");
    if (CATEGORIES.includes(cat as never)) {
      const n = toolsByCategory(cat as never).length;
      badge = { label: cat, value: `${n} free tools`, color: "#0071e3" };
    }
  }
  if (!badge) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(svg(badge.label, badge.value, badge.color), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function generateStaticParams() {
  return [
    ...Object.keys(BADGES),
    ...CATEGORIES.map((c) => `${c}-tools`),
  ].map((variant) => ({ variant }));
}
