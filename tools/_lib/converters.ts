/**
 * 转换类工具的纯逻辑,Node 可测,引擎只做 UI 编排。
 * - CSV / 表格互转:dev-engine-sheet(csv⇄xlsx)。遵循 RFC 4180:
 *   双引号转义、引号内分隔符与换行原样保留、CRLF 归一为 \n。
 * - JSON ⇄ XML(base64 图片辅助在同文件后半段)。
 */

export type Delimiter = "," | ";" | "\t";

/** Excel 里工作表名禁止的字符。 */
const SHEET_NAME_BAD = /[:\\/?*[\]]/g;
const SHEET_NAME_MAX = 31;

/** 数字单元格判定:仅当字符串经 Number() 往返后逐字不变时才转数字(007、1e3、0.500 保持文本)。 */
const NUM_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

/** 剥掉 UTF-8 BOM(Excel 导出的 CSV 常带)。 */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * 自动探测分隔符:取前 20 行、统计引号外各候选字符出现次数,最多者胜。
 * 打不成平手也没有候选时回退 ","。
 */
export function detectDelimiter(text: string): Delimiter {
  const src = stripBom(text);
  const sample = src.split(/\r\n|\r|\n/, 20).join("\n");
  const counts: Record<Delimiter, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQ = false;
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    if (c === '"') inQ = !inQ;
    else if (!inQ && c in counts) counts[c as Delimiter]++;
  }
  let best: Delimiter = ",";
  let bestN = 0;
  for (const d of [",", ";", "\t"] as const) {
    if (counts[d] > bestN) {
      best = d;
      bestN = counts[d];
    }
  }
  return best;
}

