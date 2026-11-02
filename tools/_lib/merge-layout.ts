/** 图片拼接布局纯逻辑(从 image-engine-merge 抽出)。 */

export type MergeLayout = "horizontal" | "vertical" | "grid";

export type Dim = { width: number; height: number };
export type Placement = { x: number; y: number; w: number; h: number };

export type MergePlan = {
  width: number;
  height: number;
  place: (dim: Dim, i: number) => Placement;
};

/**
 * horizontal:全体等高(取最小高),按宽比缩放,从左到右;
 * vertical:全体等宽(取最小宽),按高比缩放,从上到下;
 * grid:列数 = ceil(√n),每格取最小边,等比 contain 居中。
 */
export function computeMergeLayout(
  layout: MergeLayout,
  dims: Dim[],
  gap: number,
): MergePlan {
  if (layout === "horizontal") {
    const unit = Math.min(...dims.map((d) => d.height));
    const scaled = dims.map((d) => ({ w: Math.round((d.width / d.height) * unit), h: unit }));
    const width = scaled.reduce((a, s) => a + s.w, 0) + gap * (scaled.length - 1);
    let x = 0;
    return {
      width,
      height: unit,
      place: (_d, i) => {
        const p = { x, y: 0, w: scaled[i].w, h: scaled[i].h };
        x += scaled[i].w + gap;
        return p;
      },
    };
  }
  if (layout === "vertical") {
    const unit = Math.min(...dims.map((d) => d.width));
    const scaled = dims.map((d) => ({ w: unit, h: Math.round((d.height / d.width) * unit) }));
    const height = scaled.reduce((a, s) => a + s.h, 0) + gap * (scaled.length - 1);
    let y = 0;
    return {
      width: unit,
      height,
      place: (_d, i) => {
        const p = { x: 0, y, w: scaled[i].w, h: scaled[i].h };
        y += scaled[i].h + gap;
        return p;
      },
    };
  }
  const cols = Math.ceil(Math.sqrt(dims.length));
  const rows = Math.ceil(dims.length / cols);
  const cell = Math.round(Math.min(...dims.map((d) => Math.min(d.width, d.height))));
  return {
    width: cols * cell + (cols - 1) * gap,
    height: rows * cell + (rows - 1) * gap,
    place: (d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const s = Math.min(cell / d.width, cell / d.height);
      const w = Math.round(d.width * s);
      const h = Math.round(d.height * s);
      return {
        x: col * (cell + gap) + (cell - w) / 2,
        y: row * (cell + gap) + (cell - h) / 2,
        w,
        h,
      };
    },
  };
}
