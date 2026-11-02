import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { SITE, LOCALES, isLocale, isCategory, type Locale } from "@/lib/site";
import { ALL_TOOLS, TOOL_BY_SLUG } from "@/tools/registry";
import { toolCopy } from "@/lib/tool-copy";

export const dynamic = "force-static";

/**
 * AI 答案页:/{lang}/tools/{slug}.md
 * 把工具页内容输出为纯 Markdown,给 AI 搜索引擎和 agent 引用。
 */
export function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
) {
  return params.then(({ lang, slug }) => {
    const tool = TOOL_BY_SLUG.get(slug);
    if (!isLocale(lang) || !tool || !isCategory(tool.category)) notFound();
    const locale = lang as Locale;
    const c = toolCopy(tool, locale);
    const t = dict(locale);
    const url = `${SITE.domain}/${locale}/tools/${tool.slug}`;

    const md = [
      `# ${c.name}`,
      "",
      c.tagline,
      "",
      `- URL: ${url}`,
      `- Category: ${t.categories[tool.category].name}`,
      `- Price: free, no account required`,
      `- Privacy: runs entirely in the browser; user data never leaves the device`,
      "",
      "## What it does",
      "",
      ...c.intro.map((p) => `${p}\n`),
      "## How to use",
      "",
      ...c.steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      "## FAQ",
      "",
      ...c.faqs.map((f) => `### ${f.q}\n\n${f.a}\n`),
    ].join("\n");

    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  });
}

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) => ALL_TOOLS.map((tool) => ({ lang, slug: tool.slug })));
}