/** RFC 4180 解析。引号内的分隔符 / 换行是普通字符, "" 转义为 "。 */
export function parseCsv(text: string, delim: string): string[][] {
  const src = stripBom(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** 单元格写出:含分隔符 / 引号 / 换行时加引号并双写引号。 */
export function csvCell(value: string, delim: string): string {
  if (value.includes('"') || value.includes(delim) || /[\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** 行矩阵 → CSV 文本(行尾不加多余换行)。 */
export function rowsToCsv(rows: string[][], delim: string): string {
  return rows.map((r) => r.map((v) => csvCell(v, delim)).join(delim)).join("\n");
}

/**
 * 字符串单元格 → 写入 xlsx 的值。仅当 String(Number(s)) === s 时才转数字,
 * 这样 "9.5"、"-3"、"0" 变成真正的数值单元格,"007"、"1e3"、"0.500" 保持文本,
 * 且保证 sheet_to_csv 往返后逐字还原。
 */
export function numericCell(s: string): string | number {
  if (s === "" || !NUM_RE.test(s)) return s;
  const n = Number(s);
  return String(n) === s ? n : s;
}

/** CSV 行矩阵 → aoa_to_sheet 可用的矩阵(可选数字识别,默认开)。 */
export function aoaFromRows(rows: string[][], numberCells = true): (string | number)[][] {
  return rows.map((r) => r.map((v) => (numberCells ? numericCell(v) : v)));
}

/**
 * sheet_to_json(header:1) 的矩阵 → 字符串行矩阵:undefined/null → "",
 * 数字 / 布尔 → String(),对象原样 String();丢弃整行全空的行。
 */
export function rowsFromSheetMatrix(matrix: unknown[][]): string[][] {
  const rows = matrix.map((r) =>
    r.map((v) => {
      if (v === undefined || v === null) return "";
      if (typeof v === "object") return String(v);
      return String(v);
    }),
  );
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** 无表头数据时生成 "Column 1…N" 表头行。 */
export function generatedHeader(width: number): string[] {
  return Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
}

/**
 * 清洗 Excel 工作表名:去掉 : \\ / ? * [ ],截断到 31 字符,
 * 空结果回退 "Sheet1"。
 */
export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(SHEET_NAME_BAD, "").trim();
  if (cleaned === "") return "Sheet1";
  return cleaned.slice(0, SHEET_NAME_MAX);
}

/* ------------------------------------------------------------------ */
/* JSON → XML 序列化(json-to-xml 工具)                                */
/* ------------------------------------------------------------------ */

export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConvertError";
  }
}

export type JsonToXmlOptions = {
  /** 根元素名(经 toXmlName 清洗)。默认 "root"。 */
  rootName?: string;
  /** 是否输出 <?xml …?> 声明行。默认 true。 */
  declaration?: boolean;
  /** 每层缩进空格数。默认 2。 */
  indent?: number;
};

const NAME_START = /[\p{L}_:]/u;
const NAME_REST = /[\p{L}\p{N}._:-]/u;

/**
 * 把任意 JSON 键名清洗成合法的 XML 元素/属性名:非法字符换成 "_",
 * 首字符不能作为 NameStartChar(数字、"."、"-" 等)时加 "_" 前缀。
 * Unicode 字母(CJK、重音字母)是合法的 XML 名,原样保留。空串得到 "_"。
 */
export function toXmlName(name: string): string {
  let out = "";
  for (const ch of name) out += NAME_REST.test(ch) ? ch : "_";
  if (out.length === 0 || !NAME_START.test(out[0])) out = `_${out}`;
  return out;
}

/** 元素文本转义(按工具契约把引号也转义)。 */
export function escapeXmlText(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** 双引号属性值转义。 */
export function escapeXmlAttr(s: string): string {
  return escapeXmlText(s);
}

type Primitive = string | number | boolean | bigint;

/** 原始值(排除 NaN / ±Infinity——它们按 null 渲染);bigint 一律当文本。 */
const isPrimitive = (v: unknown): v is Primitive =>
  typeof v === "number"
    ? Number.isFinite(v)
    : typeof v === "string" || typeof v === "boolean" || typeof v === "bigint";

/** null / undefined / NaN / Infinity / 函数 / symbol 统一渲染为自闭合空元素。 */
const isEmptyValue = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  (typeof v === "number" && !Number.isFinite(v)) ||
  typeof v === "function" ||
  typeof v === "symbol";

const ATTR_KEY = /^@_?/;

/**
 * JSON → 美化缩进的 XML 文档。映射规则与 xml-to-json 工具互逆
 * (该工具以 "@" 前缀解析属性、"#text" 承载文本节点):
 *  - 对象 → 元素;"@key" / "@_key" 的原始值成员 → 属性
 *  - "#text" 成员 → 该元素的文本内容
 *  - 数组 → 键名逐项重复(不做单数化);根级数组包成
 *    <root><item>…</item>…</root>,因为文档必须有唯一根元素
 *  - 原始值 → 文本内容;null → 自闭合元素
 *  - undefined / 函数 / symbol 成员跳过(与 JSON.stringify 一致);
 *    NaN / Infinity 按 null 渲染
 *  - 空数组(或所有子元素都输出为空的容器)收缩为自闭合空元素
 * 循环引用、把对象/数组放进属性值 → ConvertError。
 */
export function jsonToXml(value: unknown, options: JsonToXmlOptions = {}): string {
  const indentWidth = options.indent ?? 2;
  const rootName = toXmlName(options.rootName?.trim() ? options.rootName.trim() : "root");
  const declaration = options.declaration ?? true;

  const lines: string[] = [];
  const seen = new Set<unknown>();

  const emit = (name: string, v: unknown, depth: number): void => {
    const pad = " ".repeat(indentWidth * depth);
    if (isPrimitive(v)) {
      lines.push(`${pad}<${name}>${escapeXmlText(String(v))}</${name}>`);
      return;
    }
    if (isEmptyValue(v)) {
      lines.push(`${pad}<${name} />`);
      return;
    }
    if (seen.has(v)) {
      throw new ConvertError("Circular reference detected — JSON that references itself cannot be serialized to XML.");
    }
    seen.add(v);
    try {
      if (Array.isArray(v)) {
        for (const item of v) emit(name, item, depth); // 空数组 → 无输出
        return;
      }
      // 普通对象
      const attrs: string[] = [];
      let text: string | null = null;
      const children: [string, unknown][] = [];
      for (const [rawKey, rawVal] of Object.entries(v as Record<string, unknown>)) {
        if (ATTR_KEY.test(rawKey)) {
          if (rawVal === null || rawVal === undefined) continue;
          if (!isPrimitive(rawVal)) {
            throw new ConvertError(
              `Attribute "${rawKey}" must be a string, number or boolean — objects and arrays cannot become XML attributes.`,
            );
          }
          attrs.push(`${toXmlName(rawKey.replace(ATTR_KEY, ""))}="${escapeXmlAttr(String(rawVal))}"`);
        } else if (rawKey === "#text") {
          if (!isPrimitive(rawVal)) throw new ConvertError('"#text" must be a string, number or boolean.');
          text = escapeXmlText(String(rawVal));
        } else if (rawVal === undefined || typeof rawVal === "function" || typeof rawVal === "symbol") {
          continue; // JSON.stringify 同样跳过这些
        } else {
          children.push([toXmlName(rawKey), rawVal]);
        }
      }
      const attrPart = attrs.length ? ` ${attrs.join(" ")}` : "";
      const open = `<${name}${attrPart}>`;
      if (children.length === 0) {
        if (text === null) lines.push(`${pad}<${name}${attrPart} />`);
        else lines.push(`${pad}${open}${text}</${name}>`);
      } else {
        const before = lines.length;
        lines.push(`${pad}${open}`);
        if (text !== null) lines.push(`${" ".repeat(indentWidth * (depth + 1))}${text}`);
        for (const [childName, childVal] of children) emit(childName, childVal, depth + 1);
        if (lines.length === before + 1 + (text !== null ? 1 : 0)) {
          // 所有子元素都没产生输出(如空数组)→ 收缩为自闭合空元素
          lines.length = before;
          lines.push(`${pad}<${name}${attrPart} />`);
        } else {
          lines.push(`${pad}</${name}>`);
        }
      }
    } finally {
      seen.delete(v);
    }
  };

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`<${rootName} />`);
    } else {
      lines.push(`<${rootName}>`);
      for (const item of value) emit("item", item, 1);
      lines.push(`</${rootName}>`);
    }
  } else {
    emit(rootName, value, 0);
  }

  const body = lines.join("\n");
  return declaration ? `<?xml version="1.0" encoding="UTF-8"?>\n${body}` : body;
}

/* ------------------------------------------------------------------ */
/* Base64 / data-URL 辅助(base64-image 工具)                          */
/* ------------------------------------------------------------------ */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_LOOKUP = new Map<string, number>([...B64].map((c, i) => [c, i]));

/** 字节 → 标准 base64(带 padding)。纯 JS 实现,不依赖 Buffer/atob。 */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 63] : "=";
  }
  return out;
}

