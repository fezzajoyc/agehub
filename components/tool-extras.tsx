"use client";

import { useEffect } from "react";
import { trackRecent } from "./recent-tools";

export { trackRecent };
import { CopyButton } from "./client-ui";
import { SITE } from "@/lib/site";
import { Icon } from "./icons";

/** 工具页挂载时记录最近使用(首页"最近使用"条数据源)。 */
export function RecentTracker({
  slug,
  icon,
}: {
  slug: string;
  icon: string;
}) {
  useEffect(() => {
    trackRecent({ slug, icon });
  }, [slug, icon]);
  return null;
}

/** ?embed=1 时隐藏导航/页脚(iframe 小组件模式,外链钩子)。 */
export function EmbedGate({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("embed-mode");
    return () => document.body.classList.remove("embed-mode");
  }, [active]);
  return null;
}

/** iframe 嵌入代码 + 一键复制(自愿嵌入,外链钩子)。 */
export function ToolEmbedBox({
  slug,
  locale,
  labels,
}: {
  slug: string;
  locale: string;
  labels: { title: string; desc: string; copied: string; copy: string };
}) {
  const code = `<iframe src="${SITE.domain}/${locale}/tools/${slug}?embed=1" width="100%" height="640" style="border:0;border-radius:16px" title="Zoyku — ${slug}" loading="lazy"></iframe>`;
  return (
    <div className="rounded-2xl border hairline bg-[var(--color-surface)] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex rounded-xl bg-white p-2.5 text-[var(--color-accent)]">
          <Icon name="code" size={18} />
        </span>
        <div>
          <h3 className="font-semibold">{labels.title}</h3>
          <p className="mt-1 text-[13.5px] leading-5 text-[var(--color-sub)]">{labels.desc}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border hairline bg-white p-3">
        <code className="mono block overflow-x-auto whitespace-nowrap text-[11.5px] leading-5">
          {code}
        </code>
      </div>
      <div className="mt-2.5">
        <CopyButton value={code} label={labels.copy} />
      </div>
    </div>
  );
}
