import {
  cleanText,
  dedupeLines,
  htmlBeautify,
  htmlMinify,
  cssMinify,
  jsMinify,
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  removeExtraSpaces,
  reverseText,
  sortLines,
  slugify,
  xmlFormat,
  xmlValidate,
} from "./transforms";

/**
 * 文本变换注册表:工具文件只能传字符串 ID(工具页是服务端组件,
 * 函数不能跨 RSC 边界传给客户端引擎——这条是硬性架构约束)。
 */
export const TRANSFORMS: Record<string, (input: string, opts: Record<string, boolean>) => string> = {
  "dedupe-lines": dedupeLines,
  "remove-extra-spaces": removeExtraSpaces,
  "reverse-text": (s, o) => reverseText(s, Boolean(o.byLines)),
  "clean-text": (s, o) =>
    cleanText(s, {
      trimLines: o.trimLines,
      collapseSpaces: o.collapseSpaces,
      removeEmpty: o.removeEmpty,
      removePrintable: o.removePrintable,
      normalizePunct: o.normalizePunct,
    }),

  // --- Developer 类目追加(sql-format 走引擎内动态 import,不进注册表) ---
  "json-beautify": (s, o) => jsonBeautify(s, o.tab ? "\t" : o.four ? 4 : 2),
  "json-minify": (s) => jsonMinify(s),
  "json-validate": (s) => jsonValidate(s),
  "xml-format": (s) => xmlFormat(s),
  "xml-validate": (s) => xmlValidate(s),
  "html-beautify": (s) => htmlBeautify(s),
  "html-minify": (s) => htmlMinify(s),
  "css-minify": (s) => cssMinify(s),
  "js-minify": (s) => jsMinify(s),

  // --- Text 类目追加 ---
  "slugify": (s) => slugify(s),
};

// --- APPEND-ONLY 追加(fancy-text-generator / html-escape 用): ---
// 不改动上方既有行,末尾以第二段 import + Object.assign 合入新 ID。

import { fancyText, htmlEscapeEntities, htmlUnescapeEntities } from "./transforms";

const EXTRA_TRANSFORMS: Record<string, (input: string, opts: Record<string, boolean>) => string> = {
  "fancy-bold": (s) => fancyText(s, "bold"),
  "fancy-italic": (s) => fancyText(s, "italic"),
  "fancy-bold-italic": (s) => fancyText(s, "bold-italic"),
  "fancy-script": (s) => fancyText(s, "script"),
  "fancy-bold-script": (s) => fancyText(s, "bold-script"),
  "fancy-double-struck": (s) => fancyText(s, "double-struck"),
  "fancy-monospace": (s) => fancyText(s, "monospace"),
  "fancy-circled": (s) => fancyText(s, "circled"),
  "fancy-squared": (s) => fancyText(s, "squared"),
  "fancy-fullwidth": (s) => fancyText(s, "fullwidth"),
  "fancy-strikethrough": (s) => fancyText(s, "strikethrough"),
  "fancy-underline": (s) => fancyText(s, "underline"),

  "html-escape": (s, o) => htmlEscapeEntities(s, Boolean(o.numeric)),
  "html-unescape": (s) => htmlUnescapeEntities(s),
};

Object.assign(TRANSFORMS, EXTRA_TRANSFORMS);
