"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CopyButton } from "@/components/client-ui";
import { ToolPanel } from "@/components/ui";

// PLACEHOLDER 种子引擎:保证脚手架可构建。上线前随种子工具一起删除。
export function SeedEngine() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  return (
    <ToolPanel>
      <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.common.input} aria-label={t.common.input} />
      <textarea className="field mono mt-3 bg-[var(--color-surface)]" rows={4} value={[...text].reverse().join("")} readOnly aria-label={t.common.output} />
      <div className="mt-3">
        <CopyButton value={[...text].reverse().join("")} />
      </div>
    </ToolPanel>
  );
}
