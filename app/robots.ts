import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * 收录面 = 官方内容面。AI 爬虫点名放行(它们在给 AI 搜索引擎喂数据),
 * 纯客户端工具页对抓取无成本顾虑。
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "meta-externalagent",
  "meta-externalfetcher",
  "YouBot",
  "DuckAssistBot",
  "cohere-ai",
  "PetalBot",
  "Kangaroo Bot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE.domain}/sitemap.xml`,
    host: SITE.domain,
  };
}
