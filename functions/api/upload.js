import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../utils/nodeimgCompat.js';
import { onRequest as uploadHandler } from '../upload/index.js';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const token = extractToken(request);

    if (!token) {
      return jsonResponse({ message: '缺少 API Key' }, 401);
    }

    const db = getDb(env);
    const tokenInfo = await findTokenByValue(db, token);
    if (!tokenInfo || !tokenInfo.permissions?.includes('upload')) {
      return jsonResponse({ message: '无权限' }, 403);
    }

    const formData = await request.formData();
    const file = formData.get('image') || formData.get('file');
    if (!file) {
      return jsonResponse({ message: '缺少上传文件' }, 400);
    }

    const proxiedForm = new FormData();
    proxiedForm.append('file', file, file.name);

    const url = new URL(request.url);
    url.searchParams.set('uploadChannel', 'cfr2');

    const proxiedHeaders = new Headers(request.headers);
    // Remove original multipart boundary so the new FormData can set it correctly.
    proxiedHeaders.delete('content-type');
    proxiedHeaders.delete('content-length');
    proxiedHeaders.set('Authorization', `Bearer ${token}`);

    const proxiedRequest = new Request(url.toString(), {
      method: 'POST',
      headers: proxiedHeaders,
      body: proxiedForm,
    });

    const proxiedContext = {
      ...context,
      request: proxiedRequest,
    };

    const response = await uploadHandler(proxiedContext);
    const contentType = response.headers.get('Content-Type') || '';

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse({ message: text || '上传失败' }, response.status);
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return jsonResponse({ message: text || '上传失败' }, 500);
    }

    const payload = await response.json();
    const entry = Array.isArray(payload) ? payload[0] : payload;
    const src = entry?.src || entry?.url;

    if (!src) {
      return jsonResponse({ message: '上传失败' }, 500);
    }

    const absoluteUrl = src.startsWith('http') ? src : `${new URL(request.url).origin}${src}`;
    const filename = src.split('/').pop();

    return jsonResponse({
      id: filename,
      url: absoluteUrl,
      thumbUrl: absoluteUrl,
      size: file.size,
      width: null,
      height: null,
      format: filename?.split('.').pop() || '',
      markdown: `![image](${absoluteUrl})`,
      html: `<img src=\"${absoluteUrl}\" alt=\"image\" />`,
      bbcode: `[img]${absoluteUrl}[/img]`
    });
  } catch (err) {
    console.error('nodeimg upload error', err);
    return jsonResponse({ message: err?.message || '上传失败' }, 500);
  }
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
