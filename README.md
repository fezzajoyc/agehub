# AgeHub

由脚手架生成(标准见 workspace 的 site-engineering skill)。

## 下一步

1. 从 docs/portfolio-plan.md 挑工具清单(真实需求证据),逐个实现(每工具:引擎 + 测试 + 15 语文案)。
2. 删除种子工具 `tools/utility/sample-tool.ts`(上线前必须)。
3. 域名拍板后配 `.env.local`,跑 `BASE=<url> npm run audit:seo` 门禁,再按 launch-runbook 提交。
4. AI 表面:给每个新工具在 `mcp/tools.ts` 注册 MCP 工具(纯函数 + zod),`npm run build:mcp` 打包,发布到官方 MCP Registry。
