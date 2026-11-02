/** 文本变换纯函数,全部可单测。 */

export function dedupeLines(
  s: string,
  o: { ignoreCase?: boolean; trimFirst?: boolean; removeEmpty?: boolean; sortAfter?: boolean } = {},
): string {
  let lines = s.split(/\r?\n/);
  if (o.removeEmpty) lines = lines.filter((l) => l.trim() !== "");
  const seen = new Set<string>();
  const out: string[] = [];
  for (let line of lines) {
    if (o.trimFirst) line = line.trim();
    const key = o.ignoreCase ? line.toLowerCase() : line;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  if (o.sortAfter) out.sort((a, b) => a.localeCompare(b));
  return out.join("\n");
}

export function removeExtraSpaces(
  s: string,
  o: { tabs?: boolean; trimLines?: boolean; removeEmptyLines?: boolean } = {},
): string {
  let out = s;
  if (o.tabs) out = out.replace(/\t+/g, " ");
  out = out.replace(/ {2,}/g, " ");
  if (o.trimLines) out = out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .join("\n");
  if (o.removeEmptyLines) out = out
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .join("\n");
  return out;
}

export function sortLines(s: string, order: "asc" | "desc" | "length" | "numeric"): string {
  const lines = s.split(/\r?\n/);
  const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: "variant" });
  const sorted = [...lines];
  switch (order) {
    case "asc":
      sorted.sort(coll.compare);
      break;
    case "desc":
      sorted.sort((a, b) => coll.compare(b, a));
      break;
    case "length":
      sorted.sort((a, b) => a.length - b.length);
      break;
    case "numeric":
      sorted.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
      break;
  }
  return sorted.join("\n");
}

export function reverseText(s: string, byLines = false): string {
  return byLines
    ? s.split(/\r?\n/).reverse().join("\n")
    : [...s].reverse().join("");
}

export function cleanText(
  s: string,
  o: { trimLines?: boolean; collapseSpaces?: boolean; removeEmpty?: boolean; removePrintable?: boolean; normalizePunct?: boolean } = {},
): string {
  let out = s;
  if (o.removePrintable) out = out.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200b-\u200d\ufeff]/g, "");
  if (o.normalizePunct)
    out = out
      .replace(/[\u2018\u2019\u201b]/g, "'")
      .replace(/[\u201c\u201d\u201e]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u00a0/g, " ");
  if (o.collapseSpaces) out = out.replace(/[^\S\n]{2,}/g, " ");
  if (o.trimLines) out = out.split(/\r?\n/).map((l) => l.trim()).join("\n");
  if (o.removeEmpty) out = out.split(/\r?\n/).filter((l) => l.trim() !== "").join("\n");
  return out;
}

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of", "on", "or",
  "per", "so", "the", "to", "up", "via", "vs", "yet",
]);

export function toTitleCase(s: string): string {
  return s.replace(/\p{L}[\p{L}\p{M}'’]*/gu, (word, offset: number) => {
    const lower = word.toLowerCase();
    const isEdge = offset === 0 || offset + word.length === s.length;
    if (!isEdge && SMALL_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

export function toSentenceCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^\s*\p{L}|[.!?。！？]\s+\p{L})/gu, (m) => m.toUpperCase());
}

function splitWords(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9\u00c0-\u024f]+|_+/)
    .filter(Boolean);
}

export function toCamel(s: string): string {
  return splitWords(s)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}
export function toPascal(s: string): string {
  return splitWords(s)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}
