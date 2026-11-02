import type { Metadata } from "next";
import { dict } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/i18n";
import { isLocale, LOCALES, SITE, type Locale } from "@/lib/site";
import { MCP_TOOLS } from "@/mcp/tools";
import { Container, Prose, SectionHead } from "@/components/ui";
import { CopyButton } from "@/components/client-ui";
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
  const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/mcp`]));
  return {
    title: "MCP server",
    description: "Connect AI assistants (Claude, Cursor, ChatGPT connectors) to Zoyku's calculators and converters via the Model Context Protocol.",
    alternates: { canonical: `/${lang}/mcp`, languages: { ...languages, "x-default": "/en/mcp" } },
  };
}

const INSTALL_LABELS: Record<Locale, string> = {
  en: "Add to your MCP client", zh: "添加到你的 MCP 客户端", ja: "MCP クライアントに追加",
  es: "Añadir a tu cliente MCP", pt: "Adicionar ao seu cliente MCP", fr: "Ajouter à votre client MCP",
  de: "Zu Ihrem MCP-Client hinzufügen", ru: "Добавьте в ваш MCP-клиент", it: "Aggiungi al tuo client MCP",
  tr: "MCP istemcinize ekleyin", ko: "MCP 클라이언트에 추가", ar: "أضفه إلى عميل MCP",
  hi: "अपने MCP क्लाइंट में जोड़ें", id: "Tambahkan ke klien MCP Anda", vi: "Thêm vào MCP client của bạn",
};

export default async function McpPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return null;
  const locale = lang as Locale;
  const t = dict(locale);

  const config = JSON.stringify(
    { mcpServers: { zoyku: { command: "npx", args: ["-y", "zoyku-mcp"] } } },
    null,
    2,
  );

  return (
    <Container className="max-w-3xl py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: `${SITE.name} MCP server`,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any (Node.js)",
          url: `${SITE.domain}/${locale}/mcp`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <SectionHead title={t.mcp?.title ?? "MCP server"} />
      <Prose paragraphs={[
        t.mcp?.desc1 ?? "",
        t.mcp?.desc2 ?? "",
      ].filter(Boolean)} />

      <div className="mt-8 rounded-2xl border hairline bg-white p-5">
        <h2 className="mb-2 font-semibold">{INSTALL_LABELS[locale]}</h2>
        <p className="mb-3 text-[13.5px] leading-5 text-[var(--color-sub)]">
          {t.mcp?.requiresNode ?? ""}
        </p>
        <div className="rounded-xl border hairline bg-[var(--color-ink)] p-4">
          <code className="mono block overflow-x-auto whitespace-pre text-[12px] leading-5 text-white">
            {config}
          </code>
        </div>
        <div className="mt-3">
          <CopyButton value={config} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="section-title mb-4">
          {t.mcp?.toolsTitle?.replace("{n}", String(MCP_TOOLS.length)) ?? `Tools (${MCP_TOOLS.length})`}
        </h2>
        <div className="overflow-hidden rounded-xl border hairline">
          <table className="w-full text-[14px]">
            <tbody>
              {MCP_TOOLS.map((tool, i) => (
                <tr key={tool.name} className={i % 2 ? "bg-[var(--color-surface)]" : ""}>
                  <td className="mono px-3.5 py-2 align-top text-[12.5px] font-semibold">{tool.name}</td>
                  <td className="px-3.5 py-2 text-[13px] leading-5 text-[var(--color-sub)]">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-8 text-[13px] leading-6 text-[var(--color-sub)]">
        {t.mcp?.privacy ?? ""}
      </p>
    </Container>
  );
}
