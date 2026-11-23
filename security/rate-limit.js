const cfg = require('./security-config');

const buckets = new Map(); // key -> {count, resetAt}

function now() { return Date.now(); }

function keyFor(req, prefix='req') {
  const ip = String(req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  return `${prefix}:${ip}`;
}

function hit(key, limit, windowMs) {
  const t = now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= t) { b = { count: 0, resetAt: t + windowMs }; buckets.set(key, b); }
  b.count += 1;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt, count: b.count };
}

function checkRequest(req) {
  return hit(keyFor(req, 'req'), cfg.RATE_LIMIT_MAX, cfg.RATE_LIMIT_WINDOW_MS);
}

function checkLogin(req) {
  return hit(keyFor(req, 'login'), cfg.LOGIN_MAX_ATTEMPTS, cfg.LOGIN_WINDOW_MS);
}

setInterval(() => {
  const t = now();
  for (const [k, b] of buckets) if (b.resetAt <= t) buckets.delete(k);
}, 60 * 1000).unref?.();

module.exports = { hit, checkRequest, checkLogin, keyFor };
