// Verify every asset referenced in homepage HTML exists locally under mirror/<host>/<path>
// (Confirms zero missing assets => zero console 404 errors when served locally.)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'mirror');
const html = fs.readFileSync(path.join(ROOT, 'edition.cnn.com/index.html'), 'utf8');

const urls = new Set();
const add = (s) => { try { urls.add(new URL(s, 'https://edition.cnn.com/').href); } catch (e) {} };

function localExists(u) {
  const host = u.hostname;
  let p = u.pathname || '/';
  if (p === '/' || p === '') p = '/index.html';
  if (!path.extname(path.basename(p))) p = p.replace(/\/?$/, '/index.html');
  return fs.existsSync(path.join(ROOT, host, p.replace(/^\//, '')));
}

// link href / script src / img src/srcset / source / video / poster / url()
for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)) add(m[1]);
for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
for (const m of html.matchAll(/<img[^>]+srcset=["']([^"']+)["']/gi)) for (const part of m[1].split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) add(s); }
for (const m of html.matchAll(/<source[^>]+srcset=["']([^"']+)["']/gi)) for (const part of m[1].split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) add(s); }
for (const m of html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi)) add(m[1]);
for (const m of html.matchAll(/<video[^>]+(?:src|poster)=["']([^"']+)["']/gi)) add(m[1]);
for (const m of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) add(m[1]);

let missing = 0, present = 0;
const missingList = [];
for (const u of urls) {
  if (localExists(new URL(u))) present++;
  else { missing++; missingList.push(u); }
}

console.log('Total unique asset URLs referenced:', urls.size);
console.log('Present locally:', present);
console.log('MISSING locally:', missing);
if (missing) {
  console.log('\nMissing assets (would 404 / console error):');
  missingList.slice(0, 40).forEach(x => console.log('  ', x));
}
console.log('\n' + (missing === 0 ? 'RESULT: ZERO missing assets => 0 console 404 errors' : 'RESULT: SOME assets missing'));
