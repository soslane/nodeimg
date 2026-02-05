import { corsHeaders, jsonResponse, getDb, extractToken, findTokenByValue, loadSecuritySettings, saveSecuritySettings } from '../../utils/nodeimgCompat.js';

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
  const { oldPassword, newPassword, newUsername } = body || {};
  if (!oldPassword || !newPassword || !newUsername) {
    return jsonResponse({ message: '缺少必填项' }, 400);
  }

  const settings = await loadSecuritySettings(db);
  const currentUser = settings.auth?.admin?.adminUsername || '';
  const currentPass = settings.auth?.admin?.adminPassword || '';

  if (oldPassword !== currentPass) {
    return jsonResponse({ message: '原密码错误' }, 401);
  }

  settings.auth = settings.auth || {};
  settings.auth.admin = settings.auth.admin || {};
  settings.auth.admin.adminUsername = newUsername;
  settings.auth.admin.adminPassword = newPassword;

  await saveSecuritySettings(db, settings);

  return jsonResponse({ message: '账号密码已更新，请重新登录', username: newUsername });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
