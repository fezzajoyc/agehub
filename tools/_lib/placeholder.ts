/**
 * 占位图 SVG 生成纯逻辑(Node 可测,无 DOM)。
 * 约定:宽高为 1–5000 的数(四舍五入到整数),颜色必须是 #RGB / #RRGGBB;
 * 文本为空时用默认 "宽×高";文本中的 XML 特殊字符会被转义。
 * 输入非法 → 返回 null(文档化行为,不抛异常)。
 */

export const PLACEHOLDER_MAX = 5000;

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type PlaceholderOpts = {
  width: number;
  height: number;
  /** 背景色,#RGB 或 #RRGGBB */
  bg: string;
  /** 文字颜色,#RGB 或 #RRGGBB */
  color: string;
  /** 居中文字;空白时用 "{width}×{height}" */
  text: string;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 生成占位图 SVG 字符串。非法输入 → null:
 * 宽高非有限 / 超出 1–5000、颜色非 #RGB / #RRGGBB。
 * 字号随最短边与文字长度自适应,永远是有界有限值(1×1 也不产生 NaN)。
 */
export function placeholderSvg(opts: PlaceholderOpts): string | null {
  const width = Math.round(opts.width);
  const height = Math.round(opts.height);
  if (!Number.isFinite(width) || width < 1 || width > PLACEHOLDER_MAX) return null;
  if (!Number.isFinite(height) || height < 1 || height > PLACEHOLDER_MAX) return null;
  if (typeof opts.bg !== "string" || !HEX_RE.test(opts.bg)) return null;
  if (typeof opts.color !== "string" || !HEX_RE.test(opts.color)) return null;

  const text = opts.text.trim() === "" ? `${width}×${height}` : opts.text;
  const short = Math.min(width, height);
  // 文字越长字号越小;以最短边的 1/2.2 为上限,以 1 为下限
  const fontSize = Math.max(1, short / Math.max(2.2, text.length * 0.62));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"` +
    ` viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(text)}">` +
    `<rect width="100%" height="100%" fill="${opts.bg}"/>` +
    `<text x="50%" y="50%" fill="${opts.color}"` +
    ` font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"` +
    ` font-size="${fontSize.toFixed(1)}" text-anchor="middle" dominant-baseline="central">` +
    `${escapeXml(text)}</text></svg>`
  );
}
