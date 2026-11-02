import { defineTool } from "../_lib/types";
import { SeedEngine } from "../_engines/seed";

// PLACEHOLDER 种子工具:保证脚手架可构建、测试可跑。
// 上线前必须删除,替换为 docs/portfolio-plan.md 中调研过的真实工具。
export default defineTool({
  slug: "sample-tool",
  category: "utility",
  icon: "sparkle",
  engine: { component: SeedEngine, props: {} },
  copy: {
    en: {
      name: "Sample Tool",
      tagline: "Placeholder seed tool from the site scaffold — replace it before launching this site.",
      intro: ["This is the scaffold seed. Replace it with the first real tool from the portfolio plan."],
      steps: ["Replace this tool", "Add real tools from the plan", "Run npm run audit:seo"],
      faqs: [
      { q: "Why is this tool here?", a: "It keeps the scaffold buildable until the first real tool ships." },
      { q: "Will it stay after launch?", a: "No — the seed is replaced by real tools from the portfolio plan before launch." },
    ],
    },
  },
  related: [],
});
