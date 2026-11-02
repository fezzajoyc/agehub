import type { Locale } from "@/lib/site";
import type { ToolCopy, ToolDef } from "@/tools/_lib/types";
import { OVERLAYS } from "@/tools/_i18n";

/**
 * 工具文案统一取词:核心 5 语在工具文件内,扩展语言走 tools/_i18n 覆盖层,
 * 都没有则回退英文。全站唯一入口——不要再直接读 tool.copy[locale]。
 */
export function toolCopy(tool: ToolDef, locale: Locale): ToolCopy {
  return tool.copy[locale] ?? OVERLAYS[locale]?.[tool.slug] ?? tool.copy.en;
}

export function hasNativeCopy(tool: ToolDef, locale: Locale): boolean {
  return Boolean(tool.copy[locale] ?? OVERLAYS[locale]?.[tool.slug]);
}
