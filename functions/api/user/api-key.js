import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../utils/nodeimgCompat.js';

export async function onRequestGet(context) {
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

  return jsonResponse({ apiKey: tokenInfo.token });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
