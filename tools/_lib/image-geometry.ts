/** 三个图像几何工具的纯决策逻辑(从 UI 抽出,Node 可测):
 *  1. 加边框(border):画布向外扩展、图像平移、输出格式裁决
 *  2. 切分(splitter):行列切块、余数吸收、文件命名
 *  3. 圆形裁剪(circle):直径计算、居中偏移、最小可用百分比
 *
 * 约定:数值非法(NaN / Infinity / 非正尺寸)一律返回 null;
 * 越界但在滑块量程内的数值做 clamp(滑块语义),不视为错误。
 */

/* ------------------------------------------------------------------ */
/* 共用                                                                */
/* ------------------------------------------------------------------ */

/** 浏览器 canvas 的最大边长(主流实现 16384,取保守上限)。 */
export const MAX_CANVAS_SIDE = 16384;

/** photo.jpg → photo;无扩展名、点开头等边界与 image-util.outputName 同语义。 */
export function imageBaseName(name: string): string {
  const noExt = name.replace(/\.[^.]+$/, "");
  return noExt || name;
}

function isFiniteInt(v: number): boolean {
  return Number.isFinite(v) && Number.isInteger(v);
}

/* ------------------------------------------------------------------ */
/* 1. 加边框                                                            */
/* ------------------------------------------------------------------ */

/** 边框滑块上限(px)。 */
export const MAX_BORDER = 250;

export type BorderMode = "transparent" | "color";
export type BorderFormat = "image/png" | "image/jpeg";

export type BorderPlan = {
  /** 输出画布尺寸 = (width + 2×border) × (height + 2×border) */
  canvasWidth: number;
  canvasHeight: number;
  /** 原图在画布上的落点(= 各方向边框宽) */
  offsetX: number;
  offsetY: number;
  /** clamp 后实际使用的边框宽 */
  border: number;
  /** 裁决后的输出格式:transparent 强制 PNG,color 按请求(默认 PNG) */
  format: BorderFormat;
  ext: "png" | "jpg";
};

/**
 * 加边框几何:画布在四周各扩 border px,原图原尺寸放在 (border, border)。
 * - mode = "transparent":输出强制 PNG(JPG 无 alpha,边框会变白);
 * - mode = "color":按请求格式输出,缺省/非法值回退 PNG;
 * - border 非负向下取整并 clamp 到 [0, MAX_BORDER];
 * - 画布任一边超过 MAX_CANVAS_SIDE 视为不可渲染,返回 null。
 */
export function computeBorderPlan(input: {
  width: number;
  height: number;
  border: number;
  mode: BorderMode;
  format?: BorderFormat;
}): BorderPlan | null {
  const { width, height, border, mode } = input;
  if (!isFiniteInt(width) || !isFiniteInt(height) || width < 1 || height < 1) return null;
  if (!Number.isFinite(border)) return null;
  const b = Math.min(MAX_BORDER, Math.max(0, Math.floor(border)));

  const canvasWidth = width + 2 * b;
  const canvasHeight = height + 2 * b;
  if (canvasWidth > MAX_CANVAS_SIDE || canvasHeight > MAX_CANVAS_SIDE) return null;

  const format: BorderFormat =
    mode === "transparent" || input.format !== "image/jpeg" ? "image/png" : "image/jpeg";
  return {
    canvasWidth,
    canvasHeight,
    offsetX: b,
    offsetY: b,
    border: b,
    format,
    ext: format === "image/png" ? "png" : "jpg",
  };
}

/* ------------------------------------------------------------------ */
/* 2. 切分                                                              */
/* ------------------------------------------------------------------ */

/** 行 / 列允许范围(两端都含)。 */
export const MIN_GRID = 2;
export const MAX_GRID = 6;

export type Tile = {
  /** 0 基行 / 列下标;文件名里用 1 基 */
  row: number;
  col: number;
  /** 源图上的取图矩形(整数像素) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** {base}-r{row+1}c{col+1}.png */
  name: string;
};

/** {base}-r{row}c{col}.png,row/col 为 1 基。 */
export function tileName(base: string, row: number, col: number): string {
  return `${base}-r${row}c${col}.png`;
}

/** 行列值 clamp 到 [MIN_GRID, MAX_GRID];NaN 视为非法。 */
export function clampGrid(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  return Math.min(MAX_GRID, Math.max(MIN_GRID, Math.floor(v)));
}

/**
 * 行 × 列切分:每块宽 = floor(width / cols)、高 = floor(height / rows),
 * 余数全部由最后一行 / 最后一列吸收(整块拼接 = 原图,无拉伸无缝隙)。
 * 常规块必须 ≥ 1px(即 width ≥ cols、height ≥ rows),否则返回 null。
 */
export function computeTileGrid(
  width: number,
  height: number,
  rowsIn: number,
  colsIn: number,
  base: string,
): Tile[] | null {
  if (!isFiniteInt(width) || !isFiniteInt(height) || width < 1 || height < 1) return null;
  const rows = clampGrid(rowsIn);
  const cols = clampGrid(colsIn);
  if (rows === null || cols === null) return null;
  const tileW = Math.floor(width / cols);
  const tileH = Math.floor(height / rows);
  if (tileW < 1 || tileH < 1) return null;

  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isLastRow = row === rows - 1;
      const isLastCol = col === cols - 1;
      const x = col * tileW;
      const y = row * tileH;
      tiles.push({
        row,
        col,
        x,
        y,
        w: isLastCol ? width - x : tileW,
        h: isLastRow ? height - y : tileH,
        name: tileName(base, row + 1, col + 1),
      });
    }
  }
  return tiles;
}

/* ------------------------------------------------------------------ */
/* 3. 圆形裁剪                                                          */
/* ------------------------------------------------------------------ */

/** 直径缩放滑块范围(%),两端都含。 */
export const MIN_SHRINK_PCT = 10;
export const MAX_SHRINK_PCT = 100;

export type CirclePlan = {
  /** 圆的直径 = floor(min(width, height) × pct / 100) */
  d: number;
  /** 圆形正方形区域在源图上的左上角(居中,向下取整) */
  cx: number;
  cy: number;
};

/**
 * 圆形裁剪几何:直径默认等于短边(pct = 100),缩小滑块按百分比调小。
 * pct 越界 clamp 到 [MIN_SHRINK_PCT, MAX_SHRINK_PCT] 后向下取整;
 * NaN / 非法尺寸 / 直径不足 1px 返回 null。
 */
export function computeCirclePlan(
  width: number,
  height: number,
  pctIn: number,
): CirclePlan | null {
  if (!isFiniteInt(width) || !isFiniteInt(height) || width < 1 || height < 1) return null;
  if (!Number.isFinite(pctIn)) return null;
  const pct = Math.min(MAX_SHRINK_PCT, Math.max(MIN_SHRINK_PCT, Math.floor(pctIn)));
  const d = Math.floor((Math.min(width, height) * pct) / 100);
  if (d < 1) return null;
  return { d, cx: Math.floor((width - d) / 2), cy: Math.floor((height - d) / 2) };
}

/**
 * 让直径 ≥ 1px 的最小整数百分比(clamp 到滑块量程)。
 * 引擎用它把有效百分比抬高到 min(pct, 这个值),极小图也能出 1px 圆。
 */
export function minPctForDiameter(width: number, height: number): number {
  if (!isFiniteInt(width) || !isFiniteInt(height) || width < 1 || height < 1) {
    return MAX_SHRINK_PCT;
  }
  const need = Math.ceil(100 / Math.min(width, height));
  return Math.min(MAX_SHRINK_PCT, Math.max(MIN_SHRINK_PCT, need));
}
