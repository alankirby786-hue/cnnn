// CNN site mirror crawler (Node native fetch)
// - Preserves HTML byte-for-byte (no rewriting / minification)
// - Recreates exact directory structure under mirror/<host>/
// - Downloads all discoverable assets (fonts, images incl. responsive variants, icons, chunks)
// - Emits assets.json + crawl-report.json for the local server
//
// Usage: node crawl.js

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, 'mirror');
const START = 'https://edition.cnn.com/';
const MAX_PAGES = 160;
const CONCURRENCY = 2;
const POLITE_DELAY_MS = 600;
const MAX_RETRIES = 4;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';

const visited = new Set();
const queued = new Set();
const assetSeen = new Set();
const pageQueue = [START];
queued.add(START);

const assets = [];
const errors = [];
let active = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fileForUrl(urlStr) {
  const u = new URL(urlStr);
  let p = u.pathname || '/';
  if (p === '/' || p === '') p = '/index.html';
  if (!path.extname(path.basename(p))) p = p.replace(/\/?$/, '/index.html');
  return path.join(u.hostname, p.replace(/^\//, ''));
}

async function fetchBuffer(urlStr, accept = ACCEPT, attempt = 0) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': UA,
        'Accept': accept,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://edition.cnn.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const ct = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, body: buf, contentType: ct, ok: res.ok };
  } catch (e) {
    clearTimeout(timer);
    if (attempt < MAX_RETRIES) {
      await sleep(1500 * (attempt + 1));
      return fetchBuffer(urlStr, accept, attempt + 1);
    }
    throw e;
  }
}

async function saveFile(urlStr, buffer) {
  const rel = fileForUrl(urlStr);
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buffer);
  return rel;
}

function extractPageLinks(html, baseUrl) {
  const out = new Set();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const u = new URL(m[1], baseUrl);
      u.hash = ''; u.search = '';
      if (u.hostname === 'edition.cnn.com' && u.protocol === 'https:') out.add(u.href);
    } catch (e) {}
  }
  return out;
}

function assetUrls(html, baseUrl) {
  const out = new Set();
  const add = (s) => { try { out.add(new URL(s, baseUrl).href); } catch (e) {} };
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<img[^>]+srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) add(s); }
  }
  for (const m of html.matchAll(/<source[^>]+srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) add(s); }
  }
  for (const m of html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<video[^>]+(?:src|poster)=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) add(m[1]);
  return out;
}

async function downloadAsset(urlStr) {
  if (assetSeen.has(urlStr)) return;
  assetSeen.add(urlStr);
  // skip obvious third-party ad/analytics hosts to keep archive sane but still try cnn media/fonts
  try {
    const u = new URL(urlStr);
    const res = await fetchBuffer(urlStr, '*/*');
    if (!res.ok || res.status !== 200) { errors.push({ url: urlStr, status: res.status, kind: 'asset' }); return; }
    const rel = await saveFile(urlStr, res.body);
    assets.push({ url: urlStr, localPath: rel, contentType: res.contentType });
  } catch (e) {
    errors.push({ url: urlStr, error: String(e), kind: 'asset' });
  }
}

async function processPage(urlStr) {
  if (visited.has(urlStr)) return;
  visited.add(urlStr);
  active++;
  try {
    await sleep(POLITE_DELAY_MS);
    const res = await fetchBuffer(urlStr);
    if (res.status !== 200) { errors.push({ url: urlStr, status: res.status, kind: 'page' }); return; }
    const isHtml = /text\/html/.test(res.contentType);
    const dec = new TextDecoder();
    const html = isHtml ? dec.decode(res.body) : '';
    const rel = await saveFile(urlStr, res.body);
    console.log(`[PAGE] ${res.status} ${urlStr} -> ${rel} (${Math.round(res.body.length/1024)} KB) assets+queued next`);

    if (html) {
      const asets = assetUrls(html, urlStr);
      await Promise.all([...asets].map(a => downloadAsset(a)));
      const links = extractPageLinks(html, urlStr);
      for (const l of links) {
        if (!visited.has(l) && !queued.has(l) && (visited.size + queued.size + pageQueue.length) < MAX_PAGES * 2) {
          queued.add(l); pageQueue.push(l);
        }
      }
    }
  } catch (e) {
    errors.push({ url: urlStr, error: String(e), kind: 'page' });
    console.log('[ERR] page', urlStr, e.message);
  } finally {
    active--;
  }
}

async function worker() {
  while (pageQueue.length > 0 && visited.size < MAX_PAGES) {
    const u = pageQueue.shift();
    queued.delete(u);
    if (visited.has(u)) continue;
    await processPage(u);
    while (active >= CONCURRENCY) await sleep(150);
  }
}

async function main() {
  fs.mkdirSync(ROOT, { recursive: true });
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  // drain: process any remaining queued (worker loop ends when queue empty)
  while (pageQueue.length > 0 && visited.size < MAX_PAGES) {
    await processPage(pageQueue.shift());
  }

  fs.writeFileSync(path.join(ROOT, 'assets.json'), JSON.stringify({ assets, errors }, null, 2));
  fs.writeFileSync(path.join(ROOT, 'crawl-report.json'), JSON.stringify({
    start: START, pagesVisited: visited.size, assetsDownloaded: assets.length, errors: errors.length,
    pages: [...visited],
  }, null, 2));

  console.log('\n=== DONE ===');
  console.log('Pages visited:', visited.size);
  console.log('Assets downloaded:', assets.length);
  console.log('Errors:', errors.length);
  console.log('Mirror root:', ROOT);
  errors.slice(0, 25).forEach(e => console.log(' ', e.kind, e.status || e.error, '->', e.url));
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
