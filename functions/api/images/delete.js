import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../utils/nodeimgCompat.js';
import { onRequest as deleteHandler } from '../manage/delete/[[path]].js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = extractToken(request);

  if (!token) {
    return jsonResponse({ message: '缺少 API Key' }, 401);
  }

  const db = getDb(env);
  const tokenInfo = await findTokenByValue(db, token);
  if (!tokenInfo || !tokenInfo.permissions?.includes('delete')) {
    return jsonResponse({ message: '无权限' }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) {
    return jsonResponse({ message: '缺少要删除的ID' }, 400);
  }

  const deleted = [];
  const failed = [];

  for (const id of ids) {
    try {
      const url = new URL(request.url);
      const deleteUrl = new URL(`${url.origin}/api/manage/delete/${encodeURIComponent(id)}`);
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${token}`);

      const deleteRequest = new Request(deleteUrl.toString(), {
        method: 'DELETE',
        headers
      });

      const response = await deleteHandler({
        ...context,
        request: deleteRequest,
        params: { path: id }
      });

      if (response.ok) {
        deleted.push(id);
      } else {
        failed.push(id);
      }
    } catch (err) {
      console.error(err);
      failed.push(id);
    }
  }

  return jsonResponse({
    message: '删除完成',
    deleted,
    failed
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