export function toSnake(s: string): string {
  return splitWords(s).map((w) => w.toLowerCase()).join("_");
}
export function toKebab(s: string): string {
  return splitWords(s).map((w) => w.toLowerCase()).join("-");
}
export function toConstant(s: string): string {
  return splitWords(s).map((w) => w.toUpperCase()).join("_");
}
export function toAlternating(s: string): string {
  let i = 0;
  return [...s]
    .map((ch) => (/\p{L}/u.test(ch) ? (i++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch))
    .join("");
}
export function toInverse(s: string): string {
  return [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
}

const LOREM = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum`.split(
  " ",
);

export function loremWords(n: number, seed = Date.now()): string {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const words = Array.from({ length: n }, () => LOREM[Math.floor(rand() * LOREM.length)]);
  let text = words.join(" ");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text.endsWith(".") ? text : text + ".";
}

export function loremParagraphs(n: number, seed = Date.now()): string {
  const out: string[] = [];
  for (let p = 0; p < n; p++) {
    const sentences = 3 + (Math.abs(Math.floor(seed + p * 7919)) % 3);
    const parts: string[] = [];
    for (let i = 0; i < sentences; i++) {
      parts.push(loremWords(8 + ((seed * (p + 1) * (i + 3)) % 12), seed + p * 131 + i * 977));
    }
    out.push(parts.join(" "));
  }
  return out.join("\n\n");
}

// ---------------------------------------------------------------------------
// Developer 类目追加(下方全部为纯字符串变换;DOMParser 等浏览器 API 仅在
// 函数体内使用并做了环境守卫,模块顶层无副作用)。

/* ---------- JSON ---------- */

type JsonIndent = number | "\t";

function lineColOf(s: string, pos: number): { line: number; col: number } {
  let line = 1;
  let last = -1;
  const stop = Math.min(pos, s.length);
  for (let k = 0; k < stop; k++) {
    if (s.charCodeAt(k) === 10) {
      line++;
      last = k;
    }
  }
  return { line, col: stop - last };
}

/** 手写 JSON 语法扫描:返回第一个错误(1 基行/列),合法输入返回 null。 */
export function findJsonError(s: string): { line: number; col: number; msg: string } | null {
  const n = s.length;
  let i = 0;
  let depth = 0;
  const NUM_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

  const fail = (pos: number, msg: string) => {
    const { line, col } = lineColOf(s, pos);
    return { line, col, msg };
  };
  const skipWs = () => {
    while (i < n) {
      const c = s.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
  };
  const badChar = (pos: number) => {
    const rest = s.slice(pos, pos + 16);
    return /^[\w'-]+/.exec(rest)?.[0] ?? rest[0] ?? "";
  };

  type Err = ReturnType<typeof fail> | null;

  const parseString = (): Err => {
    i++; // 开头引号
    while (i < n) {
      const c = s.charCodeAt(i);
      if (c === 34) {
        i++;
        return null;
      }
      if (c === 92) {
        const e = s[i + 1];
        if (e === undefined) return fail(i, "Unterminated string");
        if ('"\\/bfnrt'.includes(e)) {
          i += 2;
          continue;
        }
        if (e === "u") {
          if (/^[0-9a-fA-F]{4}/.test(s.slice(i + 2, i + 6))) {
            i += 6;
            continue;
          }
          return fail(i + 2, "Invalid \\u escape");
        }
        return fail(i + 1, `Invalid escape '\\${e}'`);
      }
      if (c < 0x20) return fail(i, "Unescaped control character in string");
      i++;
    }
    return fail(n, "Unterminated string");
  };

  const parseValue = (): Err => {
    skipWs();
    if (i >= n) return fail(i, "Unexpected end of input");
    const c = s[i];
    if (c === "{") return parseObject();
    if (c === "[") return parseArray();
    if (c === '"') return parseString();
    if (c === "-" || (c >= "0" && c <= "9")) {
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(s);
      if (!m || m[0] === "") return fail(i, "Invalid number");
      i = NUM_RE.lastIndex;
      return null;
    }
    if (s.startsWith("true", i)) {
      i += 4;
      return null;
    }
    if (s.startsWith("false", i)) {
      i += 5;
      return null;
    }
    if (s.startsWith("null", i)) {
      i += 4;
      return null;
    }
    return fail(i, `Unexpected token '${badChar(i)}'`);
  };

  const parseObject = (): Err => {
    i++; // {
    if (++depth > 2000) return fail(i, "JSON nesting is too deep to analyze");
    skipWs();
    if (s[i] === "}") {
      i++;
      depth--;
      return null;
    }
    for (;;) {
      skipWs();
      if (i >= n) return fail(i, "Unexpected end of input");
      if (s[i] !== '"') return fail(i, `Expected property name, got '${badChar(i)}'`);
      const e = parseString();
      if (e) return e;
      skipWs();
      if (s[i] !== ":") return fail(i, `Expected ':' after property name, got '${badChar(i)}'`);
      i++;
      const e2 = parseValue();
      if (e2) return e2;
      skipWs();
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === "}") {
        i++;
        depth--;
        return null;
      }
      return fail(i, `Expected ',' or '}', got '${badChar(i)}'`);
    }
  };

  const parseArray = (): Err => {
    i++; // [
    if (++depth > 2000) return fail(i, "JSON nesting is too deep to analyze");
    skipWs();
    if (s[i] === "]") {
      i++;
      depth--;
      return null;
    }
    for (;;) {
      const e = parseValue();
      if (e) return e;
      skipWs();
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === "]") {
        i++;
        depth--;
        return null;
      }
      if (i >= n) return fail(i, "Unexpected end of input");
      return fail(i, `Expected ',' or ']', got '${badChar(i)}'`);
    }
  };

  const top = parseValue();
  if (top) return top;
  skipWs();
  if (i < n) return fail(i, `Unexpected content after JSON value '${badChar(i)}'`);
  return null;
}

function throwJsonError(s: string, err: unknown): never {
  const e = findJsonError(s);
  if (e) throw new Error(`Line ${e.line}, column ${e.col}: ${e.msg}`);
  throw err instanceof Error ? err : new Error(String(err));
}

/** 美化 JSON;非法输入抛出带行列号的 Error。 */
export function jsonBeautify(s: string, indent: JsonIndent = 2): string {
  let value: unknown;
  try {
    value = JSON.parse(s);
  } catch (err) {
    throwJsonError(s, err);
  }
  return JSON.stringify(value, null, indent);
}

/** 压缩 JSON;非法输入抛出带行列号的 Error。 */
export function jsonMinify(s: string): string {
  let value: unknown;
  try {
    value = JSON.parse(s);
  } catch (err) {
    throwJsonError(s, err);
  }
  return JSON.stringify(value);
}

/** 校验 JSON:空串返回 "",合法返回 "OK",否则返回 "Line L, column C: 原因"。 */
export function jsonValidate(s: string): string {
  if (s.trim() === "") return "";
  try {
    JSON.parse(s);
    return "OK";
  } catch {
    const e = findJsonError(s);
    if (e) return `Line ${e.line}, column ${e.col}: ${e.msg}`;
    try {
      JSON.parse(s);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
    return "Invalid JSON";
  }
}

/* ---------- 通用标记语言 tokenizer(XML / HTML 共用) ---------- */

type MarkupKind = "open" | "close" | "self" | "text" | "comment" | "cdata" | "pi" | "doctype" | "raw";
type MarkupToken = { kind: MarkupKind; raw: string; name: string };

const HTML_VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);
const HTML_RAWTEXT = new Set(["script", "style", "pre", "textarea"]);
const HTML_AUTOCLOSE = new Set(["li", "p", "tr", "td", "th", "option", "dt", "dd", "thead", "tbody", "tfoot"]);
const HTML_BLOCKISH = new Set([
  "html", "head", "body", "div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "section", "article", "aside", "header", "footer",
  "nav", "main", "form", "fieldset", "blockquote", "pre", "hr", "figure", "figcaption", "address",
  "details", "summary", "script", "style", "link", "meta", "title",
]);

function markupTokens(src: string, rawText: Set<string>): MarkupToken[] {
  const toks: MarkupToken[] = [];
  const n = src.length;
  let i = 0;
  let textStart = 0;
  const pushText = (end: number) => {
    if (end > textStart) toks.push({ kind: "text", raw: src.slice(textStart, end), name: "" });
  };
  while (i < n) {
    if (src[i] !== "<") {
      i++;
      continue;
    }
    pushText(i);
    if (src.startsWith("<!--", i)) {
      const end = src.indexOf("-->", i + 4);
      const stop = end === -1 ? n : end + 3;
      toks.push({ kind: "comment", raw: src.slice(i, stop), name: "" });
      i = stop;
    } else if (src.startsWith("<![CDATA[", i)) {
      const end = src.indexOf("]]>", i + 9);
      const stop = end === -1 ? n : end + 3;
      toks.push({ kind: "cdata", raw: src.slice(i, stop), name: "" });
      i = stop;
    } else if (src.startsWith("<!", i)) {
      let j = i + 2;
      let bracket = false;
      while (j < n) {
        const c = src[j];
        if (c === "[") bracket = true;
        else if (c === "]") bracket = false;
        else if (c === ">" && !bracket) break;
        j++;
      }
      const stop = Math.min(j + 1, n);
      toks.push({ kind: "doctype", raw: src.slice(i, stop), name: "" });
      i = stop;
    } else if (src.startsWith("<?", i)) {
      const end = src.indexOf("?>", i + 2);
      const stop = end === -1 ? n : end + 2;
      toks.push({ kind: "pi", raw: src.slice(i, stop), name: "" });
      i = stop;
    } else if (src.startsWith("</", i)) {
      let j = i + 2;
      while (j < n && src[j] !== ">") j++;
      const raw = src.slice(i, Math.min(j + 1, n));
      const name = /<\/\s*([^\s>/]+)/.exec(raw)?.[1]?.toLowerCase() ?? "";
      toks.push({ kind: "close", raw, name });
      i = Math.min(j + 1, n);
    } else {
      let j = i + 1;
      let quote = "";
      while (j < n) {
        const c = src[j];
        if (quote) {
          if (c === quote) quote = "";
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
        j++;
      }
      const raw = src.slice(i, Math.min(j + 1, n));
      const name = /<\s*([^\s/>]+)/.exec(raw)?.[1]?.toLowerCase() ?? "";
      if (!name) {
        toks.push({ kind: "text", raw: "<", name: "" });
        i++;
        textStart = i;
        continue;
      }
      const selfClosing = /\/\s*>$/.test(raw);
      if (rawText.has(name) && !selfClosing) {
        const closeRe = new RegExp(`</\\s*${name}\\s*>`, "i");
        const rest = src.slice(j + 1);
        const m = closeRe.exec(rest);
        const contentEnd = m ? j + 1 + m.index : n;
        toks.push({ kind: "open", raw, name });
        if (contentEnd > j + 1) toks.push({ kind: "raw", raw: src.slice(j + 1, contentEnd), name });
        if (m) {
          toks.push({ kind: "close", raw: m[0], name });
          i = j + 1 + m.index + m[0].length;
        } else {
          i = n;
        }
        textStart = i;
        continue;
      }
      toks.push({ kind: selfClosing ? "self" : "open", raw, name });
      i = Math.min(j + 1, n);
    }
    textStart = i;
  }
  pushText(n);
  return toks;
}

const collapseTag = (raw: string) => raw.replace(/\s+/g, " ").trim();

function formatMarkup(
  src: string,
  opts: {
    rawText: Set<string>;
    voidTags: Set<string>;
    autoclose: Set<string>;
    indent: string;
  },
): string {
  const toks = markupTokens(src, opts.rawText);
  const lines: string[] = [];
  const stack: string[] = [];
  const pad = () => opts.indent.repeat(stack.length);

  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.kind === "text") {
      const txt = t.raw.replace(/\s+/g, " ").trim();
      if (txt) lines.push(pad() + txt);
    } else if (t.kind === "open") {
      const open = collapseTag(t.raw);
      const nxt = toks[k + 1];
      const nxt2 = toks[k + 2];
      if (nxt?.kind === "text" && nxt2?.kind === "close" && nxt2.name === t.name && nxt.raw.trim() !== "") {
        lines.push(`${pad()}${open}${nxt.raw.replace(/\s+/g, " ").trim()}</${t.name}>`);
        k += 2;
        continue;
      }
      if (opts.autoclose.has(t.name) && stack[stack.length - 1] === t.name) stack.pop();
      lines.push(pad() + open);
      if (!opts.voidTags.has(t.name)) stack.push(t.name);
    } else if (t.kind === "close") {
      const at = stack.lastIndexOf(t.name);
      if (at !== -1) stack.length = at;
      lines.push(pad() + collapseTag(t.raw));
    } else if (t.kind === "self") {
      lines.push(pad() + collapseTag(t.raw));
    } else if (t.kind === "raw") {
      const body = t.raw.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
      if (body !== "") lines.push(body); // pre/script 等内容逐字保留,不缩进
    } else if (t.kind === "cdata") {
      t.raw.split(/\r?\n/).forEach((l, idx) => lines.push(idx === 0 ? pad() + l.trimStart() : l));
    } else {
      lines.push(pad() + collapseTag(t.raw)); // comment / pi / doctype
    }
  }
  return lines.join("\n");
}

/* ---------- XML ---------- */

/** 美化 XML(2 空格缩进,短文本保持同行)。 */
export function xmlFormat(s: string): string {
  if (s.trim() === "") return "";
  return formatMarkup(s, { rawText: new Set(), voidTags: new Set(), autoclose: new Set(), indent: "  " });
}

/** 校验 XML(DOMParser):空串返回 "",合法返回 "OK",否则返回错误描述。 */
export function xmlValidate(s: string): string {
  if (typeof DOMParser === "undefined" || s.trim() === "") return "";
  const doc = new DOMParser().parseFromString(s, "application/xml");
  const pe = doc.getElementsByTagName("parsererror");
  if (pe.length > 0) {
    return (pe[0].textContent ?? "Invalid XML").replace(/\s+/g, " ").trim();
  }
  return "OK";
}

/* ---------- HTML ---------- */

/** 缩进式 HTML 美化:void 元素不加深,pre/script/style 内容原样保留。 */
export function htmlBeautify(s: string): string {
  if (s.trim() === "") return "";
  return formatMarkup(s, { rawText: HTML_RAWTEXT, voidTags: HTML_VOID, autoclose: HTML_AUTOCLOSE, indent: "  " });
}

/** 保守 HTML 压缩:去注释(保留 IE 条件注释)、折叠空白;块级标签间空白直接删除。 */
export function htmlMinify(s: string): string {
  if (s.trim() === "") return "";
  const toks = markupTokens(s, HTML_RAWTEXT);
  let out = "";
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.kind === "text") {
      const collapsed = t.raw.replace(/\s+/g, " ");
      if (collapsed.trim() === "") {
        // 纯空白:两侧至少一个是块级标签时才安全删除,否则保留一个空格
        const prev = toks[k - 1];
        const next = toks[k + 1];
        const prevBlock = prev && prev.kind !== "text" && HTML_BLOCKISH.has(prev.name);
        const nextBlock = next && next.kind !== "text" && HTML_BLOCKISH.has(next.name);
        if (prevBlock || nextBlock) continue;
        out += " ";
      } else {
        out += collapsed;
      }
    } else if (t.kind === "comment") {
      if (/^<!--\s*\[if/i.test(t.raw)) out += t.raw;
    } else if (t.kind === "cdata" || t.kind === "raw") {
      out += t.raw;
    } else {
      out += collapseTag(t.raw);
    }
  }
  return out.trim();
}

/* ---------- CSS ---------- */

/** 保守 CSS 压缩:去注释、折叠空白、收紧分隔符;字符串内容原样保留。 */
export function cssMinify(s: string): string {
  if (s.trim() === "") return "";
  const strings: string[] = [];
  const src = s.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => {
    strings.push(m);
    return `\u0000${strings.length - 1}\u0000`;
  });
  const out = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/\s*>\s*/g, ">")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .trim()
    .replace(/\u0000(\d+)\u0000/g, (_, idx: string) => strings[Number(idx)] ?? "");
  return out;
}

/* ---------- JS(保守压缩) ---------- */

const JS_KEYWORDS_BEFORE_REGEX = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await",
]);

/**
 * 保守 JS 压缩:仅去掉注释并折叠空行/缩进(保留换行以确保 ASI 语义不变)。
 * 字符串、模板字符串(含 ${} 嵌套)与正则字面量按原样保留。
 */
export function jsMinify(src: string): string {
  const n = src.length;
  type Ctx = "code" | "s" | "d" | "tmpl" | "line" | "block";
  const stack: Ctx[] = ["code"];
  const depth: number[] = [0]; // 每个 tmpl 帧对应一层 ${ } 深度
  let out = "";
  let ws = "";
  let blockNl = false;
  let prevSig = "";
  let prevWord = "";

  const flush = () => {
    if (ws) {
      out += ws === "\n" ? "\n" : " ";
      ws = "";
    }
  };
  const put = (chunk: string) => {
    flush();
    out += chunk;
  };
  const setWs = (hasNewline: boolean) => {
    ws = ws === "\n" || hasNewline ? "\n" : " ";
  };
  const regexAllowed = () =>
    prevSig === "" || JS_KEYWORDS_BEFORE_REGEX.has(prevWord) || !/[A-Za-z0-9_$)\]]/.test(prevSig);

  let i = 0;
  while (i < n) {
    const ctx = stack[stack.length - 1];
    const c = src[i];

    if (ctx === "code") {
      if (c === "/" && src[i + 1] === "/") {
        stack.push("line");
        i += 2;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        stack.push("block");
        blockNl = false;
        i += 2;
        continue;
      }
      if (c === "/" && regexAllowed()) {
        let j = i + 1;
        let inClass = false;
        while (j < n) {
          const r = src[j];
          if (r === "\\") {
            j += 2;
            continue;
          }
          if (inClass) {
            if (r === "]") inClass = false;
          } else if (r === "[") inClass = true;
          else if (r === "/" || r === "\n") break;
          j++;
        }
        let k = j < n ? j + 1 : j;
        while (k < n && /[a-z]/i.test(src[k])) k++;
        put(src.slice(i, k));
        prevSig = "/";
        prevWord = "";
        i = k;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        put(c);
        stack.push(c === '"' ? "d" : c === "'" ? "s" : "tmpl");
        prevSig = c;
        prevWord = "";
        i++;
        continue;
      }
      if (c === "{") {
        depth[depth.length - 1]++;
        put(c);
        prevSig = "{";
        prevWord = "";
        i++;
        continue;
      }
      if (c === "}") {
        if (depth[depth.length - 1] > 0) depth[depth.length - 1]--;
        else if (stack.length > 1) {
          stack.pop();
          depth.pop();
        }
        put(c);
        prevSig = "}";
        prevWord = "";
        i++;
        continue;
      }
      if (/\s/.test(c)) {
        setWs(c === "\n");
        i++;
        continue;
      }
      put(c);
      prevSig = c;
      prevWord = /[A-Za-z0-9_$]/.test(c) ? prevWord + c : "";
      i++;
      continue;
    }

    if (ctx === "line") {
      if (c === "\n") {
        stack.pop();
        setWs(true);
      }
      i++;
      continue;
    }

    if (ctx === "block") {
      if (c === "\n") blockNl = true;
      if (c === "*" && src[i + 1] === "/") {
        stack.pop();
        setWs(blockNl);
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (ctx === "s" || ctx === "d") {
      if (c === "\\") {
        out += src.slice(i, i + 2);
        i += 2;
        continue;
      }
      if ((ctx === "s" && c === "'") || (ctx === "d" && c === '"')) {
        out += c;
        stack.pop();
        i++;
        continue;
      }
      if (c === "\n") {
        stack.pop(); // 未闭合的字符串换行(源码本身有语法问题),保守结束
        setWs(true);
        i++;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    // tmpl
    if (c === "\\") {
      out += src.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (c === "`") {
      out += c;
      stack.pop();
      prevSig = "`";
      prevWord = "";
      i++;
      continue;
    }
    if (c === "$" && src[i + 1] === "{") {
      out += "${";
      stack.push("code");
      depth.push(0);
      prevSig = "{";
      prevWord = "";
      i += 2;
      continue;
    }
      out += c;
      i++;
    }
    return out.trim();
}

