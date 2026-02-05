import { corsHeaders, jsonResponse, extractToken, findTokenByValue, getDb } from '../../utils/nodeimgCompat.js';

const DAILY_UPLOAD_LIMIT = 200;

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = extractToken(request);

  if (!token) {
    return jsonResponse({ authenticated: false });
  }

  const db = getDb(env);
  const tokenInfo = await findTokenByValue(db, token);
  if (!tokenInfo) {
    return jsonResponse({ authenticated: false });
  }

  return jsonResponse({
    authenticated: true,
    username: tokenInfo.owner || 'admin',
    level: 1,
    dailyUploads: 0,
    dailyUploadLimit: DAILY_UPLOAD_LIMIT,
    apiKey: tokenInfo.token
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
