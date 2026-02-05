import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../../utils/nodeimgCompat.js';
import { onRequest as deleteHandler } from '../../manage/delete/[[path]].js';

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const token = extractToken(request);

  if (!token) {
    return jsonResponse({ message: '缺少 API Key' }, 401);
  }

  const db = getDb(env);
  const tokenInfo = await findTokenByValue(db, token);
  if (!tokenInfo || !tokenInfo.permissions?.includes('delete')) {
    return jsonResponse({ message: '无权限' }, 403);
  }

  const fileId = params?.path ? decodeURIComponent(params.path) : '';
  if (!fileId) {
    return jsonResponse({ message: '缺少图片ID' }, 400);
  }

  const url = new URL(request.url);
  const deleteUrl = new URL(`${url.origin}/api/manage/delete/${encodeURIComponent(fileId)}`);
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const deleteRequest = new Request(deleteUrl.toString(), {
    method: 'DELETE',
    headers
  });

  const response = await deleteHandler({
    ...context,
    request: deleteRequest,
    params: { path: fileId }
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ message: text || '删除失败' }, 400);
  }

  return jsonResponse({ message: '删除成功' });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