/* ---------- Text 类目追加(slug-generator 用)---------- */

/** 生成 URL slug:小写、NFD 去重音符、非字母数字折叠为单个连字符并去首尾。 */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Fancy text(Unicode Mathematical Alphanumeric Symbols 映射;纯字符串变换)。

export type FancyStyle =
  | "bold"
  | "italic"
  | "bold-italic"
  | "script"
  | "bold-script"
  | "double-struck"
  | "monospace"
  | "circled"
  | "squared"
  | "fullwidth"
  | "strikethrough"
  | "underline";

type FancyMap = Record<string, string>;

/** 由三个基码位(A-Z / a-z / 0-9)构造映射;exceptions 覆盖 Unicode 里的保留/现成字符。 */
function buildFancyMap(upperBase: number, lowerBase: number, digitBase: number, exceptions: FancyMap = {}): FancyMap {
  const m: FancyMap = {};
  for (let i = 0; i < 26; i++) {
    m[String.fromCharCode(65 + i)] = String.fromCodePoint(upperBase + i);
    m[String.fromCharCode(97 + i)] = String.fromCodePoint(lowerBase + i);
  }
  if (digitBase) {
    for (let i = 0; i < 10; i++) m[String.fromCharCode(48 + i)] = String.fromCodePoint(digitBase + i);
  }
  // 覆盖项必须在基表之后合入,否则会被循环重置
  return { ...m, ...exceptions };
}

