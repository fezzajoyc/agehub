import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_SET } from "@/lib/site";

const PUBLIC_FILE = /\.(.*)$/;

/**
 * 滑动窗口限流(边缘 middleware 内存版):
 * - 每 IP+UA 一个计数键,10 秒窗口,上限 40 请求;正常阅读与礼貌爬虫远低于此
 * - 超限 429 + Retry-After,不再走后续页面渲染,直接省 CDN 回源与调用费
 * - Map 上限 5000 键,超出整体重置,防内存膨胀(单实例近似限流,够用)
 */
const WINDOW_MS = 10_000;
const MAX_REQ = 40;
const MAX_KEYS = 5000;
const hits = new Map<string, number[]>();

function rateLimited(req: NextRequest): NextResponse | null {
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 40);
  const key = `${ip}|${ua}`;
  const now = Date.now();

  let arr = hits.get(key);
  if (!arr || now - arr[0] > WINDOW_MS) {
    if (hits.size > MAX_KEYS) hits.clear();
    arr = [];
    hits.set(key, arr);
  }
  arr.push(now);
  if (arr.length > MAX_REQ) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "10" },
    });
  }
  return null;
}

/** 站长验证文件直出(playbook §2.3):Vercel 配好环境变量,URL 即可用;未配置一律 404。 */
function verificationResponse(pathname: string): NextResponse | null {
  const vfile = pathname.slice(1);
  const key = process.env.INDEXNOW_KEY;
  if (key && vfile === `${key}.txt`) {
    return new NextResponse(`${key}\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (vfile === "BingSiteAuth.xml" && process.env.BING_SITE_VERIFICATION) {
    return new NextResponse(
      `<?xml version="1.0"?><Users><User><Role>Admin</Role><Key>${process.env.BING_SITE_VERIFICATION}</Key></User></Users>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }
  const htmlVerifiers: [RegExp, string][] = [
    [/^google[a-f0-9]+\.html$/, "GOOGLE_SITE_VERIFICATION"],
    [/^yandex_[a-f0-9]+\.html$/, "YANDEX_VERIFICATION"],
    [/^baidu_verify_.+\.html$/, "BAIDU_SITE_VERIFICATION"],
  ];
  for (const [re, env] of htmlVerifiers) {
    if (re.test(vfile) && process.env[env] === vfile) {
      return new NextResponse(`${vfile}\n`, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }
  return null;
}

/** `/` 与无语言前缀路径 → 按浏览器语言/cookie 302 到对应 locale */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 验证文件优先于静态文件排除逻辑(文件名带点,但要在 404 前接住)
  const verification = verificationResponse(pathname);
  if (verification) return verification;

  if (
    PUBLIC_FILE.test(pathname) ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1];
  if (LOCALE_SET.has(seg)) {
    return rateLimited(req) ?? NextResponse.next();
  }

  const cookieLocale = req.cookies.get("locale")?.value;
  const headerLocale = req.headers
    .get("accept-language")
    ?.split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .map((tag) => tag.split("-")[0])
    .find((base) => LOCALE_SET.has(base));

  const locale = cookieLocale && LOCALE_SET.has(cookieLocale) ? cookieLocale : headerLocale ?? DEFAULT_LOCALE;
  return rateLimited(req) ?? (() => {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  })();
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};
