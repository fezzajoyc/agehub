import { dict } from "@/lib/i18n";
import { isLocale, LOCALES, type Locale } from "@/lib/site";
import { Container, Prose, SectionHead } from "@/components/ui";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const CONTENT: Partial<Record<Locale, { title: string; body: string[] }>> = {
  en: {
    title: "Privacy",
    body: [
      "Short version: we do not collect your files, your text or your inputs, because they never reach us.",
      "All tools run client-side in your browser. Files you process are read with the browser's File API and processed in memory on your device; they are never transmitted to us or to any third party. Text and numbers you enter stay in the page.",
      "We serve the site through a hosting provider's CDN, which processes standard request metadata (IP address, user agent) for security and abuse prevention, as described in the provider's privacy policy. If analytics are enabled, they are aggregate and cookieless.",
      "We store no accounts, no passwords and no uploaded content, because there is nothing to store.",
    ],
  },
  zh: {
    title: "隐私政策",
    body: [
      "一句话:我们不收集你的文件、文本或输入,因为它们根本不会到达我们这里。",
      "所有工具在浏览器端运行。你处理的文件通过浏览器 File API 读取,在设备内存中处理,不会传给我们或任何第三方;你输入的文本和数字只停留在页面里。",
      "本站通过托管服务商的 CDN 分发,该 CDN 会为安全与防滥用处理标准请求元数据(IP、User-Agent),详见其隐私政策。如启用统计,则为无 Cookie 的聚合统计。",
      "我们不存储账号、密码或任何上传内容——因为根本没有可存的东西。",
    ],
  },
  ja: {
    title: "プライバシー",
    body: [
      "要点を先に:ファイルもテキストも入力も、こちらには届かないため収集しません。",
      "すべてのツールはブラウザ内で動きます。処理するファイルはブラウザの File API で読み込み、デバイスのメモリ内で処理され、当社や第三者に送信されることはありません。入力したテキストや数値はページの中にとどまります。",
      "サイトはホスティング事業者の CDN から配信され、セキュリティと不正利用防止のため標準的なリクエストメタデータ(IP アドレス、User-Agent)が処理されます。詳細は事業者のプライバシーポリシーをご覧ください。統計を有効にする場合は、Cookie を使わない集計のみです。",
      "アカウントもパスワードもアップロードされたコンテンツも保存しません。保存するものが存在しないためです。",
    ],
  },
  es: {
    title: "Privacidad",
    body: [
      "En una frase: no recogemos tus archivos, tu texto ni tus datos, porque nunca llegan a nosotros.",
      "Todas las herramientas se ejecutan en tu navegador. Los archivos que procesas se leen con la File API del navegador y se procesan en la memoria de tu dispositivo; nunca se transmiten a nosotros ni a terceros. El texto y los números que introduces se quedan en la página.",
      "El sitio se sirve a través del CDN del proveedor de hosting, que procesa metadatos estándar de la solicitud (IP, user agent) por seguridad y prevención de abusos, según su política de privacidad. Si hay analíticas, son agregadas y sin cookies.",
      "No almacenamos cuentas, contraseñas ni contenido subido, porque no hay nada que almacenar.",
    ],
  },
  pt: {
    title: "Privacidade",
    body: [
      "Resumindo: não coletamos seus arquivos, seu texto ou seus dados, porque eles nunca chegam até nós.",
      "Todas as ferramentas rodam no seu navegador. Os arquivos que você processa são lidos com a File API do navegador e processados na memória do seu dispositivo; nunca são transmitidos para nós ou para terceiros. Texto e números que você digita ficam na página.",
      "O site é servido pelo CDN do provedor de hospedagem, que processa metadados padrão de requisição (IP, user agent) por segurança e prevenção a abusos, conforme a política do provedor. Se houver analytics, são agregados e sem cookies.",
      "Não armazenamos contas, senhas nem conteúdo enviado, porque não há nada para armazenar.",
    ],
  },
};

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return null;
  const content = CONTENT[lang as Locale] ?? CONTENT.en!;
  return (
    <Container className="max-w-3xl py-12">
      <SectionHead title={content.title} />
      <Prose paragraphs={content.body} />
    </Container>
  );
}
