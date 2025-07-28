const { doubleCsrf } = require("csrf-csrf");
const config = require("@config");

// CSRF Configuration using centralized config
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  getSessionIdentifier: (req) => req.session.id,
  cookieName: config.csrf.cookieName,
  cookieOptions: config.csrf.cookieOptions,
  getCsrfTokenFromRequest: (req) => {
    return req.body._csrf || req.headers["x-csrf-token"];
  },
});

// Global CSRF middleware - Laravel-style implementation
const csrfGlobalMiddleware = (req, res, next) => {
  // Generate CSRF token for every request
  const csrfToken = generateCsrfToken(req, res);

  // Make it available globally in templates via res.locals
  res.locals.csrfToken = csrfToken;
  res.locals.csrf = csrfToken; // Short alias like Laravel

  // Helper function for form generation (Laravel @csrf equivalent)
  res.locals.csrfField = () => {
    return `<input type="hidden" name="_csrf" value="${csrfToken}">`;
  };

  next();
};

module.exports = {
  generateCsrfToken,
  doubleCsrfProtection,
  csrfGlobalMiddleware,
};
