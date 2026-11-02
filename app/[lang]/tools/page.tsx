import type { Metadata } from "next";
import { dict, HTML_LANG } from "@/lib/i18n";
import { isLocale, LOCALES, type Locale } from "@/lib/site";
import { ALL_TOOLS } from "@/tools/registry";
import { toolCopy } from "@/lib/tool-copy";
import { Container, SectionHead } from "@/components/ui";
import { ToolsDirectory } from "@/components/tools-directory";
import { fill } from "@/tools/_lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dict(lang as Locale);
  const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/tools`]));
  return {
    title: t.tools.title,
    description: fill(t.tools.subtitle, { count: ALL_TOOLS.length }),
    alternates: {
      canonical: `/${lang}/tools`,
      languages: { ...languages, "x-default": "/en/tools" },
    },
  };
}

export default async function ToolsDirectoryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) return null;
  const locale = lang as Locale;
  const t = dict(locale);

  const list = ALL_TOOLS.map((tool) => ({
    slug: tool.slug,
    category: tool.category,
    icon: tool.icon,
    name: toolCopy(tool, locale).name,
    tagline: toolCopy(tool, locale).tagline,
  }));

  return (
    <Container className="py-10">
      <h1 className="h1">{t.tools.title}</h1>
      <p className="mt-2 max-w-2xl text-[16px] leading-6 text-[var(--color-sub)]">
        {fill(t.tools.subtitle, { count: ALL_TOOLS.length })}
      </p>
      <ToolsDirectory
        tools={list}
        labels={{
          filterPlaceholder: t.tools.filterPlaceholder,
          empty: t.tools.empty,
          categoryNames: Object.fromEntries(
            Object.entries(t.categories).map(([k, v]) => [k, v.name]),
          ),
          hrefLang: locale,
        }}
      />
    </Container>
  );
}
