import { corsHeaders, jsonResponse } from '../../utils/nodeimgCompat.js';

export async function onRequestPost() {
  return jsonResponse({ message: '已注销' }, 200);
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
