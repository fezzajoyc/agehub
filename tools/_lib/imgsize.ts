/**
 * 按目标字节压缩的纯搜索逻辑,Node 可测(探针注入,不依赖 Canvas)。
 *
 * searchQuality:对"编码质量 → 输出字节数"的单调探针做二分,找拟合边界。
 * 方向自适应:真实编码器(JPEG/WebP)字节数随质量上升 → 返回不超目标的最高质量;
 * 若探针随质量下降(合成表)→ 返回不超目标的最低起点。两种方向下返回值都满足
 * probe(quality) ≤ target,且离真实边界不超过 (max−min)/2^24。
 *
 * 两个端点都超目标 → { ok:false, reason:"unreachable" },如实报告最接近的端点
 * (字节最小的那个)—— 引擎据此进入渐进降采样,最终仍不可达时诚实告知用户。
 */

export type QualitySearchOk = { ok: true; quality: number; probes: number };
export type QualitySearchFail = {
  ok: false;
  reason: "unreachable";
  /** 字节最小的一端的质量 */
  bestQuality: number;
  /** 该端点的字节数 */
  bestBytes: number;
  probes: number;
};
export type QualitySearchResult = QualitySearchOk | QualitySearchFail;

/** 二分迭代次数:0.9 的搜索区间收敛到 ~5e-8 */
const ITERATIONS = 24;

export async function searchQuality(
  probe: (q: number) => number | Promise<number>,
  targetBytes: number,
  min: number,
  max: number,
): Promise<QualitySearchResult> {
  let lo = min;
  let hi = max;
  if (lo > hi) [lo, hi] = [hi, lo];

  let probes = 0;
  const measure = async (q: number): Promise<number> => {
    probes++;
    const size = await probe(q);
    // 探针异常/非有限值按"不拟合"处理,与 NaN 比较语义一致
    return Number.isFinite(size) ? size : Infinity;
  };

  const sLo = await measure(lo);
  const sHi = await measure(hi);

  const loFits = sLo <= targetBytes;
  const hiFits = sHi <= targetBytes;

  if (loFits && hiFits) return { ok: true, quality: hi, probes };
  if (!loFits && !hiFits) {
    // 整个区间都超目标:如实报告字节最小的一端
    const bestIsLo = sLo <= sHi;
    return {
      ok: false,
      reason: "unreachable",
      bestQuality: bestIsLo ? lo : hi,
      bestBytes: bestIsLo ? sLo : sHi,
      probes,
    };
  }

  // 方向自适应:fit 端点向不拟合端点收敛
  let fit = loFits ? lo : hi; // 拟合端
  let other = loFits ? hi : lo; // 不拟合端
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (fit + other) / 2;
    if ((await measure(mid)) <= targetBytes) fit = mid;
    else other = mid;
  }
  return { ok: true, quality: fit, probes };
}
