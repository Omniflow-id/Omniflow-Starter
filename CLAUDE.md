# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Omniflow-Starter** is a Node.js ERP module starter pack built with Express.js, MySQL, and Nunjucks templating. It provides user management, role-based access control, activity logging, and Excel file processing capabilities for HRIS applications.

## Development Commands

- **Start server**: `npm start` or `npm run dev` (runs on port 1234 or PORT env var)
- **Code formatting**: `npm run format` (Biome formatter + linter with auto-fix)
- **Code linting**: `npm run lint` (Biome linter check only)
- **No build process** - static files served directly from public/

## Module Aliases

The project uses `module-alias` for cleaner import paths:

### Available Aliases

- `@` - Project root (.)
- `@config` - Configuration files (./config)
- `@db` - Database files (./db)
- `@helpers` - Helper utilities (./helpers) 
- `@middlewares` - Express middlewares (./middlewares)
- `@routes` - Route handlers (./routes)
- `@views` - Nunjucks templates (./views)
- `@public` - Static files (./public)

### Usage Examples

**Before (relative paths):**
```js
const { db } = require("../../../db/db");
const { log } = require("../../../helpers/log");
const { asyncHandler } = require("../../../middlewares/errorHandler");
```

**After (module aliases):**
```js
const { db } = require("@db/db");
const { log } = require("@helpers/log");
const { asyncHandler } = require("@middlewares/errorHandler");
```

### Setup Notes

- Module aliases are registered in `server.js` and `instrument.js`
- Configured in `package.json` under `_moduleAliases`
- Works with all Node.js require() calls
- No additional build step required

## Architecture

### Entry Points

- `server.js` - Server startup
- `app.js` - Express configuration and middleware setup
- `instrument.js` - OpenTelemetry monitoring initialization

### Database Layer

- MySQL with connection pooling (`db/db.js`) using centralized config
- Main tables: `users` (with full_name field) and `activity_logs`
- **Knex.js integration**: Database migrations and seeding with proper tracking
- Migrations located in `db/migrations/` with timestamp-based naming
- Seeders located in `db/seeders/` for development data
- Default users: admin@omniflow.id/Admin12345., manager@omniflow.id/Manager12345., user@omniflow.id/User12345.

### Authentication & Authorization

- Session-based auth with 24-hour timeout
- Three roles: Admin (full access), Manager (limited admin), User (basic)
- Middleware: `isLoggedIn` (auth check), `isAdmin` (admin-only routes)
- Login/logout routes at `/admin/login` and `/admin/logout`

### Route Structure

- **Public**: `/` (client landing)
- **Admin**: `/admin/*` (dashboard, user management, logs)
- **User Management**: `/admin/user/*` (CRUD, Excel import/export)
- **Activity Logs**: `/admin/log/*` (view logs, export)

### Activity Logging System

- All user actions logged to database and `logs/app.log`
- Captures IP address, device type, browser, platform via user-agent parsing
- Helper functions in `helpers/log.js`, `helpers/getClientIP.js`, `helpers/getUserAgent.js`

### Rate Limiting & Security

- **Express Rate Limiting**: Multi-tier rate limiting with `express-rate-limit`
- **Rate Limiting Tiers**:
  - **General**: 100 requests/15 min (all endpoints)
  - **Authentication**: 5 login attempts/15 min (POST `/admin/login`)
  - **Admin Operations**: 50 requests/5 min (admin routes)
  - **File Uploads**: 10 uploads/15 min (file upload endpoints)
  - **Data Export**: 20 exports/5 min (download/export endpoints)
- **Security Features**:
  - Proper IP detection with configurable trust proxy settings
  - Flash message integration for user feedback
  - Comprehensive logging of rate limit violations
  - JSON response for API calls, HTML response for web requests
  - Development vs Production trust proxy configuration
- **Trust Proxy Configuration**:
  - Development: `trust proxy: false` (direct IP, security-first)
  - Production: `trust proxy: 1` (trust first proxy for real client IP)
- **Implementation**: `middlewares/rateLimiter.js` with different limiters applied to specific route groups

### Bot Protection & Threat Detection

