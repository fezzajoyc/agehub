"use client";

import Link from "next/link";
import { useI18n } from "./i18n-provider";
import { CATEGORIES } from "@/lib/site";

export function Footer() {
  const { locale, t } = useI18n();
  return (
    <footer className="mt-16 border-t hairline bg-[var(--color-surface)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-semibold">Zoyku</p>
          <p className="mt-2 max-w-xs text-[13px] leading-5 text-[var(--color-sub)]">{t.footer.line}</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold">{t.nav.categories}</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-[var(--color-sub)]">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/${locale}/categories/${c}`} className="hover:text-[var(--color-ink)]">
                  {t.categories[c].name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold">{t.nav.about}</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-[var(--color-sub)]">
            <li><Link href={`/${locale}/about`} className="hover:text-[var(--color-ink)]">{t.footer.about}</Link></li>
            <li><Link href={`/${locale}/privacy`} className="hover:text-[var(--color-ink)]">{t.footer.privacy}</Link></li>
            <li><Link href={`/${locale}/terms`} className="hover:text-[var(--color-ink)]">{t.footer.terms}</Link></li>
            <li><Link href={`/${locale}/tools`} className="hover:text-[var(--color-ink)]">{t.nav.tools}</Link></li>
            <li><Link href={`/${locale}/mcp`} className="hover:text-[var(--color-ink)]">MCP</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline py-4 text-center text-[12px] text-[var(--color-sub)]">
        © {new Date().getFullYear()} Zoyku
      </div>
    </footer>
  );
}
