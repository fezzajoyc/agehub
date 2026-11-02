#!/usr/bin/env node
/**
 * 发布门禁(playbook §6 第 1 条):对运行中的站点做全量 SEO 审计。
 *
 *   BASE=http://localhost:3000 node scripts/seo-audit.mjs [--lang en]
 *
 * 对 sitemap 每条 URL 检查:
 *   1. HTTP 200(诚实 404 不破)
 *   2. canonical 自指且与 sitemap 一致
 *   3. hreflang 数 = 语言数 + x-default
 *   4. 恰好一个 <h1>,title 非空
 *   5. 工具页有 og:image 与 FAQPage 结构化数据
 * 任何失败 → 进程退出码 1(接 CI / 发布流水线)。
 */
const BASE = process.env.BASE ?? "http://localhost:3456";
const args = process.argv.slice(2);
const langFilter = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
let urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (langFilter) urls = urls.filter((u) => new RegExp(`/${langFilter}(/|$)`).test(u));
const sitemapOrigin = new URL(urls[0]).origin;
console.log(`审计 ${urls.length} 条 URL(基准 ${BASE},sitemap 来源 ${sitemapOrigin})`);

const CONCURRENCY = 24;
const failures = [];
const titles = new Map();
let checked = 0;

async function audit(url) {
  const problems = [];
  const localUrl = sitemapOrigin === BASE ? url : url.replace(sitemapOrigin, BASE);
  let res;
  try {
    res = await fetch(localUrl, { redirect: "follow" });
  } catch (e) {
    return { url, problems: [`fetch 失败:${e.message}`] };
  }
  if (res.status !== 200) problems.push(`HTTP ${res.status}`);
  else {
    const html = await res.text();
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical) problems.push("缺 canonical");
    else if (canonical !== url) problems.push(`canonical 不一致: ${canonical}`);
    const hreflang = (html.match(/hreflang=/gi) ?? []).length;
    if (hreflang < 15) problems.push(`hreflang 仅 ${hreflang}(应 ≥15)`);
    const h1 = (html.match(/<h1[ >]/g) ?? []).length;
    if (h1 !== 1) problems.push(`<h1> 数量 ${h1}(应恰好 1)`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    if (!title.trim()) problems.push("title 为空");
    if (titles.has(title) && title) problems.push(`title 重复(与 ${titles.get(title)})`);
    else titles.set(title, url);
    if (/\/tools\//.test(url) && !/\.md$/.test(url)) {
      if (!/og:image/.test(html)) problems.push("缺 og:image");
      if (!/FAQPage/.test(html)) problems.push("缺 FAQPage 结构化数据");
    }
  }
  checked++;
  if (checked % 500 === 0) console.log(`  … ${checked}/${urls.length}`);
  return { url, problems };
}

const queue = [...urls];
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const url = queue.shift();
    const r = await audit(url);
    if (r.problems.length) failures.push(r);
  }
});
await Promise.all(workers);

if (failures.length) {
  console.error(`\n✗ ${failures.length} 条 URL 未通过:`);
  for (const f of failures.slice(0, 30)) {
    console.error(`  ${f.url}\n    - ${f.problems.join("\n    - ")}`);
  }
  if (failures.length > 30) console.error(`  …另外 ${failures.length - 30} 条`);
  process.exit(1);
}
console.log(`\n✓ ${urls.length} 条 URL 全部通过(canonical/hreflang/h1/title/OG/FAQ)`);
