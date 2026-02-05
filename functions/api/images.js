import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../utils/nodeimgCompat.js';
import { readIndex } from '../utils/indexManager.js';

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
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(parseInt(url.searchParams.get('limit') || '9', 10), 1);
  const start = (page - 1) * limit;

  const indexResult = await readIndex(context, { start, count: limit });
  const total = indexResult.totalCount || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const items = (indexResult.files || []).map((file) => {
    const fileUrl = `${url.origin}/file/${file.id}`;
    return {
      id: file.id,
      filename: file.metadata?.FileName || file.id,
      url: fileUrl,
      thumbUrl: fileUrl,
      createdAt: file.metadata?.TimeStamp ? new Date(file.metadata.TimeStamp).toISOString() : new Date().toISOString()
    };
  });

  return jsonResponse({
    items,
    total,
    totalPages,
    currentPage: page
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
