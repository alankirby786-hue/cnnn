const crypto = require('crypto');

const env = process.env;
const SECURITY_TEST_MODE = env.SECURITY_TEST_MODE === '1' || env.SECURITY_TEST_MODE === 'true';
const PRODUCTION = env.NODE_ENV === 'production' || env.NETLIFY === 'true' || env.CONTEXT === 'production';
const DEV = !PRODUCTION && !SECURITY_TEST_MODE;

// Bind localhost-only in dev unless explicitly overridden. Never bind public in production by this script alone.
const HOST = env.HOST || (DEV ? '127.0.0.1' : '127.0.0.1');
const PORT = Number(env.PORT || 8080);

// Session/auth secrets. In production these MUST come from env. In dev/test we generate an ephemeral secret
// to avoid hardcoded secrets, but sessions will be invalidated on restart.
const SESSION_SECRET = env.SECURITY_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ACCESS_USER = env.SECURITY_ACCESS_USER || 'admin';
const ACCESS_PASSWORD = env.SECURITY_ACCESS_PASSWORD || '';
const ACCESS_PASSWORD_HASH = env.SECURITY_ACCESS_PASSWORD_HASH || ''; // sha256 hex or "scrypt:<salt>:<hash>"

const SESSION_COOKIE = env.SESSION_COOKIE_NAME || '__Host-cnn_access';
const SESSION_TTL_MS = Number(env.SESSION_TTL_MS || 1000 * 60 * 30); // 30 min
const SESSION_IDLE_MS = Number(env.SESSION_IDLE_MS || 1000 * 60 * 15); // 15 min idle
const LOGIN_WINDOW_MS = Number(env.LOGIN_WINDOW_MS || 10 * 60 * 1000);
const LOGIN_MAX_ATTEMPTS = Number(env.LOGIN_MAX_ATTEMPTS || 5);
const RATE_LIMIT_WINDOW_MS = Number(env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const RATE_LIMIT_MAX = Number(env.RATE_LIMIT_MAX || 120);

const DENY_BODY = '404 — Page Not Found\n';

const PROTECTED_PATH_PREFIXES = ['/']; // gate entire app
const PUBLIC_AUTH_PATHS = new Set(['/__security/login', '/__security/login-submit', '/__security/logout']);

module.exports = {
  env,
  SECURITY_TEST_MODE,
  PRODUCTION,
  DEV,
  HOST,
  PORT,
  SESSION_SECRET,
  ACCESS_USER,
  ACCESS_PASSWORD,
  ACCESS_PASSWORD_HASH,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  SESSION_IDLE_MS,
  LOGIN_WINDOW_MS,
  LOGIN_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  DENY_BODY,
  PROTECTED_PATH_PREFIXES,
  PUBLIC_AUTH_PATHS,
};
