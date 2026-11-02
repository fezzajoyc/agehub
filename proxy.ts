import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_SET } from "@/lib/site";

const PUBLIC_FILE = /\.(.*)$/;

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
  if (LOCALE_SET.has(seg)) return NextResponse.next();

  const cookieLocale = req.cookies.get("locale")?.value;
  const headerLocale = req.headers
    .get("accept-language")
    ?.split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .map((tag) => tag.split("-")[0])
    .find((base) => LOCALE_SET.has(base));

  const locale = cookieLocale && LOCALE_SET.has(cookieLocale) ? cookieLocale : headerLocale ?? DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};
