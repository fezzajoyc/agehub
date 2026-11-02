import type { ComponentType } from "react";
import type { CategoryId, Locale } from "@/lib/site";

/**
 * 每个工具一段五语文案,工具页 SEO 全部从这里派生:
 * title ← h1/tagline, meta description ← tagline, FAQ JSON-LD ← faqs。
 * 契约:vitest 校验每个 locale 的 name/h1/tagline 非空、steps ≥ 3、faqs ≥ 2。
 */
export type ToolCopy = {
  /** 列表页/导航里的短名,如 "Word Counter" */
  name: string;
  /** 页面 H1;省略时用 name */
  h1?: string;
  /** 一句话卖点,≈ meta description,110–160 字符 */
  tagline: string;
  /** 1–3 段介绍:这是什么、解决什么问题、和别的工具有何不同 */
  intro: string[];
  /** 使用步骤,3–4 步 */
  steps: string[];
  /** 2–4 条真实问答 */
  faqs: { q: string; a: string }[];
};

export type ToolDef = {
  /** 全站唯一,即 URL:/{lang}/tools/{slug}。kebab-case。 */
  slug: string;
  category: CategoryId;
  /** UI kit 里的图标键名 */
  icon: string;
  /** 首页"热门工具"位 */
  featured?: boolean;
  engine: {
    component: ComponentType<any>;
    props?: Record<string, unknown>;
  };
  /** 核心 5 语内联;扩展语言走 tools/_i18n 覆盖层,读取一律经 lib/tool-copy.ts toolCopy() */
  copy: { en: ToolCopy } & Partial<Record<Locale, ToolCopy>>;
  /** 同分类或相邻分类的内链目标(slug),3–6 个 */
  related: string[];
};

export function defineTool(def: ToolDef): ToolDef {
  return def;
}

/** "Found {n} tools" 之类的字典模板填充 */
export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
