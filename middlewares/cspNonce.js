// === Core modules ===
const crypto = require("node:crypto");

// === Third-party modules ===
const helmet = require("helmet");

// === Absolute / alias imports ===
const config = require("@config");

/**
 * CSP Nonce Middleware
 *
 * Generates a cryptographically random nonce per request and applies a
 * Content-Security-Policy header that includes the nonce in scriptSrc.
 * This allows inline <script nonce="..."> blocks while keeping
 * 'unsafe-inline' out of scriptSrc.
 *
 * The nonce is exposed via:
 *   - res.locals.cspNonce  → available in Nunjucks templates as {{ cspNonce }}
 *   - req.cspNonce         → available in controllers/middleware
 *
 * Usage in templates:
 *   <script nonce="{{ cspNonce }}">...</script>
 */

// Cache the base directives reference (config is loaded once at startup)
const baseDirectives =
  config.security.helmetConfig.contentSecurityPolicy.directives;

function cspNonceMiddleware(req, res, next) {
  const nonce = crypto.randomBytes(16).toString("base64");

  req.cspNonce = nonce;
  res.locals.cspNonce = nonce;

  // Build CSP directives with nonce-based scriptSrc for this request.
  // Only contentSecurityPolicy is set here; all other security headers
  // are already applied globally in app.js via helmet(helmetWithoutCsp).
  helmet.contentSecurityPolicy({
    directives: {
      ...baseDirectives,
      scriptSrc: [...baseDirectives.scriptSrc, `'nonce-${nonce}'`],
    },
    reportOnly: false,
  })(req, res, next);
}

module.exports = { cspNonceMiddleware };
