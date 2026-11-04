"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";
import { Icon } from "./icons";

type Labels = { md: string; html: string; copied: string; copy: string };

/** 徽章预览 + MD/HTML 嵌入码一键复制(自愿嵌入,链接回 Zoyku) */
export function BadgeEmbed({
  variant,
  locale,
  copyLabels,
}: {
  variant: string;
  locale: string;
  copyLabels: Labels;
}) {
  const [copied, setCopied] = useState<"md" | "html" | null>(null);
  const src = `${SITE.domain}/badge/${variant}.svg`;
  const href = `${SITE.domain}/${locale}`;
  const md = `[![Zoyku](${src})](${href})`;
  const html = `<a href="${href}" target="_blank" rel="noopener"><img src="${src}" alt="Zoyku — free browser tools" width="150" height="20"></a>`;

  const copy = async (kind: "md" | "html") => {
    const text = kind === "md" ? md : html;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="rounded-2xl border hairline bg-white p-5 dark:bg-[var(--color-card)]">
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/badge/${variant}.svg`} alt={`Zoyku badge ${variant}`} height={20} />
        <code className="mono ml-auto text-[12px] text-[var(--color-sub)]">/badge/{variant}.svg</code>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {(["md", "html"] as const).map((kind) => (
          <div key={kind} className="rounded-xl border hairline p-3">
            <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-sub)]">
              {kind === "md" ? copyLabels.md : copyLabels.html}
            </p>
            <code className="mono block overflow-x-auto whitespace-nowrap text-[11.5px] leading-5 text-[var(--color-ink)]">
              {kind === "md" ? md : html}
            </code>
            <button
              type="button"
              onClick={() => copy(kind)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1 text-[12.5px] font-medium transition-colors hover:bg-[var(--color-surface)]"
            >
              <Icon name={copied === kind ? "check" : "file"} size={13} />
              {copied === kind ? copyLabels.copied : copyLabels.copy}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
