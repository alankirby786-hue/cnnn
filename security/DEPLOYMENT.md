# Security Deployment Guide

## What was implemented
- Server-side access gate in `server.js` (Node static mirror).
- Reusable modules in `security/`: bot detection, session, auth, rate limit, config.
- Netlify Edge Function prepared at `netlify/edge-functions/access-gate.js` and `netlify.toml`.
- Basic integration tests at `tests/security/run-tests.js`.

## Modes
- **DEVELOPMENT (default)**: `SECURITY_TEST_MODE` not set, `NODE_ENV!=production`. Server binds `127.0.0.1`, gate is NOT enforced so developer can debug locally.
- **SECURITY TEST MODE**: `SECURITY_TEST_MODE=1`. Full gate enforced locally. Use for security testing.
- **PRODUCTION**: `NODE_ENV=production` or Netlify production context. Gate enforced.

Never enable dev bypasses in production. No bypass token is implemented.

## Environment variables
- `SECURITY_TEST_MODE=1` - enforce gate locally.
- `SECURITY_SESSION_SECRET` - long random secret for signing session tokens. Required in production.
- `SECURITY_ACCESS_USER` - approved username.
- `SECURITY_ACCESS_PASSWORD_HASH` - preferred; `scrypt:<salt>:<hex>` or sha256 hex.
- `SECURITY_ACCESS_PASSWORD` - plaintext password (dev/test only; avoid in production).
- `SESSION_TTL_MS` - session lifetime (default 30 min).
- `SESSION_IDLE_MS` - idle timeout (default 15 min).
- `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_MS` - login rate limit.
- `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` - request rate limit.
- `HOST`, `PORT` - server bind.

## Local security testing
```bash
# Enforced gate
set SECURITY_TEST_MODE=1
set SECURITY_ACCESS_USER=admin
set SECURITY_ACCESS_PASSWORD=change-me
set SECURITY_SESSION_SECRET=replace-with-long-random-secret
node server.js
# or: npx netlify dev (Edge behavior requires Netlify CLI + supported config; verify actual local behavior)
```

Run automated tests:
```bash
node tests/security/run-tests.js
```

## Netlify deployment prep (DO NOT deploy without approval)
1. Set env vars in Netlify UI (Site configuration > Environment variables): `SECURITY_SESSION_SECRET`, `SECURITY_ACCESS_USER`, `SECURITY_ACCESS_PASSWORD_HASH`.
2. Ensure `netlify/edge-functions/access-gate.js` and `netlify.toml` are committed.
3. For static-only deploys, there is no server-side login handler; use Netlify Access Control / Password Protection / external identity, or deploy a server/auth function. The prepared edge function expects a valid signed session cookie.
4. Disable deploy previews or protect them with same access control.
5. Verify protected endpoints are not reachable through unguarded routes or alternate origins.

## Production security checklist
- [ ] Strong `SECURITY_SESSION_SECRET` set in env, not in repo.
- [ ] `SECURITY_ACCESS_PASSWORD_HASH` used (not plaintext password).
- [ ] `SECURITY_TEST_MODE` not used as a bypass; production enforced by environment.
- [ ] HTTPS enabled; secure cookies active.
- [ ] Deploy previews protected or disabled.
- [ ] Rate limits configured.
- [ ] Logs/monitoring enabled for failed auth/rate-limit events.
- [ ] No undocumented bypass tokens.
- [ ] External third-party assets acknowledged as outside app gate.

## Limitations
- User-Agent denylist is spoofable; it is only one signal. Server-side session auth is the primary control.
- Bot detection cannot identify every automated browser. This system does not claim 100% bot detection.
- Memory-backed sessions/rate limits are per-process and reset on restart; use shared store for multi-instance production.
- Static Netlify deploy has no Node login handler; edge function requires pre-issued signed session cookie or external auth integration.
- External assets hosted by third parties cannot be protected by this app's access gate.
- CAPTCHA/human verification is not integrated by default; can be added as additional signal, never as sole authorization.
