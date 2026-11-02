# 上线与排名 Runbook

> 排名公式(playbook §0):域名年纪 40% + 页面量 30% + 外链 20% + 词和技术 10%。
> 代码侧:页面量(2010 工具页)与技术已拉满;本 runbook 覆盖剩下两件事的执行顺序。

## Phase 1 — 部署(半天)

1. 域名拍板,写入 `.env.local` 与 Vercel 环境变量:
   - `NEXT_PUBLIC_SITE_DOMAIN` / `SITE_DOMAIN`(影响 canonical/sitemap/hreflang/OG 全部绝对地址)
   - 见 `.env.example` 全表
2. Vercel 导入本仓库(框架自动识别 Next.js),先部署 preview 确认。
3. 绑定生产域名 + HTTPS。
4. 生成 IndexNow key:`openssl rand -hex 16`,写入 `INDEXNOW_KEY` 环境变量。
5. **跑发布门禁**:
   ```bash
   BASE=https://<domain> npm run audit:seo        # 全量 6365 页
   ```
   任何失败先修再上线。此后每次大改版后重跑。

## Phase 2 — 提交(上线当天)

1. **GSC**(search.google.com/search-console):域名资源型(DNS 验证)或 URL 前缀(配 `GOOGLE_SITE_VERIFICATION` 环境变量);提交 `https://<domain>/sitemap.xml`。
2. **Bing**(bing.com/webmasters):从 GSC 一键导入;或 `BING_SITE_VERIFICATION` 环境变量 + 提交 sitemap。
3. **IndexNow**(覆盖 Bing/Naver/Seznam/Yandex):
   ```bash
   npm run push:indexnow
   ```
4. **百度**(ziyuan.baidu.com):`BAIDU_SITE_VERIFICATION` 环境变量 + 提交 sitemap(普通收录)。注:百度对无备案的海外站收录有限,预期管理。
5. **Yandex**:`YANDEX_VERIFICATION` + sitemap。

## Phase 2.5 — AI 渠道(与外链并行,AI 是新的流量入口)

1. **MCP Registry**:发布 `zoyku-mcp` 到官方 MCP Registry(证明反向 DNS 命名空间所有权即可,发布=收录)。
2. **Smithery**:提交并维护 Smithery 评分(评分直接决定目录内搜索排名,85+ 才显眼)。
3. **PulseMCP**:提交暂停中——已在官方 Registry 即会被自动拾取,定期回查。
4. **被动收录**:mcp.so、Glama 抓取官方 Registry,无需动作。
5. **AI 可发现性自检**:每个工具的 `.md` 答案页可访问、llms.txt 含 MCP 段与工具清单、结构化数据完整——这些决定 AI 搜索(Perplexity/ChatGPT search)是否把站当信源。Zoyku 已实测:Perplexity 单日抓档案页 12,228 次。

## Phase 3 — 外链(上线第 1 周,持续)

1. **徽章分发**(star-history 模式):`/{lang}/badge` 页有 12 种徽章与现成嵌入码。目标场景:开源 README、开发者博客、工具榜单站。
2. **目录/榜单提交**(每条 = 一条真实外链):
   - alternative.to、Product Hunt、Toolfinder、ailist 类聚合站
   - awesome-* GitHub 列表 PR(awesome-cursorlist 式:tools-for-webdevs)
   - HackerNews Show HN / V2EX / 即刻(首发节奏自己定)
3. 提交时落地页用 `/en`(国际)与 `/zh`(国内),徽章做品牌锚。

## Phase 4 — 监测与节奏(上线后持续)

1. **GSC 三基线**(playbook §5.2):抓取量 / 有效索引量 / 展示点击,分开记,每周一次读数。
2. **预期管理**:新域名 2–3 个月爬坡期。第一个月:抓取 ↑、索引缓慢、展示≈0 = **正常**;不在此期间改版。
3. **单变量纪律**:每次只动一个 SEO 变量,记录到 git + `docs/` 变更日志,观察一个 GSC 周期再动下一个。
4. **品牌词防御**(上线 1 个月后):每周搜一次 "Zoyku",发现蹭名站看 CTR 稀释度再行动。
5. **CWV**:上线当周 PageSpeed Insights 跑一轮桌面+移动基线并记录(之后每次改版对比)。

## 已就位的基础设施(代码侧,无需再动)

| 项 | 状态 |
|---|---|
| 2010 工具页 × 独立 title/desc/canonical/hreflang(16 行) | ✅ |
| FAQPage + WebApplication + BreadcrumbList JSON-LD 全站 | ✅ |
| .md AI 答案页(2010)+ llms.txt | ✅ |
| OG 分享图(2070 张)+ RSS + 徽章引擎(12 变体) | ✅ |
| 站长验证直出(GSC/Bing/百度/Yandex,配 env 即用) | ✅ |
| IndexNow key 直出 + 全量推送脚本 | ✅ |
| 发布门禁审计脚本(`npm run audit:seo`) | ✅ |
| 诚实 404 / 验证文件未配置即 404 | ✅ |
