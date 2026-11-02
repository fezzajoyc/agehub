import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import { dict, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import type { ToolDef } from "@/tools/_lib/types";
import { toolCopy } from "@/lib/tool-copy";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border hairline bg-[var(--color-card)] p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Pill({ children, tone = "sub" }: { children: ReactNode; tone?: "sub" | "accent" | "good" }) {
  const tones = {
    sub: "bg-[var(--color-surface)] text-[var(--color-sub)]",
    accent: "bg-[rgba(0,113,227,0.1)] text-[var(--color-accent-strong)]",
    good: "bg-[rgba(26,127,55,0.1)] text-[var(--color-good)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub ? <p className="mt-1 text-[15px] text-[var(--color-sub)]">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function ToolCard({
  tool,
  locale,
}: {
  tool: ToolDef;
  locale: Locale;
}) {
  const t = dict(locale);
  const c = toolCopy(tool, locale);
  const name = c.name;
  const tagline = c.tagline;
  return (
    <Link
      href={`/${locale}/tools/${tool.slug}`}
      className="group block rounded-2xl border hairline bg-[var(--color-card)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="mb-3 inline-flex rounded-xl bg-[var(--color-surface)] p-2.5 text-[var(--color-ink)]">
        <Icon name={tool.icon} size={20} />
      </div>
      <h3 className="font-semibold leading-tight">{name}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-5 text-[var(--color-sub)]">{tagline}</p>
      <p className="mt-3 text-[13px] font-medium text-[var(--color-accent-strong)] opacity-0 transition-opacity group-hover:opacity-100">
        {t.nav.tools} →
      </p>
    </Link>
  );
}

/** 引擎外层的统一卡:标题 + 隐私注记由工具页负责,这里只承载交互 */
export function ToolPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border hairline bg-[var(--color-card)] p-4 sm:p-6">{children}</div>;
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-3.5 text-[16px] leading-7 text-[var(--color-sub)]">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-[var(--color-sub)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--color-ink)]">
                {it.label}
              </Link>
            ) : (
              <span className="text-[var(--color-ink)]">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function D({ locale }: { locale: Locale }): Dictionary {
  return dict(locale);
}
