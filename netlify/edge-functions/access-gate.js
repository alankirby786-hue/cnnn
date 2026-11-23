// Netlify Edge Function (Deno runtime) - access gate for future Netlify deployment.
// Configure required env vars in Netlify: SECURITY_SESSION_SECRET, SECURITY_ACCESS_USER,
// SECURITY_ACCESS_PASSWORD_HASH (preferred) or SECURITY_ACCESS_PASSWORD.
// This file is prepared for deployment but NOT deployed by this change.

const DENY_BODY = '404 — Page Not Found\n';

const DENIED_UA_PATTERNS = [
  /googlebot/i, /googleother/i, /google-inspectiontool/i, /bingbot/i,
  /gptbot/i, /oai-searchbot/i, /chatgpt-user/i,
  /claudebot/i, /claude-searchbot/i, /claude-user/i,
  /perplexitybot/i, /bytespider/i, /ccbot/i, /applebot/i,
  /semrushbot/i, /ahrefsbot/i, /grok/i, /xai-bot/i, /xai/i,
];

function deny() {
  return new Response(DENY_BODY, {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive' },
  });
}

function base64urlToBytes(str) {
  str = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token, secret) {
  const raw = String(token || '');
  const idx = raw.lastIndexOf('.');
  if (idx <= 0) return null;
  const payload = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expected = await hmacSha256Hex(secret, payload);
  if (sig.length !== expected.length) return null;
  let ok = 0;
  for (let i = 0; i < sig.length; i++) ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (ok !== 0) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(base64urlToBytes(payload)));
    if (!obj || typeof obj.exp !== 'number' || obj.exp <= Date.now()) return null;
    return obj;
  } catch { return null; }
}

function getCookie(req, name) {
  const m = String(req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

export default async function accessGate(request, context) {
  const ua = request.headers.get('user-agent') || '';
  for (const p of DENIED_UA_PATTERNS) if (p.test(ua)) return deny();

  const url = new URL(request.url);
  // Allow security login endpoint only if you deploy a matching auth service; static deploy has no server-side login.
  // For static Netlify deploy, protect via Netlify Access Control / password protection or external auth.
  const secret = Deno.env.get('SECURITY_SESSION_SECRET') || '';
  if (!secret) return deny();

  const token = getCookie(request, '__Host-cnn_access') || getCookie(request, 'cnn_access');
  const sess = await verifyToken(token, secret);
  if (!sess) return deny();

  return context.next();
}

export const config = { path: '/*' };
