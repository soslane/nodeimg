import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb, createApiToken, deleteTokenById } from '../../utils/nodeimgCompat.js';

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

  await deleteTokenById(db, tokenInfo.id);
  const newToken = await createApiToken(db, {
    name: `nodeimg-${Date.now()}`,
    owner: tokenInfo.owner || 'admin',
    permissions: tokenInfo.permissions || ['upload', 'list', 'delete']
  });

  return jsonResponse({ apiKey: newToken.token });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
