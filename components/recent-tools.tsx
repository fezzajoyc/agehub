"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { ALL_TOOLS, TOOL_BY_SLUG } from "@/tools/registry";
import { toolCopy } from "@/lib/tool-copy";
import type { Locale } from "@/lib/site";

export type RecentItem = { slug: string; icon: string };

const KEY = "zoyku-recent";

/** 工具页挂载时记录访问(去重、最多 8 条)。只存 slug/icon,名称渲染时按当前语言取——跨语言切换不串字。 */
export function trackRecent(item: RecentItem) {
  try {
    const list: RecentItem[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [item, ...list.filter((x) => x.slug !== item.slug)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式下静默 */
  }
}

/** 首页"最近使用"条:有记录才渲染。 */
export function RecentTools({ locale }: { locale: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw: RecentItem[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      // 兼容旧记录(带 name 字段):剥掉即可,slug 不变
      setItems(raw.map(({ slug, icon }) => ({ slug, icon })).filter((x) => TOOL_BY_SLUG.has(x.slug)));
    } catch {
      /* ignore */
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-sub)]">
        {RECENT_LABEL[locale] ?? RECENT_LABEL.en}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((it) => {
          const tool = TOOL_BY_SLUG.get(it.slug)!;
          const c = toolCopy(tool, locale as Locale);
          return (
            <Link
              key={it.slug}
              href={`/${locale}/tools/${it.slug}`}
              className="recent-pill inline-flex items-center gap-2 rounded-full border hairline bg-[var(--color-card)] px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--color-surface)]"
            >
              <Icon name={it.icon} size={14} className="text-[var(--color-accent)]" />
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const RECENT_LABEL: Record<string, string> = {
  en: "Recently used",
  zh: "最近使用",
  ja: "最近使ったツール",
  es: "Usadas recientemente",
  pt: "Usadas recentemente",
  fr: "Utilisés récemment",
  de: "Zuletzt verwendet",
  ru: "Недавние инструменты",
  it: "Usati di recente",
  tr: "Son kullanılanlar",
  ko: "최근 사용",
  ar: "المستخدمة مؤخراً",
  hi: "हाल में उपयोग किए गए",
  id: "Baru digunakan",
  vi: "Vừa sử dụng",
};
