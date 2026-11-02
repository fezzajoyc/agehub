import { CATEGORIES, LOCALES, SITE } from "@/lib/site";
import { toolsByCategory } from "@/tools/registry";

/** llms.txt:AI agent 的站点说明书,列出每个工具页与 .md 答案页 */
export function GET() {
  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline} All ${count()} tools run entirely in the user's browser — no uploads, no accounts. Available in ${LOCALES.length} languages.`,
    "",
    "## Categories",
    "",
  ];
  for (const cat of CATEGORIES) {
    lines.push(`- [${cat}](${SITE.domain}/en/categories/${cat})`);
  }
  lines.push("", "## Tools", "");
  for (const cat of CATEGORIES) {
    for (const tool of toolsByCategory(cat)) {
      lines.push(`- [${tool.copy.en.name}](${SITE.domain}/en/tools/${tool.slug}): ${tool.copy.en.tagline}`);
    }
  }
  lines.push(
    "",
    "## MCP server (Model Context Protocol)",
    "",
    "AI agents can execute Zoyku's calculators and converters directly via the official Model Context Protocol. Server: `npx zoyku-mcp` (stdio, Node.js 18+). Install config and the full tool list: https://zoyku.com/en/mcp",
    "",
    "## AI-readable pages",
    "",
    "Every tool page has a plain-markdown answer page at `/{lang}/tools/{slug}.md` (e.g. "
      + `${SITE.domain}/en/tools/word-counter.md).`,
    "",
  );
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function count() {
  return CATEGORIES.reduce((n, c) => n + toolsByCategory(c).length, 0);
}