- **Advanced Bot Protection**: Multi-layer defense against automated attacks
- **Protection Layers**:
  - **Suspicious Activity Logger**: Passive monitoring and logging of suspicious paths
  - **Banned IP Limiter**: Ultra-aggressive blocking (1 request/hour) for obvious bot patterns
  - **Bot Protection Limiter**: Moderate protection (3 requests/5min) for suspicious paths
- **Threat Detection**:
  - **Suspicious Path Detection**: WordPress, CMS, config files, attack vectors
  - **Bot User-Agent Detection**: Scanner bots, crawlers, automated tools
  - **Legitimate Path Whitelist**: Admin panel paths exempted from suspicion
- **Security Response**:
  - **Error Codes**: `BOT_PROTECTION_TRIGGERED`, `IP_BANNED`
  - **JSON Response**: Machine-readable responses for bots
  - **Comprehensive Logging**: Database and console logging with IP, path, user-agent
- **Protected Attack Vectors**:
  - WordPress: `/wp/`, `/wp-admin`, `/xmlrpc.php`
  - CMS: `/administrator`, `/phpmyadmin`, `/drupal`
  - Config: `/.env`, `/config`, `/.htaccess`
  - Shells: `/webshell`, `/cmd`, `/backup`
- **Implementation**: `middlewares/botProtection.js` with intelligent path filtering and legitimate path whitelisting

### Response Compression

- **Dual Algorithm Support**: Automatic Brotli and Gzip compression with intelligent client detection
- **Implementation**: `middlewares/compressionMiddleware.js` with configurable settings
- **Performance Benefits**: 60-90% bandwidth reduction for text-based content
- **Automatic Detection**: Skips already compressed files (images, videos, PDFs, archives)
- **Compression Algorithms**:
  - **Brotli**: Modern compression (8.1% better than gzip, supported by modern browsers)
  - **Gzip**: Fallback compression (universal browser support)
  - **Automatic Selection**: Middleware chooses best algorithm based on client Accept-Encoding header
- **Content Type Filtering**:
  - **Compressed**: HTML, CSS, JavaScript, JSON, XML, text files
  - **Skipped**: Images, videos, audio, PDFs, archives, executables
- **Configuration Options**:
  - **Threshold**: Minimum response size to compress (default: 1KB)
  - **Gzip Level**: Compression level 1-9 (default: 6 for balance)
  - **Brotli Quality**: Compression quality 0-11 (default: 4 for balance)
  - **Chunk Size**: Streaming chunk size (default: 16KB)
  - **Enable/Disable**: Toggle compression algorithms via environment variables
- **Development Logging**: Response size monitoring with algorithm detection in development mode
- **Environment Variables**:
  - `COMPRESSION_ENABLED` - Enable/disable all compression (default: true)
  - `COMPRESSION_THRESHOLD` - Minimum size in bytes (default: 1024)
  - `COMPRESSION_LEVEL` - Gzip compression level 1-9 (default: 6)
  - `COMPRESSION_CHUNK_SIZE` - Gzip chunk size in bytes (default: 16384)
  - `BROTLI_ENABLED` - Enable/disable Brotli compression (default: true)
  - `BROTLI_QUALITY` - Brotli quality 0-11 (default: 4)
  - `BROTLI_CHUNK_SIZE` - Brotli chunk size in bytes (default: 16384)
- **Typical Compression Ratios**:
  - HTML with Brotli: 72.5% reduction (vs 70% with Gzip)
  - JSON APIs with Brotli: 80-92% reduction
  - CSS/JavaScript with Brotli: 65-85% reduction
  - Plain text with Brotli: 75-90% reduction

### CSRF Protection

- **Laravel-Style CSRF Protection**: Double submit cookie pattern with session binding for maximum security
- **Implementation**: `middlewares/csrfProtection.js` with centralized configuration from `config/index.js`
- **Global Token Generation**: CSRF tokens automatically available in all templates via global middleware
- **Template Integration**: Use `{{ csrfField() | safe }}` helper function in all POST forms (Laravel @csrf equivalent)
- **Route Protection**: `doubleCsrfProtection` middleware applied to all protected POST routes
- **Environment-Aware Configuration**:
  - **Development**: `sameSite: 'lax'`, `secure: false` for HTTP testing
  - **Production**: `sameSite: 'strict'`, `secure: true` for HTTPS security
