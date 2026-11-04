import type { Metadata } from "next";
import { metaTitle } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict, HTML_LANG } from "@/lib/i18n";
import { LOCALES, SITE, isCategory, isLocale, type Locale } from "@/lib/site";
import { ALL_TOOLS, TOOL_BY_SLUG, relatedTools } from "@/tools/registry";
import { toolCopy } from "@/lib/tool-copy";
import { Breadcrumb, Container, Prose, SectionHead, ToolCard, Pill } from "@/components/ui";
import { Icon } from "@/components/icons";
import { JsonLd } from "@/components/jsonld";
import { trackRecent, ToolEmbedBox, EmbedGate, RecentTracker } from "@/components/tool-extras";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => ALL_TOOLS.map((tool) => ({ lang, slug: tool.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const tool = TOOL_BY_SLUG.get(slug);
  if (!isLocale(lang) || !tool) return {};
  const c = toolCopy(tool, lang);
  // SERP 差异化后缀:竞品标题都堆 "online free",我们把隐私 USP 打进每条结果
  const USP: Partial<Record<Locale, string>> = {
    en: "Free, No Upload",
    zh: "免费·不上传",
    ja: "無料・アップロード不要",
    es: "Gratis, sin subidas",
    pt: "Grátis, sem envios",
    fr: "Gratuit, sans envoi",
    de: "Kostenlos, ohne Upload",
    ru: "Бесплатно, без загрузки",
    it: "Gratis, senza upload",
    tr: "Ücretsiz, yüklemesiz",
    ko: "무료 · 업로드 없음",
    ar: "مجاناً بلا رفع",
    hi: "मुफ़्त, कोई अपलोड नहीं",
    id: "Gratis, tanpa unggah",
    vi: "Miễn phí, không tải lên",
  };
  const languages = Object.fromEntries(
    LOCALES.map((l) => [HTML_LANG[l], `/${l}/tools/${tool.slug}`]),
  );
  return {
    title: metaTitle(c.h1 ?? c.name, USP[lang] ?? USP.en!),
    description: c.tagline,
    alternates: {
      canonical: `/${lang}/tools/${tool.slug}`,
      languages: { ...languages, "x-default": `/en/tools/${tool.slug}` },
    },
    openGraph: {
      title: c.h1 ?? c.name,
      description: c.tagline,
      url: `/${lang}/tools/${tool.slug}`,
      type: "website",
    },
  };
}

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const tool = TOOL_BY_SLUG.get(slug);
  if (!tool || !isCategory(tool.category)) notFound();

  const t = dict(locale);
  const c = toolCopy(tool, locale);
  const categoryName = t.categories[tool.category].name;
  const related = relatedTools(tool);
  const url = `${SITE.domain}/${locale}/tools/${tool.slug}`;
  const Engine = tool.engine.component;
  const sp = (await searchParams) as { embed?: string } | undefined;
  const embed = sp?.embed === "1";

  return (
    <Container className="py-10 sm:py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: c.name,
            description: c.tagline,
            url,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any (browser)",
            browserRequirements: "Requires JavaScript",
            inLanguage: HTML_LANG[locale] ?? HTML_LANG.en,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.domain}/${locale}` },
              {
                "@type": "ListItem",
                position: 2,
                name: categoryName,
                item: `${SITE.domain}/${locale}/categories/${tool.category}`,
              },
              { "@type": "ListItem", position: 3, name: c.name, item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: c.name,
            description: c.tagline,
            step: c.steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: `Step ${i + 1}`,
              text: s,
              url: `${url}#step-${i + 1}`,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: c.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <Breadcrumb
        items={[
          { label: SITE.name, href: `/${locale}` },
          { label: categoryName, href: `/${locale}/categories/${tool.category}` },
          { label: c.name },
        ]}
      />

      <div className="mb-6 flex items-start gap-4">
        <span className="hidden rounded-2xl bg-[var(--color-surface)] p-3.5 text-[var(--color-ink)] sm:inline-flex">
          <Icon name={tool.icon} size={28} />
        </span>
        <div>
          <h1 className="h1">{c.h1 ?? c.name}</h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-6 text-[var(--color-sub)]">{c.tagline}</p>
        </div>
      </div>

      <EmbedGate active={embed} />
      <Engine {...tool.engine.props} />
      <RecentTracker slug={tool.slug} icon={tool.icon} />

      <p className="mt-4 flex items-start gap-2 text-[13px] leading-5 text-[var(--color-sub)]">
        <Icon name="lock" size={15} className="mt-0.5 flex-none text-[var(--color-good)]" />
        {t.tool.privacyNote}
      </p>

      <section className="mt-12 max-w-3xl">
        <SectionHead title={t.tool.howTo} />
        <ol className="space-y-3">
          {c.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15.5px] leading-6">
              <span className="mono mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-surface)] text-[13px] font-semibold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 max-w-3xl">
        <SectionHead title={c.name} />
        <Prose paragraphs={c.intro} />
      </section>

      <section className="mt-12 max-w-3xl">
        <SectionHead title={t.tool.faq} />
        <div>
          {c.faqs.map((f, i) => (
            <details key={i} className="faq" open={i === 0}>
              <summary>{f.q}</summary>
              <p className="faq-a">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHead
            title={t.tool.related}
            right={
              <Link
                href={`/${locale}/categories/${tool.category}`}
                className="text-[13.5px] font-medium text-[var(--color-accent-strong)]"
              >
                {t.tool.backToCategory.replace("{category}", categoryName)} →
              </Link>
            }
          />
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ToolCard key={r.slug} tool={r} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {!embed && (
        <section className="mt-12 max-w-3xl">
          <ToolEmbedBox slug={tool.slug} locale={locale} labels={{ title: t.embed?.title ?? "Embed this tool", desc: t.embed?.desc ?? "", copied: t.common.copied, copy: t.common.copy }} />
        </section>
      )}

      <div className="mt-10">
        <Pill tone="good">
          <Icon name="check" size={13} />
          100% {locale === "zh" ? "本地处理" : locale === "ja" ? "ローカル処理" : "local processing"}
        </Pill>
      </div>
    </Container>
  );
}
