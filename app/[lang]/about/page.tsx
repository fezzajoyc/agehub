import { dict } from "@/lib/i18n";
import { isLocale, LOCALES, type Locale } from "@/lib/site";
import { ALL_TOOLS } from "@/tools/registry";
import { Container, Prose, SectionHead } from "@/components/ui";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const CONTENT: Partial<Record<Locale, string[]>> = {
  en: [
    "Zoyku is a collection of free online tools that run entirely in your browser. There is no backend: files you open, text you paste and numbers you enter are processed by JavaScript on your own device.",
    "That design gives us three properties we care about. It is private by construction — there is nothing to upload, so nothing can leak. It is fast — there is no round trip to a server. And it is honest — every tool does exactly what the page says, no tricks.",
    "The tools are grouped into PDF, image, text, developer, SEO, security and utility categories. New tools are added regularly; if a tool would be better designed differently from the usual pattern, we design it that way.",
  ],
  zh: [
    "Zoyku 是一组完全在浏览器里运行的免费在线工具。没有后端:你打开的文件、粘贴的文本、输入的数字,都由你自己设备上的 JavaScript 处理。",
    "这个设计带来三个我们看重的性质:隐私是构造出来的——没有上传,就谈不上泄露;速度快——没有服务器往返;诚实——每个工具都做页面所说的事,不玩花样。",
    "工具分为 PDF、图片、文本、开发者、SEO、安全和实用工具七类,持续新增。如果某个工具用不同于惯例的设计更好用,我们就按那个设计做。",
  ],
  ja: [
    "Zoyku は、完全にブラウザ内で動く無料オンラインツールのコレクションです。バックエンドはありません。開いたファイル、貼り付けたテキスト、入力した数値は、すべて自分のデバイス上の JavaScript が処理します。",
    "この設計には、私たちが大切にする 3 つの性質があります。プライバシーは構造的に保証される(アップロードがないので漏えいもない)、速い(サーバー往復がない)、そして誠実(各ツールはページに書かれた通りのことだけをする)。",
    "ツールは PDF・画像・テキスト・開発者・SEO・セキュリティ・ユーティリティの 7 カテゴリーに分かれ、随時追加しています。常識的な作りより別の設計が良い道具は、その設計で作ります。",
  ],
  es: [
    "Zoyku es una colección de herramientas online gratuitas que funcionan por completo en tu navegador. No hay backend: los archivos que abres, el texto que pegas y los números que introduces los procesa el JavaScript de tu propio dispositivo.",
    "Ese diseño nos da tres propiedades que nos importan. Privacidad por construcción: no hay subidas, así que no puede haber fugas. Velocidad: sin viajes de ida y vuelta al servidor. Honestidad: cada herramienta hace exactamente lo que dice su página.",
    "Las herramientas se agrupan en PDF, imagen, texto, desarrollo, SEO, seguridad y utilidades, y se añaden nuevas con regularidad. Si una herramienta funciona mejor con un diseño distinto al habitual, la diseñamos así.",
  ],
  pt: [
    "Zoyku é uma coleção de ferramentas online gratuitas que rodam inteiramente no seu navegador. Não há backend: os arquivos que você abre, o texto que cola e os números que digita são processados pelo JavaScript do seu próprio dispositivo.",
    "Esse design nos dá três propriedades que valorizamos. Privacidade por construção: não há uploads, logo não há vazamentos. Velocidade: sem viagem ao servidor. Honestidade: cada ferramenta faz exatamente o que a página diz.",
    "As ferramentas se dividem em PDF, imagem, texto, desenvolvedor, SEO, segurança e utilidades, com novidades regulares. Se uma ferramenta funciona melhor com um design diferente do usual, a projetamos assim.",
  ],
};

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return null;
  const t = dict(lang as Locale);
  return (
    <Container className="max-w-3xl py-12">
      <SectionHead title={t.nav.about} />
      <Prose paragraphs={CONTENT[lang as Locale] ?? CONTENT.en!} />
      <p className="mt-6 text-[14px] text-[var(--color-sub)]">
        {ALL_TOOLS.length} tools · {LOCALES.length} languages
      </p>
    </Container>
  );
}
