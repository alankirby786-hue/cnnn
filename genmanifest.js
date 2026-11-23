// Build assets.json + crawl-report.json from the mirror already on disk.
// Re-run this after any new crawl; the local server reads assets.json for MIME hints.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'mirror');
const HOSTS = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => e.name);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.pdf': 'application/pdf', '.manifest': 'application/manifest+json', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

const assets = [];
const pages = [];
let fileCount = 0;

function walk(dir, hostPrefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full, hostPrefix); continue; }
    fileCount++;
    const rel = path.relative(path.join(ROOT, hostPrefix), full).replace(/\\/g, '/');
    const urlStr = `https://${hostPrefix}/${rel}`;
    const buf = fs.readFileSync(full);
    const ext = path.extname(entry.name).toLowerCase();
    assets.push({ url: urlStr, localPath: path.join(hostPrefix, rel).replace(/\\/g, '/'), contentType: MIME[ext] || 'application/octet-stream', size: buf.length });
    if (ext === '.html') pages.push(urlStr);
  }
}

for (const host of HOSTS) walk(path.join(ROOT, host), host);

fs.writeFileSync(path.join(ROOT, 'assets.json'), JSON.stringify({ assets, errors: [] }, null, 2));
fs.writeFileSync(path.join(ROOT, 'crawl-report.json'), JSON.stringify({
  start: 'https://edition.cnn.com/', pagesVisited: pages.length, assetsDownloaded: assets.length, errors: 0, pages,
}, null, 2));

console.log('Files:', fileCount, '| Assets:', assets.length, '| HTML pages:', pages.length);
console.log('Wrote mirror/assets.json and mirror/crawl-report.json');
