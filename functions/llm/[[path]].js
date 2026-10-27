const UPSTREAM = {
  bigmodel: "https://open.bigmodel.cn",
  dashscope: "https://dashscope.aliyuncs.com",
  deepseek: "https://api.deepseek.com",
  moonshot: "https://api.moonshot.cn",
  siliconflow: "https://api.siliconflow.cn",
  openai: "https://api.openai.com",
  openrouter: "https://openrouter.ai",
};
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};
export async function onRequest({ request, params }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const seg = params.path || [];
  const base = UPSTREAM[seg[0]];
  if (!base) return new Response(JSON.stringify({ error: "unknown provider: " + seg[0] }),
    { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
  const url = new URL(request.url);
  const target = base + "/" + seg.slice(1).join("/") + url.search;
  const fwd = new Headers(request.headers);
  ["host", "origin", "referer", "cookie"].forEach((h) => fwd.delete(h));
  const up = await fetch(target, {
    method: request.method,
    headers: fwd,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
  });
  const h = new Headers(up.headers);
  Object.entries(CORS).forEach(([k, v]) => h.set(k, v));
  h.delete("set-cookie");
  return new Response(up.body, { status: up.status, headers: h });
}
