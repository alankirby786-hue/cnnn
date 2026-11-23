// Configurable denylist for known crawlers/fetchers. User-Agent matching is only one signal;
// it is spoofable and MUST NOT be the only security measure.
const DENIED_UA_PATTERNS = [
  /googlebot/i,
  /googleother/i,
  /google-inspectiontool/i,
  /bingbot/i,
  /gptbot/i,
  /oai-searchbot/i,
  /chatgpt-user/i,
  /claudebot/i,
  /claude-searchbot/i,
  /claude-user/i,
  /perplexitybot/i,
  /bytespider/i,
  /ccbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /grok/i,
  /xai-bot/i,
  /xai/i,
];

const SUSPICIOUS_UA_PATTERNS = [
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /python-httpx/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /scrapy/i,
  /httpclient/i,
  /axios\//i,
  /node-fetch/i,
  /okhttp/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
];

function normalizeUA(ua) {
  return String(ua || '').trim();
}

function isDeniedCrawler(userAgent) {
  const ua = normalizeUA(userAgent);
  if (!ua) return { denied: false, reason: 'missing_ua' };
  for (const p of DENIED_UA_PATTERNS) {
    if (p.test(ua)) return { denied: true, reason: 'ua_denylist', pattern: String(p) };
  }
  return { denied: false };
}

function isSuspiciousAutomation(userAgent) {
  const ua = normalizeUA(userAgent);
  if (!ua) return { suspicious: true, reason: 'missing_ua' };
  for (const p of SUSPICIOUS_UA_PATTERNS) {
    if (p.test(ua)) return { suspicious: true, reason: 'ua_suspicious', pattern: String(p) };
  }
  return { suspicious: false };
}

module.exports = {
  DENIED_UA_PATTERNS,
  SUSPICIOUS_UA_PATTERNS,
  isDeniedCrawler,
  isSuspiciousAutomation,
  normalizeUA,
};