- **Error Handling**: Automatic CSRF token validation error handling with user-friendly 403 messages
- **Security Features**:
  - **Double Protection**: Cookie + form token must match
  - **Session Binding**: Tokens tied to specific user sessions
  - **HTTP-only Cookies**: Prevents XSS token theft
  - **Cross-origin Protection**: Strict SameSite policy in production
- **Template Usage Examples**:
  ```html
  <!-- Login form -->
  <form action="/admin/login" method="post">
    {{ csrfField() | safe }}
    <input type="email" name="email" required>
    <input type="password" name="password" required>
    <button type="submit">Login</button>
  </form>
  
  <!-- Alternative using global variables -->
  <form action="/protected" method="post">
    <input type="hidden" name="_csrf" value="{{ csrf }}">
    <!-- form fields -->
  </form>
  ```
- **Configuration Variables**:
  - `CSRF_SECRET` - Custom CSRF secret (falls back to SESSION_KEY)
  - Cookie name: `csrf-token`
  - Token extraction from: `req.body._csrf` or `req.headers['x-csrf-token']`

### File Processing & Storage

- **Excel Operations**: Dynamic template generation using ExcelJS (no static templates)
- **File Storage**: Store only filename in database, actual files will be configured for S3
- **Upload Processing**: Multer for file uploads with automatic cleanup
- **Template Generation**: Excel templates created dynamically with current database schema

### File Storage Strategy

- **Database**: Store only filename/path references
- **S3 Configuration**: Ready for dynamic S3 integration using environment variables
- **File Cleanup**: Temporary files automatically cleaned after processing
- **Template Downloads**: Generated on-demand, not stored permanently

## Key Patterns

### Error Handling

- **Centralized Error Handler**: `middlewares/centralizedErrorHandler.js` with custom error classes
- **Custom Error Types**: ValidationError, AuthenticationError, AuthorizationError, DatabaseError
- **Async Error Wrapper**: Use `asyncHandler` to eliminate try-catch boilerplate
- **Error Pages**: 400, 401, 403, 404, 500 with user-friendly messages
- **Smart Error Detection**: Automatic handling of database errors, validation errors
- **Dual Response Format**: JSON for API requests, HTML for web requests
- OpenTelemetry (OTEL) integration for application monitoring and tracing
- Flash messages for user feedback using connect-flash

#### Error Handling Examples:

**Basic Usage:**
```js
const { asyncHandler, ValidationError, AuthenticationError } = require("../middlewares/errorHandler");

// Replace try-catch with asyncHandler
const getUsers = asyncHandler(async (req, res) => {
  const [users] = await db.query("SELECT * FROM users");
  res.render("pages/admin/user/index", { users });
});
```

**Input Validation:**
```js
const createUser = asyncHandler(async (req, res) => {
  const { email, username } = req.body;
  
  if (!email) {
    throw new ValidationError("Email is required", "email");
  }
  
  if (!username) {
    throw new ValidationError("Username is required", "username");
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please provide a valid email address", "email");
  }
  
  // Business logic...
});
```

**Authorization Checks:**
```js
const deleteUser = asyncHandler(async (req, res) => {
  // Check user permissions
  if (req.session.user.role !== "Admin") {
    throw new AuthorizationError("Only admins can delete users");
  }
  
  // Check if trying to delete self
  if (req.params.id === req.session.user.id) {
    throw new ValidationError("Cannot delete your own account");
  }
  
  // Delete logic...
});
```

**Database Error Handling:**
```js
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  
  try {
    const [result] = await db.query("UPDATE users SET email = ? WHERE id = ?", [email, id]);
    
    if (result.affectedRows === 0) {
      throw new ValidationError("User not found");
    }
  } catch (dbError) {
    if (dbError.code === "ER_DUP_ENTRY") {
      throw new ValidationError("Email already exists", "email");
    }
    throw new DatabaseError(`Database operation failed: ${dbError.message}`);
  }
  
  res.json({ success: true });
});
```

