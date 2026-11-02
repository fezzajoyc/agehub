#!/usr/bin/env node
/**
 * IndexNow 推送:部署后运行一次,把 sitemap 全量 URL 提交给 IndexNow
 * (Bing/Seznam/Naver/Yandex 即时索引;Google 用 GSC)。
 *
 * 用法:
 *   SITE_DOMAIN=https://zoyku.com INDEXNOW_KEY=<key> node scripts/indexnow-push.mjs
 * 或写入 .env.local 后:npm run push:indexnow
 */
import { readFileSync } from "node:fs";

const envFile = (() => {
  try {
    return readFileSync(".env.local", "utf8");
  } catch {
    return "";
  }
})();
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const domain = process.env.SITE_DOMAIN ?? env.SITE_DOMAIN ?? "https://zoyku.com";
const key = process.env.INDEXNOW_KEY ?? env.INDEXNOW_KEY;
if (!key) {
  console.error("缺少 INDEXNOW_KEY(生成:openssl rand -hex 16)");
  process.exit(1);
}

const sitemap = await (await fetch(`${domain}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`sitemap 取得 ${urls.length} 条 URL`);

// IndexNow 单请求上限 10k 条
const batches = [];
for (let i = 0; i < urls.length; i += 10000) batches.push(urls.slice(i, i + 10000));

let ok = 0;
for (const batch of batches) {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: domain.replace(/^https?:\/\//, ""),
      key,
      keyLocation: `${domain}/indexnow-${key}.txt`,
      urlList: batch,
    }),
  });
  console.log(`批次 ${ok + 1}: HTTP ${res.status}(${batch.length} 条)`);
  if (res.ok || res.status === 202) ok++;
}
console.log(ok === batches.length ? "全部批次提交成功 ✓" : "存在失败批次,请重试");
