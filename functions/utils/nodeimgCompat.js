import { getDatabase } from './databaseAdapter.js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('X-API-Key');

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) return authHeader.substring(7);
    return authHeader;
  }

  if (apiKeyHeader) return apiKeyHeader;
  return '';
}

export function getDb(env) {
  return getDatabase(env);
}

export async function loadSecuritySettings(db) {
  const settingsStr = await db.get('manage@sysConfig@security');
  return settingsStr ? JSON.parse(settingsStr) : {};
}

export async function saveSecuritySettings(db, settings) {
  await db.put('manage@sysConfig@security', JSON.stringify(settings));
}

export async function findTokenByValue(db, tokenValue) {
  if (!tokenValue) return null;
  const settings = await loadSecuritySettings(db);
  const tokens = settings.apiTokens?.tokens || {};
  for (const tokenId of Object.keys(tokens)) {
    if (tokens[tokenId].token === tokenValue) {
      return tokens[tokenId];
    }
  }
  return null;
}

export async function createApiToken(db, { name, owner, permissions }) {
  const settings = await loadSecuritySettings(db);
  if (!settings.apiTokens) {
    settings.apiTokens = { tokens: {} };
  }

  const tokenId = generateTokenId();
  const token = generateApiToken();
  const now = new Date().toISOString();

  const tokenData = {
    id: tokenId,
    name,
    token,
    owner,
    permissions,
    createdAt: now,
    updatedAt: now
  };

  settings.apiTokens.tokens[tokenId] = tokenData;
  await saveSecuritySettings(db, settings);
  return tokenData;
}

export async function deleteTokenById(db, tokenId) {
  if (!tokenId) return false;
  const settings = await loadSecuritySettings(db);
  if (!settings.apiTokens?.tokens?.[tokenId]) return false;
  delete settings.apiTokens.tokens[tokenId];
  await saveSecuritySettings(db, settings);
  return true;
}

function generateApiToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'imgbed_';
  for (let i = 0; i < 32; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateTokenId() {
  return Math.random().toString(36).substring(2, 10);
}
