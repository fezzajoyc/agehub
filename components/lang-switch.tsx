"use client";

import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "./i18n-provider";
import { LOCALES } from "@/lib/site";

const NATIVE: Record<string, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  it: "Italiano",
  tr: "Türkçe",
  ko: "한국어",
  ar: "العربية",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
};

/** 把当前路径的 locale 段替换为目标语言,保留其余路径 */
export function LangSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <label className="flex flex-none items-center text-[13px] text-[var(--color-sub)]">
      <span className="sr-only">{t.nav.language}</span>
      <select
        className="rounded-lg border hairline bg-white px-2 py-1.5"
        value={locale}
        onChange={(e) => {
          const next = `/${e.target.value}${rest ? `/${rest}` : ""}`;
          router.push(next);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {NATIVE[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
