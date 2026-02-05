import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../utils/nodeimgCompat.js';

const BRANDING_KEY = 'nodeimg@branding';

function withDefaults(branding = {}) {
  return {
    name: branding.name || 'Nodeimage',
    subtitle: branding.subtitle || 'NodeSeek专用图床·克隆版',
    icon: branding.icon || '',
    footer: branding.footer || 'Nodeimage 克隆版 · 本地演示'
  };
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const raw = await db.get(BRANDING_KEY);
  const branding = raw ? JSON.parse(raw) : {};
  return jsonResponse(withDefaults(branding));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = extractToken(request);
  if (!token) {
    return jsonResponse({ message: '缺少 API Key' }, 401);
  }

  const db = getDb(env);
  const tokenInfo = await findTokenByValue(db, token);
  if (!tokenInfo) {
    return jsonResponse({ message: '无效 API Key' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const branding = withDefaults(body || {});
  await db.put(BRANDING_KEY, JSON.stringify(branding));

  return jsonResponse({ message: '已更新图床设置', branding });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