const CIRCLED_DIGITS: FancyMap = (() => {
  // ⓪ U+24EA,①–⑨ U+2460–2468
  const d: FancyMap = { "0": "\u24ea" };
  for (let i = 1; i <= 9; i++) d[String(i)] = String.fromCodePoint(0x2460 + i - 1);
  return d;
})();

const FANCY_MAPS: Record<FancyStyle, FancyMap | null> = {
  bold: buildFancyMap(0x1d400, 0x1d41a, 0x1d7ce),
  // U+1D455(斜体 h)保留未分配,用 Planck 常量符号 ℎ U+210E
  italic: buildFancyMap(0x1d434, 0x1d44e, 0, { h: "\u210e" }),
  "bold-italic": buildFancyMap(0x1d468, 0x1d482, 0x1d7d2),
  // 手写体有 11 个字母直接用 Letterlike Symbols 区现成字符
  script: buildFancyMap(0x1d49c, 0x1d4b6, 0, {
    B: "\u212c", E: "\u2130", F: "\u2131", H: "\u210b", I: "\u2110",
    L: "\u2112", M: "\u2133", R: "\u211b", e: "\u212f", g: "\u210a", o: "\u2134",
  }),
  "bold-script": buildFancyMap(0x1d4d0, 0x1d4ea, 0x1d7ec),
  // 空心体 7 个字母同理
  "double-struck": buildFancyMap(0x1d538, 0x1d552, 0x1d7d8, {
    C: "\u2102", H: "\u210d", N: "\u2115", P: "\u2119", Q: "\u211a", R: "\u211d", Z: "\u2124",
  }),
  monospace: buildFancyMap(0x1d670, 0x1d68a, 0x1d7f6),
  circled: buildFancyMap(0x24b6, 0x24d0, 0, CIRCLED_DIGITS),
  // 方框字母只有大写形态,小写映射到同一套
  squared: buildFancyMap(0x1f130, 0x1f130, 0),
  fullwidth: buildFancyMap(0xff21, 0xff41, 0xff10, { " ": "\u3000" }),
  strikethrough: null,
  underline: null,
};

