import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict, HTML_LANG } from "@/lib/i18n";
import { CATEGORIES, isCategory, isLocale, LOCALES, type Locale } from "@/lib/site";
import { toolsByCategory } from "@/tools/registry";
import { Breadcrumb, Container, SectionHead, ToolCard } from "@/components/ui";
import { JsonLd } from "@/components/jsonld";
import { SITE } from "@/lib/site";
import { fill } from "@/tools/_lib/types";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => CATEGORIES.map((cat) => ({ lang, cat })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; cat: string }>;
}): Promise<Metadata> {
  const { lang, cat } = await params;
  if (!isLocale(lang) || !isCategory(cat)) return {};
  const t = dict(lang as Locale);
  const count = toolsByCategory(cat).length;
  const name = t.categories[cat].name;
  const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/categories/${cat}`]));
  return {
    title: `${name} — ${fill(t.tools.count, { count })}`,
    description: t.categories[cat].desc,
    alternates: {
      canonical: `/${lang}/categories/${cat}`,
      languages: { ...languages, "x-default": `/en/categories/${cat}` },
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; cat: string }>;
}) {
  const { lang, cat } = await params;
  if (!isLocale(lang) || !isCategory(cat)) notFound();
  const locale = lang as Locale;
  const t = dict(locale);
  const tools = toolsByCategory(cat);
  const others = CATEGORIES.filter((c) => c !== cat);

  return (
    <Container className="py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.categories[cat].name,
          description: t.categories[cat].desc,
          url: `${SITE.domain}/${locale}/categories/${cat}`,
        }}
      />
      <Breadcrumb
        items={[
          { label: "Zoyku", href: `/${locale}` },
          { label: t.categories[cat].name },
        ]}
      />
      <h1 className="h1">{t.categories[cat].name}</h1>
      <p className="mt-2 max-w-2xl text-[16px] leading-6 text-[var(--color-sub)]">
        {t.categories[cat].desc}
      </p>

      <div className="mt-8">
        <SectionHead title={fill(t.tools.count, { count: tools.length })} />
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} locale={locale} />
          ))}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold text-[var(--color-sub)]">{t.nav.categories}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((c) => (
            <Link
              key={c}
              href={`/${locale}/categories/${c}`}
              className="rounded-full border hairline px-3.5 py-1.5 text-[13.5px] transition-colors hover:bg-[var(--color-surface)]"
            >
              {t.categories[c].name}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
