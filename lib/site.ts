export const SITE = {
  name: "AgeHub",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "https://zoyku.com",
  tagline: "120+ free browser tools",
  // 换品牌/域名只改这里 + dictionaries 里的 brand 字符串
} as const;

export const LOCALES = [
  "en", "zh", "ja", "es", "pt",
  "fr", "de", "ru", "it", "tr", "ko", "ar", "hi", "id", "vi",
] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_SET = new Set<string>(LOCALES);

export const CATEGORIES = ["utility", "text"] as const;
export type CategoryId = (typeof CATEGORIES)[number];
export const CATEGORY_SET = new Set<string>(CATEGORIES);

/** 从右到左书写的语言(html dir 属性用) */
export const RTL_LOCALES = new Set<string>(["ar"]);

export function isLocale(x: string): x is Locale {
  return LOCALE_SET.has(x);
}

export function isCategory(x: string): x is CategoryId {
  return CATEGORY_SET.has(x);
}

export function abs(path: string, locale?: Locale): string {
  return `${SITE.domain}${locale ? `/${locale}` : ""}${path}`;
}
