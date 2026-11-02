import type { Metadata } from "next";
import { dict, HTML_LANG } from "@/lib/i18n";
import { isLocale, LOCALES, SITE, type Locale } from "@/lib/site";
import { BadgeEmbed } from "@/components/badge-embed";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dict(lang as Locale);
  const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/badge`]));
  return {
    title: t.badge.title,
    description: t.badge.desc,
    alternates: { canonical: `/${lang}/badge`, languages: { ...languages, "x-default": "/en/badge" } },
  };
}

const VARIANTS = ["made-with-zoyku", "privacy-first", "no-upload", "free-browser-tools", "zoyku"];

export default async function BadgePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return null;
  const locale = lang as Locale;
  const t = dict(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="h1">{t.badge.title}</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-sub)]">{t.badge.desc}</p>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--color-sub)]">{t.badge.voluntary}</p>

      <div className="mt-10 space-y-8">
        {VARIANTS.map((variant) => (
          <BadgeEmbed key={variant} variant={variant} locale={locale} copyLabels={{ md: t.badge.md, html: t.badge.html, copied: t.common.copied, copy: t.common.copy }} />
        ))}
      </div>

      <p className="mt-12 text-[13px] leading-6 text-[var(--color-sub)]">{t.badge.thanks}</p>
    </div>
  );
}
