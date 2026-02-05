import { fetchSecurityConfig } from '../../utils/sysConfig.js';
import { corsHeaders, jsonResponse, getDb, createApiToken } from '../../utils/nodeimgCompat.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();

  if (!username || !password) {
    return jsonResponse({ message: '用户名和密码不能为空' }, 400);
  }

  const securityConfig = await fetchSecurityConfig(env);
  const adminUser = securityConfig?.auth?.admin?.adminUsername || '';
  const adminPass = securityConfig?.auth?.admin?.adminPassword || '';

  if (!adminUser || !adminPass || username !== adminUser || password !== adminPass) {
    return jsonResponse({ message: '密码错误' }, 401);
  }

  const db = getDb(env);
  const tokenData = await createApiToken(db, {
    name: `nodeimg-${Date.now()}`,
    owner: username,
    permissions: ['upload', 'list', 'delete']
  });

  return jsonResponse({
    message: '登录成功',
    user: {
      username,
      apiKey: tokenData.token
    }
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