/**
 * 把拉丁字母/数字映射到对应 Unicode 风格区;未映射字符(CJK、emoji、标点)
 * 原样保留,绝不产生豆腐块。strikethrough / underline 用组合附加符实现。
 */
export function fancyText(s: string, style: FancyStyle): string {
  if (style === "strikethrough") return [...s].map((c) => c + "\u0336").join("");
  if (style === "underline") return [...s].map((c) => c + "\u0332").join("");
  const map = FANCY_MAPS[style];
  if (!map) return s;
  return [...s].map((c) => map[c] ?? c).join("");
}

// ---------------------------------------------------------------------------
// HTML 实体转义/反转义(纯字符串变换,html-escape 工具用)。

/** 反转义支持的命名实体表:常用标记 + 拉丁字符 + 标点/箭头/数学符号。 */
const HTML_NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
  copy: "\u00a9", reg: "\u00ae", trade: "\u2122", deg: "\u00b0", hellip: "\u2026",
  mdash: "\u2014", ndash: "\u2013", lsquo: "\u2018", rsquo: "\u2019",
  ldquo: "\u201c", rdquo: "\u201d", laquo: "\u00ab", raquo: "\u00bb",
  bull: "\u2022", dagger: "\u2020", Dagger: "\u2021", sect: "\u00a7", para: "\u00b6",
  middot: "\u00b7", times: "\u00d7", divide: "\u00f7", plusmn: "\u00b1", micro: "\u00b5",
  sup2: "\u00b2", sup3: "\u00b3", frac14: "\u00bc", frac12: "\u00bd", frac34: "\u00be",
  euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", cent: "\u00a2", curren: "\u00a4",
  larr: "\u2190", uarr: "\u2191", rarr: "\u2192", darr: "\u2193", harr: "\u2194",
  infin: "\u221e", ne: "\u2260", le: "\u2264", ge: "\u2265", asymp: "\u2248", sum: "\u2211",
  aacute: "\u00e1", eacute: "\u00e9", iacute: "\u00ed", oacute: "\u00f3", uacute: "\u00fa",
  ntilde: "\u00f1", uuml: "\u00fc", ouml: "\u00f6", auml: "\u00e4", szlig: "\u00df",
  agrave: "\u00e0", egrave: "\u00e8", ccedil: "\u00e7", atilde: "\u00e3", otilde: "\u00f5",
  acirc: "\u00e2", ecirc: "\u00ea", ocirc: "\u00f4", ucirc: "\u00fb",
};

