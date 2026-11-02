import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // 全站纯客户端工具 + SSG,无任何自持 API。重库(pdf.js / tesseract / heic2any …)
  // 一律在工具组件内 await import() 动态加载,主包保持精简。
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      // AI 答案页:/{lang}/tools/{slug}.md → 纯文本 Markdown 路由
      { source: "/:lang/tools/:slug.md", destination: "/:lang/tools-md/:slug" },
    ];
  },
  async redirects() {
    return [
      { source: "/tool/:slug", destination: "/en/tools/:slug", permanent: true },
      { source: "/category/:cat", destination: "/en/categories/:cat", permanent: true },
    ];
  },
};

export default nextConfig;
