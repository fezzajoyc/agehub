import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { metaTitle } from "@/lib/meta";
import { notFound } from "next/navigation";
import "../globals.css";
import { dict, DIR, HTML_LANG } from "@/lib/i18n";
import { LOCALES, SITE, isLocale, type Locale } from "@/lib/site";
import { I18nProvider } from "@/components/i18n-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/jsonld";

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
  const t = dict(lang);
  const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}`]));
  return {
    metadataBase: new URL(SITE.domain),
    title: {
      default: metaTitle(SITE.name, t.tagline),
      template: `%s | ${SITE.name}`,
    },
    description: t.metaDesc,
    alternates: {
      canonical: `/${lang}`,
      languages: { ...languages, "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: metaTitle(SITE.name, t.tagline),
      description: t.metaDesc,
      locale: HTML_LANG[lang],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = dict(locale);

  return (
    <html lang={HTML_LANG[locale] ?? HTML_LANG.en} dir={DIR[locale] ?? "ltr"}>
      <body>
      {/* 主题恢复:阻塞式,防暗色 FOUC */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`,
        }}
      />
        {/* 滚动入场动画的 JS 门控:无 JS 时 .reveal 内容始终可见 */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <I18nProvider locale={locale} dict={t}>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.domain,
              inLanguage: HTML_LANG[locale] ?? HTML_LANG.en,
              potentialAction: undefined,
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              url: SITE.domain,
            }}
          />
          <Nav />
          <main>{children}</main>
          <Footer />
          <Analytics />
        </I18nProvider>
    </body>
    </html>
  );
}