**API vs Web Response:**
```js
const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  
  if (users.length === 0) {
    throw new ValidationError("User not found");
  }
  
  // For API requests: returns JSON { success: false, error: {...} }
  // For web requests: redirects with flash message or renders error page
  
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.json({ user: users[0] });
  } else {
    res.render("pages/admin/user/profile", { user: users[0] });
  }
});
```

**File Upload with Error Handling:**
```js
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError("File upload is required");
  }
  
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ValidationError("Only JPEG, PNG, and PDF files are allowed");
  }
  
  if (req.file.size > 5 * 1024 * 1024) { // 5MB
    throw new ValidationError("File size must be less than 5MB");
  }
  
  // Process file...
});
```

**CSRF Error Handling:**
The centralized error handler automatically catches CSRF token validation errors:
```js
// Automatic handling in centralizedErrorHandler.js
if (err.code === "EBADCSRFTOKEN") {
  statusCode = 403;
  message = "CSRF token validation failed. Please refresh the page and try again.";
  isOperational = true;
}
```

**CSRF Protected Routes:**
```js
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");

// Apply CSRF protection to POST routes
router.post("/login", authLimiter, doubleCsrfProtection, auth.login);
router.post("/user/create", doubleCsrfProtection, user.createNewUser);
router.post("/logout", doubleCsrfProtection, auth.logout);
```

### Frontend Architecture

- Nunjucks templates with layout inheritance
- Bootstrap + Alpine.js + HTMX for modern interactions
- DataTables for advanced table functionality
- Component-based template structure in `views/components/`

### Nunjucks Configuration (app.js)

- **Global Variables**:

  - `currentYear` - Current year for footer/copyright
  - `marked` - Markdown parser for content rendering
  - `user` - Current logged-in user (via middleware)
  - `url` - Current request URL for navigation highlighting
  - `success_msg`/`error_msg` - Flash messages for user feedback
  - `csrf`/`csrfToken` - CSRF token for form protection
  - `csrfField()` - Helper function to generate CSRF hidden input field

- **Custom Filters**:
  - `formatRupiah(amount)` - Formats numbers as Indonesian Rupiah currency
  - `formatDateTime(date, format)` - Formats datetime with configurable timezone (default: "DD MMMM YYYY HH:mm:ss")
  - `formatDate(date, format)` - Formats date only with configurable timezone (default: "DD MMMM YYYY")
  - `formatTime(date, format)` - Formats time only with configurable timezone (default: "HH:mm:ss")
  - `date` - Standard date filter with YYYY default format

## Configuration System

**Centralized Configuration**: All configuration managed through `config/` directory with environment-specific overrides and feature-based validation.

### Configuration Files

- `config/index.js` - Base configuration with all environment variables
- `config/development.js` - Development environment overrides (debug enabled, seeds allowed)
- `config/production.js` - Production environment overrides (secure cookies, no seeds)
- `config/validation.js` - Environment variable validation with feature-based approach

### Environment Variable Validation

**Feature-Based Validation System**: The application uses a batteries-included approach where optional features only require their environment variables when explicitly enabled.

**Core Required Variables** (always validated):
- `SESSION_KEY` - Session encryption key
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection

**Basic Configuration Variables** (have defaults):
- `NODE_ENV` - Environment (default: "development")
- `APP_URL` - Application URL (default: "http://localhost")
- `PORT` - Server port (default: 1234)
- `CSRF_SECRET` - CSRF token secret (falls back to SESSION_KEY)
- `SESSION_TIMEOUT_HOURS` - Session timeout in hours (default: 24)

### Optional Features (Batteries-Included)

Each optional feature is controlled by an enable flag and only validates its variables when enabled:

#### Redis Caching (`REDIS_ENABLED=true`)
**Required when enabled:**
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port

**Optional:**
- `REDIS_PASSWORD` - Redis authentication password
- `REDIS_DB` - Redis database number (default: 0)
- `REDIS_USERNAME` - Redis ACL username

