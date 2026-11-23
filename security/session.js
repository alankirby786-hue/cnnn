const crypto = require('crypto');
const cfg = require('./security-config');

const sessions = new Map(); // id -> {id,user,createdAt,expiresAt,lastSeenAt,revoked}
const revoked = new Set();

function now() { return Date.now(); }

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function unbase64url(str) {
  str = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function sign(payload) {
  return base64url(crypto.createHmac('sha256', cfg.SESSION_SECRET).update(payload).digest());
}

function createSession(user) {
  const id = base64url(crypto.randomBytes(32));
  const ts = now();
  const rec = { id, user: String(user || ''), createdAt: ts, expiresAt: ts + cfg.SESSION_TTL_MS, lastSeenAt: ts, revoked: false };
  sessions.set(id, rec);
  return tokenFor(rec);
}

function tokenFor(rec) {
  const payload = base64url(JSON.stringify({ id: rec.id, exp: rec.expiresAt }));
  return `${payload}.${sign(payload)}`;
}

function parseToken(token) {
  const raw = String(token || '');
  const idx = raw.lastIndexOf('.');
  if (idx <= 0) return null;
  const payload = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(unbase64url(payload).toString('utf8'));
    if (!obj || typeof obj.id !== 'string' || typeof obj.exp !== 'number') return null;
    return obj;
  } catch { return null; }
}

function getSession(token) {
  const parsed = parseToken(token);
  if (!parsed) return null;
  if (parsed.exp <= now()) return null;
  if (revoked.has(parsed.id)) return null;
  const rec = sessions.get(parsed.id);
  if (!rec || rec.revoked) return null;
  if (rec.expiresAt <= now()) { sessions.delete(rec.id); return null; }
  if (now() - rec.lastSeenAt > cfg.SESSION_IDLE_MS) { sessions.delete(rec.id); return null; }
  rec.lastSeenAt = now();
  return rec;
}

function revokeSession(token) {
  const parsed = parseToken(token);
  if (!parsed) return false;
  revoked.add(parsed.id);
  const rec = sessions.get(parsed.id);
  if (rec) { rec.revoked = true; sessions.delete(parsed.id); }
  return true;
}

function cleanup() {
  const t = now();
  for (const [id, rec] of sessions) {
    if (rec.revoked || rec.expiresAt <= t || t - rec.lastSeenAt > cfg.SESSION_IDLE_MS) sessions.delete(id);
  }
}
setInterval(cleanup, 60 * 1000).unref?.();

function cookieName(req) {
  // __Host- cookies require Secure; on plain localhost http they won't stick. Use plain name for http dev.
  const secure = isSecureReq(req);
  if (secure) return '__Host-cnn_access';
  return 'cnn_access';
}

function isSecureReq(req) {
  if (req.connection && req.connection.encrypted) return true;
  const xf = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return xf === 'https';
}

function parseCookies(req) {
  const hdr = String(req.headers.cookie || '');
  const out = {};
  hdr.split(/;\s*/).forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

function getTokenFromReq(req) {
  const cookies = parseCookies(req);
  return cookies[cookieName(req)] || cookies['__Host-cnn_access'] || cookies['cnn_access'] || '';
}

function makeSessionCookie(req, token) {
  const secure = isSecureReq(req);
  const name = cookieName(req);
  const parts = [`${name}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  const maxAge = Math.floor(cfg.SESSION_TTL_MS / 1000);
  parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

function clearSessionCookie(req) {
  const secure = isSecureReq(req);
  const name = cookieName(req);
  const parts = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  // also clear legacy name
  return [parts.join('; '), `cnn_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, `__Host-cnn_access=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`];
}

module.exports = {
  createSession,
  getSession,
  revokeSession,
  getTokenFromReq,
  makeSessionCookie,
  clearSessionCookie,
  parseCookies,
  cookieName,
};
