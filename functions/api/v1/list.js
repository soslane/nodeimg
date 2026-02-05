import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../utils/nodeimgCompat.js';
import { readIndex } from '../../utils/indexManager.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = extractToken(request);

  if (!token) {
    return jsonResponse({ message: '缺少 API Key' }, 401);
  }

  const db = getDb(env);
  const tokenInfo = await findTokenByValue(db, token);
  if (!tokenInfo || !tokenInfo.permissions?.includes('list')) {
    return jsonResponse({ message: '无权限' }, 403);
  }

  const url = new URL(request.url);
  const indexResult = await readIndex(context, { start: 0, count: 100 });
  const items = (indexResult.files || []).map((file) => ({
    id: file.id,
    url: `${url.origin}/file/${file.id}`,
    thumbUrl: `${url.origin}/file/${file.id}`,
    size: file.metadata?.FileSizeBytes || null,
    width: file.metadata?.Width || null,
    height: file.metadata?.Height || null,
    createdAt: file.metadata?.TimeStamp || Date.now()
  }));

  return jsonResponse({ items });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