#### Email Notifications (`EMAIL_ENABLED=true`)
**Required when enabled:**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password

**Optional:**
- `SMTP_FROM_NAME` - Default sender name
- `SMTP_FROM_EMAIL` - Default sender email address

#### S3 File Storage (`S3_ENABLED=true`)
**Required when enabled:**
- `S3_ENDPOINT_URL` - S3-compatible endpoint URL
- `S3_ACCESS_KEY` - S3 access key ID
- `S3_SECRET_KEY` - S3 secret access key
- `S3_BUCKET_NAME` - S3 bucket name

**Optional:**
- `S3_FOLDER_NAME` - S3 folder/prefix for file organization
- `S3_REGION` - S3 region (if applicable)

#### OpenTelemetry Monitoring (`MONITORING_ENABLED=true`)
**Required when enabled:**
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` - OTLP traces endpoint URL

**Optional:**
- `OTEL_SERVICE_NAME` - Service name (default: "omniflow-starter")
- `OTEL_SERVICE_VERSION` - Service version (default: "1.0.0")
- `OTEL_METRICS_PORT` - Prometheus metrics port (default: 9091)
- `OTEL_METRICS_ENDPOINT` - Metrics endpoint path (default: "/metrics")

### Built-in Features (Always Available)

**Response Compression Configuration:**
- `COMPRESSION_ENABLED` - Enable/disable all compression (default: true)
- `COMPRESSION_THRESHOLD` - Minimum response size to compress in bytes (default: 1024)
- `COMPRESSION_LEVEL` - Gzip compression level 1-9 (default: 6)
- `COMPRESSION_CHUNK_SIZE` - Gzip streaming chunk size in bytes (default: 16384)
- `BROTLI_ENABLED` - Enable/disable Brotli compression (default: true)
- `BROTLI_QUALITY` - Brotli quality 0-11 (default: 4)
- `BROTLI_CHUNK_SIZE` - Brotli streaming chunk size in bytes (default: 16384)

**Logging Configuration:**
- `TIMEZONE` - Application timezone (default: "Asia/Jakarta")
- `LOG_LEVEL` - Logging level (default: "info")
- `LOG_FILE` - Log file path (default: "./logs/app.log")

### Validation Behavior

**Startup Validation**: The application validates all environment variables at startup via `config/validation.js`:

1. **Core variables** are always checked and application fails if missing
2. **Feature variables** are only checked if the feature is enabled (`FEATURE_ENABLED=true`)
3. **Optional variables** with defaults never cause startup failure
4. **Helpful error messages** guide users to disable unused features or check their `.env` file

**Example validation output:**
```
🔧 [CONFIG] Enabled optional features:
   • Redis caching (REDIS_ENABLED=true)
   • Email notifications (EMAIL_ENABLED=true)

✅ [CONFIG] Validation passed (2 optional features enabled)
```

**Error example:**
```
❌ [CONFIG] Missing required environment variables:
   REDIS_HOST (required for Redis caching)
   SMTP_HOST (required for Email notifications)

💡 [CONFIG] Tips:
   • Check your .env file (example: .env.example)
   • Disable unused features by setting FEATURE_ENABLED=false
   • Only enabled features require their variables
```

## Code Quality

### Formatter & Linter Setup

- **Biome**: All-in-one formatter and linter for JavaScript/Node.js
- **Configuration**: `biome.json` with Prettier-style formatting rules
- **Commands**: `npm run format` (fix), `npm run lint` (check only)
- **Features**: Auto-fix, unused variable detection, consistent code style
- **Template Files**: Manual formatting (no automated tooling for Nunjucks)

### Biome Configuration Highlights

- **Prettier-style**: Double quotes, semicolons, trailing commas
- **Line width**: 80 characters
- **Indentation**: 2 spaces
- **Auto-organize imports**: Enabled
- **Ignored paths**: `node_modules/`, `public/`, `logs/`, `*.min.js`

## Testing

- No test framework currently configured
- Manual testing via web interface
- Database seeder provides test users for development

## Additional Resources

https://chatgpt.com/share/6883a5cc-f2c0-8005-95cf-e8a76653d1d2
