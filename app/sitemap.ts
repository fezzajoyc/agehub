import type { MetadataRoute } from "next";
import { LOCALES, SITE, CATEGORIES } from "@/lib/site";
import { ALL_TOOLS } from "@/tools/registry";

/** 每条 URL 带全部 hreflang 替代,中文/日文等路径与 canonical 一一对应 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = LOCALES.map((lang) => ({
    url: `${SITE.domain}/${lang}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE.domain}/${l}`])),
    },
  }));

  const directory: MetadataRoute.Sitemap = LOCALES.map((lang) => ({
    url: `${SITE.domain}/${lang}/tools`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categories: MetadataRoute.Sitemap = LOCALES.flatMap((lang) =>
    CATEGORIES.map((cat) => ({
      url: `${SITE.domain}/${lang}/categories/${cat}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const tools: MetadataRoute.Sitemap = LOCALES.flatMap((lang) =>
    ALL_TOOLS.map((tool) => ({
      url: `${SITE.domain}/${lang}/tools/${tool.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: tool.featured ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${SITE.domain}/${l}/tools/${tool.slug}`]),
        ),
      },
    })),
  );

  return [...home, ...directory, ...categories, ...tools];
}