const stripB64Whitespace = (s: string): string => s.replaceAll(/\s/g, "");

/**
 * base64 → 字节。容忍缺失的 padding 与任意空白;非法字符或不可能的
 * 长度(n % 4 === 1、padding 超过 2、末尾残余位非 0)返回 null,不抛异常。
 */
export function base64ToBytes(input: string): Uint8Array | null {
  const s = stripB64Whitespace(input);
  if (s.length % 4 === 1) return null;
  const stripped = s.replace(/=+$/, "");
  if (s.length - stripped.length > 2) return null;
  const out = new Uint8Array(Math.floor((stripped.length * 3) / 4));
  let acc = 0;
  let bits = 0;
  let o = 0;
  for (let i = 0; i < stripped.length; i++) {
    const v = B64_LOOKUP.get(stripped[i]);
    if (v === undefined) return null;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
  }
  if (bits > 0 && (acc & ((1 << bits) - 1)) !== 0) return null;
  return out;
}

/** base64 解码后的字节数(不解码);长度不可能时返回 -1。 */
export function base64ByteLength(input: string): number {
  const s = stripB64Whitespace(input);
  if (s.length % 4 === 1) return -1;
  const stripped = s.replace(/=+$/, "");
  if (s.length - stripped.length > 2) return -1;
  return Math.floor((stripped.length * 3) / 4);
}

export type ParsedDataUrl = {
  /** URL 里的 MIME(小写),如 "image/png"。 */
  mime: string;
  /** 去除空白后的 base64 载荷。 */
  base64: string;
  /** 解码后的字节。 */
  bytes: Uint8Array;
};

/**
 * 解析并校验 base64 形式的 data URL("data:image/png;base64,…")。
 * 以下情形一律返回 null(不抛异常):不是 data: URL、缺 MIME、
 * 百分号编码载荷(非 base64)、base64 非法。
 */
export function parseDataUrl(input: string): ParsedDataUrl | null {
  const m = /^data:([^,]*),([\s\S]*)$/i.exec(input.trim());
  if (!m) return null;
  const meta = m[1];
  if (!/;base64$/i.test(meta)) return null;
  const mime = meta.slice(0, meta.length - ";base64".length).split(";")[0].trim().toLowerCase();
  if (!mime) return null;
  const base64 = stripB64Whitespace(m[2]);
  const bytes = base64ToBytes(base64);
  if (bytes === null) return null;
  return { mime, base64, bytes };
}

const IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

/** 该工具视为图片的 MIME 类型。 */
export function isImageMime(mime: string): boolean {
  return IMAGE_MIMES.has(mime.toLowerCase());
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/** 图片 MIME → 文件扩展名;未知类型回退 "img"。 */
export function imageMimeToExt(mime: string): string {
  return EXT_BY_MIME[mime.toLowerCase()] ?? "img";
}

/**
 * 从魔数探测图片真实类型,未知返回 null。与 data URL 声明的 MIME 互补:
 * 两者不一致说明载荷并非它声称的类型。
 */
export function guessImageMimeFromBytes(bytes: Uint8Array): string | null {
  const starts = (...sig: number[]): boolean => sig.every((b, i) => bytes[i] === b);
  const ascii = (start: number, len: number): string =>
    Array.from(bytes.subarray(start, start + len), (b) => String.fromCharCode(b)).join("");

  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (starts(0x42, 0x4d)) return "image/bmp";
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4).toLowerCase();
    if (brand.startsWith("avi")) return "image/avif";
    if (brand.startsWith("hei") || brand === "mif1" || brand === "msf1") return "image/heic";
  }
  // SVG 是文本:可选 UTF-8 BOM(字节级)/ 空白后跟 <?xml 或 <svg。
  let start = 0;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) start = 3;
  const head = ascii(start, Math.min(bytes.length - start, 256)).trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return null;
}