const HTML_ENTITY_RE = /&(?:#x([0-9a-fA-F]+)|#([0-9]+)|([a-zA-Z][a-zA-Z0-9]*));/g;

/** HTML 转义:& < > " ' 用命名实体;nonAscii 时 >U+007F 的字符输出十进制数字实体。 */
export function htmlEscapeEntities(s: string, nonAscii = false): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "&") out += "&amp;";
    else if (ch === "<") out += "&lt;";
    else if (ch === ">") out += "&gt;";
    else if (ch === '"') out += "&quot;";
    else if (ch === "'") out += "&#39;";
    else if (nonAscii && code > 0x7f) out += `&#${code};`;
    else out += ch;
  }
  return out;
}

/**
 * HTML 反转义:解码命名实体(见 HTML_NAMED 表)、&#十进制; 与 &#x十六进制;。
 * 无效码位(超界/代理区)原样保留,不抛错。
 */
export function htmlUnescapeEntities(s: string): string {
  return s.replace(HTML_ENTITY_RE, (whole, hex: string | undefined, dec: string | undefined, name: string | undefined) => {
    if (name) return HTML_NAMED[name] ?? whole;
    const code = hex !== undefined ? parseInt(hex, 16) : parseInt(dec ?? "", 10);
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return whole;
    return String.fromCodePoint(code);
  });
}

export function countTextStats(text: string) {
  const words = (text.match(/[^\s]+/g) ?? []).length;
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) ?? []).length;
  const characters = [...text].length;
  const charsNoSpaces = [...text.replace(/\s/g, "")].length;
  const sentences = (text.match(/[^.!?。！？…]+[.!?。！？…]+|[^.!?。！？…]+$/g) ?? []).filter(
    (s2) => s2.trim().length > 0,
  ).length;
  const paragraphs = text.split(/\n{2,}/).filter((s2) => s2.trim().length > 0).length;
  const lines = text === "" ? 0 : text.split(/\n/).length;
  return { words: words + cjk, characters, charsNoSpaces, sentences, paragraphs, lines };
}
