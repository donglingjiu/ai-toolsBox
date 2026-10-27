// /llm/<provider>/<path> → 上游；无 Key 请求自动注入服务端 Key
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const seg = url.pathname.slice(5).split('/').filter(Boolean);
  const UP = {
    bigmodel: 'https://open.bigmodel.cn',
    dashscope: 'https://dashscope.aliyuncs.com',
    deepseek: 'https://api.deepseek.com',
    moonshot: 'https://api.moonshot.cn',
    siliconflow: 'https://api.siliconflow.cn',
    minimax: 'https://api.minimaxi.com',
    openai: 'https://api.openai.com',
    openrouter: 'https://openrouter.ai'
  };
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  const base = UP[seg[0]];
  if (!base) {
    return new Response(JSON.stringify(
      { error: { message: 'unknown provider' } }),
      { status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  const fwd = new Headers(request.headers);
  ['host', 'origin', 'referer', 'cookie'].forEach(h => fwd.delete(h));
  const auth = (fwd.get('authorization') || '').trim();
  const hasKey = /^Bearer\s+\S+$/.test(auth);
  if (!hasKey) {
    const KEYS = {
      bigmodel: env.ZHIPU_API_KEY || env.BIGMODEL_API_KEY,
      dashscope: env.DASHSCOPE_API_KEY,
      deepseek: env.DEEPSEEK_API_KEY,
      moonshot: env.MOONSHOT_API_KEY,
      siliconflow: env.SILICONFLOW_API_KEY,
      minimax: env.MINIMAX_API_KEY,
      openai: env.OPENAI_API_KEY,
      openrouter: env.OPENROUTER_API_KEY
    };
    const k = KEYS[seg[0]];
    if (k) fwd.set('authorization', 'Bearer ' + k);
  }
  const up = await fetch(
    base + '/' + seg.slice(1).join('/') + url.search,
    { method: request.method, headers: fwd,
      body: request.method === 'GET'
        ? undefined : await request.arrayBuffer() });
  const h = new Headers(up.headers);
  Object.entries(CORS).forEach(([k, v]) => h.set(k, v));
  h.delete('set-cookie');
  return new Response(up.body,
    { status: up.status, headers: h });
}

