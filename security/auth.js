const crypto = require('crypto');
const cfg = require('./security-config');
const session = require('./session');
const rateLimit = require('./rate-limit');

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(input) {
  const pw = String(input || '');
  if (cfg.ACCESS_PASSWORD_HASH) {
    if (cfg.ACCESS_PASSWORD_HASH.startsWith('scrypt:')) {
      const [, salt, expected] = cfg.ACCESS_PASSWORD_HASH.split(':');
      if (!salt || !expected) return false;
      const actual = crypto.scryptSync(pw, salt, 32).toString('hex');
      return safeEqual(actual, expected);
    }
    // plain sha256 hex fallback
    const actual = crypto.createHash('sha256').update(pw).digest('hex');
    return safeEqual(actual, cfg.ACCESS_PASSWORD_HASH);
  }
  if (cfg.ACCESS_PASSWORD) return safeEqual(pw, cfg.ACCESS_PASSWORD);
  return false; // no credentials configured => deny in secure mode
}

function verifyUser(user) {
  return safeEqual(String(user || ''), cfg.ACCESS_USER);
}

function makeCsrfToken() {
  const exp = Date.now() + 10 * 60 * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${nonce}.${exp}`;
  const sig = crypto.createHmac('sha256', cfg.SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyCsrfToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return false;
  const [nonce, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!nonce || !Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `${nonce}.${expStr}`;
  const expected = crypto.createHmac('sha256', cfg.SESSION_SECRET).update(payload).digest('hex');
  return safeEqual(sig, expected);
}

function loginPage(message = '') {
  const csrf = makeCsrfToken();
  const msg = message ? `<p style="color:#b00020;margin:0 0 12px">${escapeHtml(message)}</p>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Access Required</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;margin:0;padding:40px">
  <form method="POST" action="/__security/login-submit" style="max-width:360px;margin:40px auto;background:#fff;padding:24px;border:1px solid #ddd;border-radius:8px">
    <h1 style="font-size:20px;margin:0 0 8px">Authorized Access</h1>
    <p style="font-size:14px;color:#555;margin:0 0 16px">Sign in to continue.</p>
    ${msg}
    <input type="hidden" name="csrf" value="${csrf}">
    <label style="display:block;font-size:14px;margin-bottom:12px">Username<input name="username" autocomplete="username" required style="display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid #ccc;border-radius:4px"></label>
    <label style="display:block;font-size:14px;margin-bottom:16px">Password<input name="password" type="password" autocomplete="current-password" required style="display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid #ccc;border-radius:4px"></label>
    <button type="submit" style="width:100%;padding:10px;border:0;border-radius:4px;background:#111;color:#fff;font-size:14px;cursor:pointer">Sign in</button>
  </form>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function parseFormBody(body) {
  const params = new URLSearchParams(body);
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

async function readBody(req, limit = 16 * 1024) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > limit) { reject(new Error('body_too_large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleLogin(req, res) {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(loginPage());
    return true;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Method Not Allowed');
    return true;
  }
  const rl = rateLimit.checkLogin(req);
  if (!rl.allowed) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(cfg.DENY_BODY);
    return true;
  }
  let form;
  try { form = parseFormBody(await readBody(req)); }
  catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(cfg.DENY_BODY);
    return true;
  }
  if (!verifyCsrfToken(form.csrf)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(cfg.DENY_BODY);
    return true;
  }
  const ok = verifyUser(form.username) && verifyPassword(form.password);
  if (!ok) {
    res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(loginPage('Invalid credentials.'));
    return true;
  }
  const token = session.createSession(form.username);
  res.writeHead(302, {
    'Set-Cookie': session.makeSessionCookie(req, token),
    'Location': '/',
    'Cache-Control': 'no-store',
  });
  res.end('Redirecting');
  return true;
}

function handleLogout(req, res) {
  const token = session.getTokenFromReq(req);
  if (token) session.revokeSession(token);
  const cookies = session.clearSessionCookie(req);
  res.writeHead(302, { 'Set-Cookie': cookies, 'Location': '/__security/login', 'Cache-Control': 'no-store' });
  res.end('Redirecting');
  return true;
}

module.exports = {
  verifyPassword,
  verifyUser,
  makeCsrfToken,
  verifyCsrfToken,
  handleLogin,
  handleLogout,
  loginPage,
  hashPassword,
};
