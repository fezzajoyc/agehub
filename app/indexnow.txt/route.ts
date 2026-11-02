// IndexNow key 文件:/indexnow-<key>.txt
// 固定路径路由(静态导出友好),内容取自构建时环境变量;未设则 404 防探测。
export const dynamic = "force-static";

export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
