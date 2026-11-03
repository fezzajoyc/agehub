import type { CategoryId, Locale } from "@/lib/site";
import type { ToolCopy } from "./types";

/**
 * 类目 FAQ 池:工具页 FAQ 不足 6 条时按类目补齐(JSON-LD 同源走 toolCopy)。
 * 内容写"这个类目共同的真问题"(隐私/收费/格式/精度/浏览器支持),不是凑数占位。
 * 只写核心 5 语(en/zh/ja/es/pt);其他 locale toolCopy 本来就走 overlay 或回退 en。
 */
type Faq = { q: string; a: string };

const GLOBAL: Partial<Record<Locale, Faq[]>> = {
  en: [
    {
      q: "Is this tool free to use?",
      a: "Yes, completely free — no signup, no subscription, no daily limits, and no watermarks on the output.",
    },
    {
      q: "Does my data leave my device?",
      a: "No. The tool runs entirely in your browser with JavaScript. Nothing you type or upload is sent to a server, so it even works offline once the page has loaded.",
    },
    {
      q: "Which browsers does it work in?",
      a: "Any modern browser — Chrome, Firefox, Safari and Edge on desktop and mobile. No plugins or extensions are needed.",
    },
  ],
  zh: [
    {
      q: "这个工具免费吗?",
      a: "完全免费 — 无需注册、没有订阅、无每日限额,输出不带水印。",
    },
    {
      q: "我的数据会传到服务器吗?",
      a: "不会。工具完全在浏览器里用 JavaScript 运行,输入的文件和内容不会发送到任何服务器;页面加载后断网也能用。",
    },
    {
      q: "支持哪些浏览器?",
      a: "所有现代浏览器 — Chrome、Firefox、Safari、Edge,桌面和移动端通用,无需安装插件。",
    },
  ],
  ja: [
    {
      q: "このツールは無料ですか?",
      a: "完全無料です。登録・課金・回数制限はなく、出力にウォーターマークも入りません。",
    },
    {
      q: "入力したデータは外部に送信されますか?",
      a: "送信されません。すべてブラウザ内の JavaScript で処理されるため、入力・ファイルはサーバーに送られず、読み込み後はオフラインでも動作します。",
    },
    {
      q: "対応ブラウザは?",
      a: "Chrome / Firefox / Safari / Edge の最新版(デスクトップ・モバイル共通)。プラグインや拡張機能は不要です。",
    },
  ],
  es: [
    {
      q: "¿Esta herramienta es gratis?",
      a: "Sí, totalmente gratis: sin registro, sin suscripción, sin límites diarios y sin marcas de agua.",
    },
    {
      q: "¿Mis datos salen de mi dispositivo?",
      a: "No. Todo se procesa con JavaScript en tu navegador; nada se envía a un servidor. Incluso funciona sin conexión una vez cargada la página.",
    },
    {
      q: "¿En qué navegadores funciona?",
      a: "Cualquier navegador moderno: Chrome, Firefox, Safari y Edge, en escritorio y móvil. Sin plugins ni extensiones.",
    },
  ],
  pt: [
    {
      q: "Esta ferramenta é gratuita?",
      a: "Sim, totalmente gratuita — sem cadastro, sem assinatura, sem limites diários e sem marcas d'água.",
    },
    {
      q: "Meus dados saem do dispositivo?",
      a: "Não. A ferramenta roda inteiramente no seu navegador com JavaScript; nada é enviado a servidores e funciona até offline depois de carregada.",
    },
    {
      q: "Quais navegadores são suportados?",
      a: "Qualquer navegador moderno — Chrome, Firefox, Safari e Edge, no desktop e no celular. Nenhum plugin necessário.",
    },
  ],
};

const BY_CATEGORY: Partial<Record<CategoryId, Partial<Record<Locale, Faq[]>>>> = {

};

/** 取某类目的补充 FAQ 池(global 池 + 类目池,en 缺省回退) */
export function categoryFaqPool(category: CategoryId, locale: Locale): Faq[] {
  const extra = BY_CATEGORY[category]?.[locale] ?? BY_CATEGORY[category]?.en ?? [];
  const global = GLOBAL[locale] ?? GLOBAL.en ?? [];
  return [...extra, ...global];
}
