import { DEFAULT_LOCALE, LOCALES, SITE, isLocale, type Locale } from "./site";
import en from "./dictionaries/en";
import zh from "./dictionaries/zh";
import ja from "./dictionaries/ja";
import es from "./dictionaries/es";
import pt from "./dictionaries/pt";
import fr from "./dictionaries/fr";
import de from "./dictionaries/de";
import ru from "./dictionaries/ru";
import it from "./dictionaries/it";
import tr from "./dictionaries/tr";
import ko from "./dictionaries/ko";
import ar from "./dictionaries/ar";
import hi from "./dictionaries/hi";
import id from "./dictionaries/id";
import vi from "./dictionaries/vi";

export { isLocale };

export type Dictionary = typeof en;

const DICTS: Record<Locale, Dictionary> = {
  en, zh, ja, es, pt, fr, de, ru, it, tr, ko, ar, hi, id, vi,
};

export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja",
  es: "es",
  pt: "pt-BR",
  fr: "fr",
  de: "de",
  ru: "ru",
  it: "it",
  tr: "tr",
  ko: "ko",
  ar: "ar",
  hi: "hi",
  id: "id",
  vi: "vi",
};

export type Direction = "ltr" | "rtl";
export const DIR: Record<Locale, Direction> = {
  en: "ltr", zh: "ltr", ja: "ltr", es: "ltr", pt: "ltr",
  fr: "ltr", de: "ltr", ru: "ltr", it: "ltr", tr: "ltr",
  ko: "ltr", ar: "rtl", hi: "ltr", id: "ltr", vi: "ltr",
};

export function dict(locale: Locale): Dictionary {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

export function localePath(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

export function absUrl(locale: Locale, path: string): string {
  return `${SITE.domain}/${locale}${path}`;
}
