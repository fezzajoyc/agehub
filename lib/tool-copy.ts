import type { Locale } from "@/lib/site";
import type { ToolCopy, ToolDef } from "@/tools/_lib/types";
import { OVERLAYS } from "@/tools/_i18n";
import { categoryFaqPool } from "@/tools/_lib/category-faqs";

/**
 * 工具文案统一取词:核心 5 语在工具文件内,扩展语言走 tools/_i18n 覆盖层,
 * 都没有则回退英文。全站唯一入口——不要再直接读 tool.copy[locale]。
 *
 * FAQ 不足 6 条时用类目池补齐(去重按 q 小写比较),渲染与 FAQPage JSON-LD 同源。
 */
export function toolCopy(tool: ToolDef, locale: Locale): ToolCopy {
  const base = tool.copy[locale] ?? OVERLAYS[locale]?.[tool.slug] ?? tool.copy.en;
  return withCategoryFaqs(base, tool.category, locale);
}

/** 已有 FAQ 按问题文本去重后,补足到 ≥{min} 条 */
export function withCategoryFaqs(
  copy: ToolCopy,
  category: ToolDef["category"],
  locale: Locale,
  min = 6,
): ToolCopy {
  if (copy.faqs.length >= min) return copy;
  const seen = new Set(copy.faqs.map((f) => f.q.trim().toLowerCase()));
  const merged = [...copy.faqs];
  for (const f of categoryFaqPool(category, locale)) {
    if (merged.length >= min) break;
    const k = f.q.trim().toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(f);
    }
  }
  return merged.length > copy.faqs.length ? { ...copy, faqs: merged } : copy;
}

export function hasNativeCopy(tool: ToolDef, locale: Locale): boolean {
  return Boolean(tool.copy[locale] ?? OVERLAYS[locale]?.[tool.slug]);
}
