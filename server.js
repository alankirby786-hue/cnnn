// Local HTTP server for the CNN site mirror
// Serves files byte-for-byte from mirror/<hostname>/ using the request URL's hostname.
// Maps requested URL paths to the exact archived files (preserving directory structure).
// HTML is NOT rewritten or minified (archive preserved byte-for-byte).
//
// Usage: node server.js
// Then open: http://localhost:8080/          (serves edition.cnn.com/index.html)
//            http://localhost:8080/us/       (serves edition.cnn.com/us/index.html)
// Assets referenced with absolute URLs (e.g. https://media.cnn.com/...) are served
// from mirror/media.cnn.com/ when requested via localhost:<PORT>/media.cnn.com/...

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const securityConfig = require('./security/security-config');
const botDetection = require('./security/bot-detection');
const sessionStore = require('./security/session');
const rateLimit = require('./security/rate-limit');
const auth = require('./security/auth');

const MIRROR_ROOT = path.join(__dirname, 'mirror');
const DEFAULT_HOST = 'edition.cnn.com';
const PORT = securityConfig.PORT;
const HOST = securityConfig.HOST;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.manifest': 'application/manifest+json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

// Known mirrored hosts = subdirectories under mirror/
let HOSTS = [];
try {
  HOSTS = fs.readdirSync(MIRROR_ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name);
} catch (e) { HOSTS = [DEFAULT_HOST]; }

// Resolve a request URL to a local file under mirror/<hostname>/<path>
// The request path already begins with the hostname (e.g. /media.cnn.com/api/...),
// so we use that leading segment as the host folder rather than prepending again.
function localFileForUrl(urlStr) {
  const u = new URL(urlStr);
  let p = u.pathname || '/';
  if (p === '/' || p === '') p = '/index.html';
  // extensionless path -> treat as directory, serve index.html
  if (!path.extname(path.basename(p))) p = p.replace(/\/?$/, '/index.html');

  const first = p.split('/')[1]; // first path segment after leading /
  const isKnownHost = HOSTS.includes(first);
  if (isKnownHost) {
    // path already carries the host: /<host>/<rest>
    return path.join(MIRROR_ROOT, p.replace(/^\//, ''));
  }
  // default host (no host prefix): localhost:8080/us/ -> mirror/edition.cnn.com/us/index.html
  return path.join(MIRROR_ROOT, DEFAULT_HOST, p.replace(/^\//, ''));
}

function sendFile(res, filePath, statusCode = 200) {
  let resolved = filePath;
  if (!fs.existsSync(resolved)) {
    // extensionless fallback -> index.html in same dir
    const alt = path.join(path.dirname(resolved), 'index.html');
    if (fs.existsSync(alt)) resolved = alt;
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end('404 Not Found\n');
      return;
    }
  }
  const ext = path.extname(resolved).toLowerCase();
  const isHtml = ext === '.html' || ext === '.htm';
  const isAsset = ['.css','.js','.mjs','.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.woff','.woff2','.ttf','.otf','.mp4','.webm','.json','.map'].includes(ext);
  const cacheControl = isHtml ? 'no-cache' : (isAsset ? 'public, max-age=3600, stale-while-revalidate=86400' : 'public, max-age=300');
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': cacheControl
  };
  res.writeHead(statusCode, headers);
  fs.createReadStream(resolved).pipe(res);
}

const LIVE_CMS = 'https://cnn-news-live.netlify.app';

async function proxyJson(res, upstreamUrl) {
  try {
    const r = await fetch(upstreamUrl, { headers: { 'Accept': 'application/json' } });
    const body = await r.text();
    res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: String(e) }));
  }
}

function deny404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' });
  res.end(securityConfig.DENY_BODY);
}

function securityGateEnabled() {
  return securityConfig.SECURITY_TEST_MODE || securityConfig.PRODUCTION;
}

async function applySecurityGate(req, res, pathname) {
  if (!securityGateEnabled()) return { allowed: true, mode: 'dev' };

  const ua = req.headers['user-agent'] || '';
  const denied = botDetection.isDeniedCrawler(ua);
  if (denied.denied) return { allowed: false, reason: denied.reason };

  const rl = rateLimit.checkRequest(req);
  if (!rl.allowed) return { allowed: false, reason: 'rate_limit' };

  // Auth endpoints are reachable for humans to authenticate, but still bot/rate-limited above.
  if (pathname === '/__security/login' || pathname === '/__security/login-submit') {
    await auth.handleLogin(req, res);
    return { allowed: false, handled: true };
  }
  if (pathname === '/__security/logout') {
    auth.handleLogout(req, res);
    return { allowed: false, handled: true };
  }

  const token = sessionStore.getTokenFromReq(req);
  const sess = token ? sessionStore.getSession(token) : null;
  if (!sess) {
    // Unknown/unauthenticated visitors do not receive protected content.
    // Return 404 to avoid leaking site existence/content.
    return { allowed: false, reason: 'unauthenticated' };
  }

  // Suspicious automation with a session is still suspicious; for higher assurance we could block,
  // but don't block legitimate browsers. We only flag; session is required regardless.
  return { allowed: true, mode: 'secure', user: sess.user };
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = reqUrl.pathname;

    const gate = await applySecurityGate(req, res, pathname);
    if (!gate.allowed) {
      if (!gate.handled) deny404(res);
      return;
    }

    if (pathname === '/api/content') return proxyJson(res, LIVE_CMS + '/api/content');

    if (pathname === '/api/subscribe' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, message: 'Subscribed' }));
      });
      return;
    }
    if (pathname === '/api/peak') {
      return (async () => {
        try {
          const r = await fetch(LIVE_CMS + '/api/content', { headers: { 'Accept': 'application/json' } });
          const data = await r.json();
          const a = data.article || {};
          const peak = { heading: a.bottomLineHeading || '', eyebrow: a.bottomLineEyebrow || '', body: a.bottomLineBody || '', stats: a.stats || [], whyItMatters: a.whyItMatters || '', guidanceHeading: a.guidanceHeading || '', guidanceBlurb: a.guidanceBlurb || '', protectHeading: a.protectHeading || '', protectBlurb: a.protectBlurb || '', newsletterHeading: a.newsletterHeading || '', newsletterBlurb: a.newsletterBlurb || '' };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(peak));
        } catch (e) {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: String(e) }));
        }
      })();
    }

    const filePath = localFileForUrl(reqUrl.href);
    sendFile(res, filePath);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end('500 ' + e.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mirror server running: http://${HOST}:${PORT}/`);
  console.log(`Serving mirror hosts under ${MIRROR_ROOT}/<hostname>/`);
  console.log(`Default host -> ${DEFAULT_HOST}`);
  console.log(`Security mode: ${securityGateEnabled() ? 'ENFORCED (SECURITY_TEST_MODE/PRODUCTION)' : 'DEV (open localhost, gate not enforced)'}`);
  if (securityGateEnabled() && !securityConfig.ACCESS_PASSWORD && !securityConfig.ACCESS_PASSWORD_HASH) {
    console.warn('WARNING: No SECURITY_ACCESS_PASSWORD or SECURITY_ACCESS_PASSWORD_HASH set. Login will fail closed.');
  }
});

process.on('uncaughtException', (e) => console.error('UNCAUGHT', e));