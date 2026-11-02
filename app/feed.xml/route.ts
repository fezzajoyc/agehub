import { CATEGORIES, SITE } from "@/lib/site";
import { ALL_TOOLS, toolsByCategory } from "@/tools/registry";

export const dynamic = "force-static";

/** RSS:精选工具 + 分类集合,条目描述用工具 tagline(全语言 en) */
export function GET() {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const now = new Date().toUTCString();

  const items: string[] = [];
  for (const cat of CATEGORIES) {
    const tools = toolsByCategory(cat);
    items.push(
      `    <item>
      <title>${esc(`Zoyku ${cat} tools — ${tools.length} free, no upload`)}</title>
      <link>${SITE.domain}/en/categories/${cat}</link>
      <guid isPermaLink="true">${SITE.domain}/en/categories/${cat}</guid>
      <description>${esc(tools.map((t) => t.copy.en.name).slice(0, 10).join(", "))}…</description>
    </item>`,
    );
  }
  for (const tool of ALL_TOOLS.filter((t) => t.featured)) {
    items.push(
      `    <item>
      <title>${esc(tool.copy.en.name)}</title>
      <link>${SITE.domain}/en/tools/${tool.slug}</link>
      <guid isPermaLink="true">${SITE.domain}/en/tools/${tool.slug}</guid>
      <description>${esc(tool.copy.en.tagline)}</description>
    </item>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)} — free browser tools</title>
    <link>${SITE.domain}/en</link>
    <description>${ALL_TOOLS.length} free tools that run entirely in your browser. Files never leave your device.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
