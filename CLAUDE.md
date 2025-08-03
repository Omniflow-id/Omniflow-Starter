# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Omniflow-Starter** is a Node.js ERP module starter pack built with Express.js, MySQL, and Nunjucks templating. It provides user management, role-based access control, activity logging, Excel file processing, and enterprise-grade RabbitMQ job queue system for HRIS applications.

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

- **MySQL with optimized connection pooling** (`db/db.js`) using centralized config
- **Connection Pool Management**: Environment-aware pool sizing and monitoring
- **Main tables**: `users` (with full_name field) and `activity_logs`
- **Knex.js integration**: Database migrations and seeding with proper tracking
- **Migrations**: Located in `db/migrations/` with timestamp-based naming
- **Seeders**: Located in `db/seeders/` for development data
- **Default users**:
  - admin@omniflow.id/Admin12345.
  - manager@omniflow.id/Manager12345.
  - user@omniflow.id/User12345.

#### Connection Pool Optimization

- **Environment-aware sizing**: 10 connections (dev) vs 50 connections (prod)
- **Timeout management**: 60s acquire timeout, 60s query timeout
- **Health monitoring**: Connection lifecycle logging and error tracking
- **Auto-reconnection**: Built-in reconnection with configurable retry logic
- **Pool statistics**: Real-time connection metrics via `getPoolStats()`
- **Graceful shutdown**: Proper cleanup with `closePool()` function

### Authentication & Authorization

- **Session-based auth** with 24-hour timeout for web interface
- **Sliding Session Timeout**: Implements an optimal session timeout strategy to enhance user experience.
  - **Automatic Renewal**: Session lifetime is automatically extended with any user activity (e.g., clicks, keypresses), preventing unexpected logouts for active users.
  - **Client-Side Warning**: A warning modal appears 2 minutes before the session expires due to inactivity, giving the user a chance to extend it.
  - **Keep-Alive Endpoint**: A dedicated `/api/session/keep-alive` endpoint allows the client to silently refresh the session without a full page reload.
  - **Configuration**:
    - Enabled via `rolling: true` in the `express-session` configuration (`config/index.js`).
    - Session duration is controlled by the `SESSION_TIMEOUT_HOURS` environment variable.
    - Client-side timers and modal logic are handled in `public/js/session-timeout.js`.
- **JWT Authentication** for API endpoints with access/refresh tokens
- **Three roles**: Admin (full access), Manager (limited admin), User (basic)
- **Web Middleware**: `isLoggedIn` (auth check), `isAdmin` (admin-only routes)
- **API Middleware**: `verifyJWT` (access token), `verifyRefreshToken` (refresh token)
- **Web Routes**: `/admin/login` and `/admin/logout`
- **API Routes**: `/api/login`, `/api/refresh`, `/api/protected`

### Password Policy System

- **Comprehensive Password Policies** with configurable complexity requirements
- **Automatic Password Generation** for bulk user uploads using predictable patterns
- **Pattern Format**: `FullNameWithoutSpaces@12345?.` (e.g., `EricJulianto@12345?.`)
- **Policy Features**:
  - Configurable minimum/maximum length (default: 8-128 characters)
  - Character type requirements (uppercase, lowercase, numbers, symbols)
  - Forbidden pattern detection (common words, personal information)
  - Maximum consecutive identical characters limit
  - Password strength scoring and validation feedback
- **Bulk Upload Integration**: Excel files now require only 4 columns (name, email, full_name, role)
- **Generated Password Display**: Admin interface shows generated passwords for communication
- **Policy Configuration**: Environment variables for customizable password requirements
- **Login Protection**: Automatic password complexity validation during authentication

### User Account Management

- **Account Status Control**: `is_active` boolean field for enabling/disabling user accounts
- **Admin Dashboard**: Toggle active/inactive status with visual badges and intuitive controls
- **Access Control Middleware**: `checkActiveUser` middleware prevents inactive users from accessing system
- **Login Protection**: Inactive users blocked at login with clear error messages
- **Self-Protection**: Admins cannot deactivate their own accounts
- **Activity Logging**: All account status changes logged with comprehensive audit trail
- **Session Management**: Automatic session cleanup for deactivated users
- **UI Features**:
  - Status badges (Active/Inactive) with color coding
  - Toggle buttons with icons (activate/deactivate)
  - Prevention of self-deactivation in interface
  - CSRF protection on all status change operations

### Route Structure

- **Public**: `/` (client landing)
- **Admin Web**: `/admin/*` (dashboard, user management, logs)
- **User Management**: `/admin/user/*` (CRUD, Excel import/export)
- **Activity Logs**: `/admin/log/*` (view logs, export)
- **API Endpoints**: `/api/*` (JWT-based authentication, JSON responses)

### Enterprise-Grade Activity Logging System

**Comprehensive Audit Trail**: Production-ready logging system with enterprise-grade features for complete observability and compliance.

#### Core Features

- **🔄 Dual Activity Types**: User activities and system infrastructure events
- **📊 Rich Metadata Capture**: Request tracing, device fingerprinting, performance metrics
- **🔐 Sensitive Data Masking**: Automatic PII protection with configurable masking patterns
- **📝 Data Change Tracking**: Before/after state capture for all database modifications
- **🎯 UUID Request Tracing**: End-to-end request correlation across distributed systems
- **⚡ High Performance**: Nullable schema design with strategic indexing for optimal performance

#### Database Schema

**Comprehensive activity_logs table**:
```sql
- id (primary key)
- activity_type (enum: user, system) - Distinguishes user actions from system events
- activity (text) - Human-readable activity description
- action_type (string) - Structured action classification (login, create, update, delete, etc.)
- resource_type (string) - Target resource classification (user, file, cache, queue, etc.)
- resource_id (string) - Identifier of affected resource
- user_id, username, user_email, user_role (nullable) - User context for user activities
- ip_address, user_agent, device_type, browser, platform (nullable) - Request context
- request_method, request_url, request_id (nullable) - HTTP request details
- metadata (JSON) - Flexible additional data storage
- status (enum: success, failure, warning, info) - Operation outcome
- error_message, error_code (nullable) - Error details for failed operations
- duration_ms (nullable) - Performance tracking
- created_at (immutable audit trail)
```

#### Logging Functions

**User Activity Logging**:
```javascript
const { logUserActivity } = require("@helpers/log");

await logUserActivity({
  activity: "User login successful",
  actionType: ACTION_TYPES.LOGIN,
  resourceType: RESOURCE_TYPES.USER,
  metadata: {
    loginMethod: "email_password",
    sessionDuration: "24h",
  },
}, req);
```

**System Activity Logging**:
```javascript
const { logSystemActivity } = require("@helpers/log");

await logSystemActivity({
  activity: "Redis cache connected successfully",
  metadata: {
    eventType: "redis_connected",
    host: config.redis.host,
    port: config.redis.port,
  },
});
```

**Data Change Tracking**:
```javascript
await logUserActivity({
  activity: "User account deactivated",
  actionType: ACTION_TYPES.UPDATE,
  resourceType: RESOURCE_TYPES.USER,
  resourceId: userId,
  dataChanges: {
    before: { is_active: true, status: "active" },
    after: { is_active: false, status: "inactive" },
    changedFields: ["is_active"],
  },
}, req);
```

#### Sensitive Data Masking

**Automatic PII Protection**:
```javascript
// Automatically masks sensitive fields
const userData = {
  email: "user@example.com",
  password: "secret123",
  phone: "08123456789",
  ssn: "123-45-6789"
};

const masked = maskSensitiveData(userData);
// Result: { email: "u***@example.com", password: "***", phone: "081***789", ssn: "***-**-6789" }
```

**Custom Masking Options**:
```javascript
const masked = maskSensitiveData(data, {
  maskingChar: "●",
  showFirst: 2,
  showLast: 2,
  customPatterns: ["api_key", "token"]
});
```

#### Infrastructure Monitoring

**System Event Coverage**:
- **Database Pool**: Connection errors, health checks, pool statistics
- **Redis Cache**: Connection events, errors, performance metrics
- **RabbitMQ Queue**: Connection status, job processing, circuit breaker states
- **Circuit Breaker**: State transitions (OPEN/CLOSED/HALF_OPEN)
- **Application**: Startup, shutdown, configuration validation

**Performance Tracking**:
- Response time monitoring
- Database query performance
- Cache hit/miss ratios
- Queue processing metrics
- Memory usage tracking

#### Admin Interface Features

**Activity Log Management** (`/admin/log/*`):
- **Advanced Filtering**: 5 filter options (activity type, action type, resource type, status, date range)
- **Real-time Search**: Dynamic filtering with DataTables integration
- **Detailed View**: Modal-based detailed view with metadata expansion
- **Data Changes**: Before/after comparison visualization
- **Export Capabilities**: CSV/Excel export with filtered results
- **Performance**: Redis-cached results with 2-minute TTL

#### Security & Compliance

**Audit Trail Features**:
- **Immutable Logs**: No update/delete operations on activity logs
- **Request Correlation**: UUID-based request tracing across services
- **User Attribution**: Complete user context for all actions
- **Error Tracking**: Comprehensive error logging with stack traces
- **Performance Monitoring**: Response time and resource usage tracking

**Compliance Ready**:
- **GDPR**: Automatic PII masking and data subject tracking
- **SOX**: Complete audit trail with user attribution
- **HIPAA**: Sensitive data protection and access logging
- **ISO 27001**: Comprehensive security event logging

#### Console Logging Standards

**Standardized Log Format**: All console logging follows a consistent format with category tags and emoji indicators for easy visual parsing.

**Log Categories & Format**:
```
🚀 [SERVER] - Server startup/shutdown operations
🔧 [WORKERS] - Worker management and lifecycle
🧪 [TEST-WORKER] - Test worker job processing
🐰 [RABBITMQ] - RabbitMQ queue operations and connections
🟢 [REDIS] - Redis cache operations and connections
💾 [DATABASE] - Database pool operations and health
🔐 [CIRCUIT-BREAKER] - Circuit breaker state changes
🗃️ [CACHE] - Cache helper operations and performance
🛑 [SHUTDOWN] - Graceful shutdown processes
```

**Status Indicators**:
```
✅ Success/Connected - Successful operations
❌ Error/Failed - Error conditions and failures
⚠️ Warning/Disabled - Warnings and disabled features
🔄 Retry/Reconnect - Retry attempts and reconnections
📤 Send/Output - Data transmission operations
👂 Listen/Consume - Service consumers and listeners
⚙️ Processing - Active processing operations
😇 Graceful - Graceful shutdown operations
💀 Force - Force shutdown/termination
```

**Example Log Outputs**:
```
✅ [REDIS] Connected successfully
🐰 [RABBITMQ] Attempting connection: { attempt: 1 }
⚙️ [RABBITMQ] Processing job from test_queue
❌ [DATABASE] Pool error: Connection timeout
🔄 [CIRCUIT-BREAKER] HALF_OPEN for RabbitMQ
🛑 [SHUTDOWN] Received SIGTERM, starting graceful shutdown...
```

**Benefits**:
- **Visual Clarity**: Easy to scan logs visually
- **Category Filtering**: Simple to filter by component
- **Status Recognition**: Quick status identification
- **Debug Friendly**: Enhanced development experience
- **Production Ready**: Clean, structured production logs

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
    <input type="email" name="email" required />
    <input type="password" name="password" required />
    <button type="submit">Login</button>
  </form>

  <!-- Alternative using global variables -->
  <form action="/protected" method="post">
    <input type="hidden" name="_csrf" value="{{ csrf }}" />
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

### Redis Caching System

- **High-Performance Caching**: Redis-based caching with database fallback for improved performance
- **Connection Management**: Robust Redis connection with automatic reconnection and error handling
- **Cache Strategies**: Multiple caching patterns for different use cases
- **Cache Invalidation**: Intelligent cache invalidation on data changes

#### Redis Features

- **Automatic Fallback**: Graceful degradation to database when Redis is unavailable
- **Connection Pool**: Optimized Redis connection with retry logic and health monitoring
- **TTL Support**: Configurable time-to-live for cache entries
- **Pattern-based Invalidation**: Wildcard support for bulk cache invalidation
- **Multiple Cache Types**: User-specific, admin-specific, and API caching patterns

#### Cache Middleware

- **Response Caching**: `cacheMiddleware` for automatic route response caching
- **User-specific Caching**: `userCacheMiddleware` for user-specific data
- **Admin Caching**: `adminCacheMiddleware` for admin panel data with shorter TTL
- **API Caching**: `apiCacheMiddleware` for API endpoints with proper cache headers
- **Cache Invalidation**: `invalidateCacheMiddleware` for automatic cache cleanup

#### Cache Helper Functions

- **`handleCache()`**: Primary caching function with fallback strategy and performance tracking
- **`invalidateCache()`**: Pattern-based cache invalidation with wildcard support
- **`setCache()`/`getCache()`**: Direct cache operations for manual cache management
- **`flushCache()`**: Bulk cache clearing with prefix filtering
- **`getCacheStats()`**: Cache performance monitoring and connection statistics
- **`listKeys()`**: Cache key enumeration with pattern filtering and TTL information

#### Cache Configuration

**Environment Variables:**

```env
# Core Redis Settings
REDIS_ENABLED=true                      # Enable Redis caching
REDIS_HOST=127.0.0.1                    # Redis server host
REDIS_PORT=6379                         # Redis server port
REDIS_PASSWORD=                         # Redis password (optional)
REDIS_DB=0                             # Redis database number

# Advanced Configuration
REDIS_MAX_RETRIES=5                     # Connection retry attempts
REDIS_DEFAULT_TTL=3600                  # Default cache TTL (1 hour)
REDIS_KEY_PREFIX=omniflow:              # Cache key prefix
```

#### Usage Examples

**Basic Route Caching:**

```js
const { handleCache } = require("@helpers/cache");

const getUsers = async (req, res) => {
  const result = await handleCache({
    key: "admin:users:list",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [users] = await db.query("SELECT * FROM users");
      return users;
    },
  });

  res.render("users", { 
    users: result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
};
```

**Cache Invalidation on Data Changes:**

```js
const { invalidateCache } = require("@helpers/cache");

const createUser = async (req, res) => {
  // Create user logic...
  await db.query("INSERT INTO users...", userData);

  // Invalidate related caches
  await invalidateCache("admin:users:*", true);
  await invalidateCache("user:*", true);

  res.redirect("/admin/users");
};
```

**Middleware Usage:**

```js
const { userCacheMiddleware } = require("@middlewares/cache");

// Cache user-specific data for 30 minutes
router.get("/profile", userCacheMiddleware({ ttl: 1800 }), getUserProfile);
```

#### Cache Management

The application provides two distinct cache management interfaces:

**Admin Web Interface** (`/admin/cache/*`) - **Human Interface**:

- **Authentication**: Session-based (`isLoggedIn`, `isAdmin`)
- **Purpose**: Manual cache management via web dashboard
- **Response Format**: HTML pages with flash messages for user feedback
- **Dual Response Support**: JSON for AJAX calls, redirects for form submissions
- **Routes**:
  - **GET** `/admin/cache/stats` - Cache statistics page with visual dashboard
  - **GET** `/admin/cache/test` - Cache performance test with user feedback
  - **GET** `/admin/cache/health` - Cache health check with status display
  - **POST** `/admin/cache/flush` - Flush all cache with success/error messages
  - **POST** `/admin/cache/invalidate` - Pattern-based cache invalidation with feedback

**API Endpoints** (`/api/cache/*`) - **Programmatic Access**:

- **Authentication**: JWT-based (`verifyJWT`) for machine-to-machine communication
- **Purpose**: External applications, mobile apps, microservices integration
- **Response Format**: Pure JSON responses for automated systems
- **Extended Features**: Export/import capabilities and detailed metrics
- **Routes**:
  - **GET** `/api/cache/stats` - Cache statistics (JSON)
  - **GET** `/api/cache/test` - Cache performance test (JSON)
  - **GET** `/api/cache/health` - Cache health status (JSON)
  - **GET** `/api/cache/metrics` - Detailed cache metrics (JSON)
  - **GET** `/api/cache/export` - Export cache data (JSON)
  - **POST** `/api/cache/import` - Import cache data (JSON)
  - **POST** `/api/cache/flush` - Flush all cache (JSON)
  - **POST** `/api/cache/invalidate` - Pattern-based invalidation (JSON)

**Controller Pattern**: Both interfaces follow the controller pattern with:

- `cache.controller.js` (admin) and `cache.api.controller.js` (API)
- Clean separation between web and API logic
- Centralized export/import from individual controller files

### Cache Info Component

**Global Cache Information Display**: The application provides a floating cache information component that shows cache performance metrics on all cached pages.

**Implementation**: `@views/components/cache_info.njk`
- **Floating Design**: Non-intrusive floating element in top-right corner
- **Real-time Metrics**: Shows cache source (redis/database) and response time
- **Global Integration**: Automatically included in `masterLayout.njk` 
- **Color-coded Badges**: Green for cache hits, yellow for database fallback

**Template Usage**: Controllers pass `cacheInfo` object:
```js
res.render("pages/admin/users", {
  users: result.data,
  cacheInfo: {
    source: result.source,        // 'redis' or 'database'
    duration_ms: result.duration_ms, // Response time in milliseconds
  },
});
```

**Visual Indicators**:
- 🟢 **Redis Cache Hit**: Green badge with sub-millisecond response times
- 🟡 **Database Fallback**: Yellow badge when Redis unavailable
- ⚡ **Performance**: Real-time duration display for optimization insights

### Cache Implementation Coverage

**Admin Controllers with Cache**:
- `getAllUsersPage.js` - User list with 5-minute TTL
- `getUserOverviewPage.js` - User statistics with 5-minute TTL  
- `getLogPage.js` - Activity logs with 2-minute TTL

**Automatic Cache Invalidation**:
- `createNewUser.js` - Invalidates `admin:users:*` and `user:*`
- `toggleUserActive.js` - Invalidates `admin:users:*` and user-specific cache
- `uploadNewUser.js` - Bulk invalidation after user import
- `log.js` helper - Invalidates `admin:logs:*` after new log entries (non-blocking)

### RabbitMQ Job Queue System

**Enterprise-Grade Message Queue**: Production-ready job queue system built on RabbitMQ with comprehensive failure handling, monitoring, and admin management.

#### Core Features

- **🔄 Job Lifecycle Management**: Complete job tracking from pending → processing → completed/failed
- **💾 Database Persistence**: Jobs stored in MySQL `jobs` table for durability and monitoring
- **🐰 RabbitMQ Integration**: Reliable message queuing with auto-reconnection and clustering support
- **🛡️ Circuit Breaker Pattern**: Protection against cascading failures with automatic recovery
- **💀 Dead Letter Queue (DLQ)**: Failed message handling with 24-hour TTL and manual recovery
- **👥 Worker Management**: Clean worker abstraction for easy scaling and maintenance

#### Architecture Components

**Queue Helper** (`@helpers/queue.js`):
- **Connection Management**: Auto-reconnection with exponential backoff strategy
- **Circuit Breaker**: RabbitMQ protection with 5-failure threshold and 1-minute recovery
- **Database Fallback**: Job persistence even when RabbitMQ is unavailable
- **Comprehensive Logging**: Production-ready logging with Redis-style format

**Worker System** (`workers/`):
- **WorkerManager**: Orchestrates multiple workers with centralized lifecycle management
- **TestWorker**: Simple console.log worker for development and testing
- **Extensible Design**: Easy to add new workers (email, notifications, reports)

**Admin Management** (`/admin/queue/*`):
- **Real-time Statistics**: Job counts by status with Redis-backed caching
- **Failed Job Management**: View, retry, and monitor failed jobs with pagination
- **Connection Monitoring**: RabbitMQ connection status and circuit breaker state
- **Queue Operations**: Send test jobs, retry failed jobs, view recent activity

#### Database Schema

**jobs table**:
```sql
- id (primary key)
- queue (string, indexed)
- data (JSON payload)
- status (enum: pending, processing, completed, failed)
- attempts, max_attempts (retry logic)
- error (failure details)
- available_at, started_at, completed_at (timestamps)
- created_at, updated_at (audit trail)
```

#### Configuration

**Environment Variables**:
```env
# Core RabbitMQ Settings
RABBITMQ_ENABLED=true
RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Advanced Configuration
RABBITMQ_MAX_RECONNECT_ATTEMPTS=10
RABBITMQ_RECONNECT_DELAY=1000
RABBITMQ_QUEUE_DURABLE=true
RABBITMQ_QUEUE_AUTO_DELETE=false
RABBITMQ_MESSAGE_PERSISTENT=true
```

#### Usage Examples

**Sending Jobs**:
```js
const { sendToQueue } = require("@helpers/queue");

// Simple job
await sendToQueue("test_queue", {
  type: "test_job",
  message: "Hello from admin panel",
  timestamp: new Date().toISOString(),
  triggeredBy: req.session.user.email
});

// Job with options
await sendToQueue("email_queue", emailData, {
  priority: 10,
  maxAttempts: 5
});
```

**Creating Workers**:
```js
// workers/emailWorker.js
const { consume } = require("@helpers/queue");

class EmailWorker {
  async start() {
    await consume("email_queue", async (data) => {
      // Process email job
      await sendEmail(data.to, data.subject, data.body);
    });
  }
}
```

**Admin Integration**:
```js
// Get queue statistics
const stats = await getStats(); // { pending: 5, processing: 2, completed: 100, failed: 3 }

// Get failed jobs with pagination
const result = await getFailedJobs(page, limit);

// Retry failed jobs
const retriedCount = await retryFailedJobs(10);
```

#### Monitoring & Management

**Admin Panel Features**:
- **Queue Statistics**: Real-time job counts with cache optimization
- **Connection Status**: RabbitMQ health with circuit breaker state monitoring
- **Failed Job Management**: Detailed error viewing, retry functionality, bulk operations
- **Test Job Creation**: Admin can send test jobs to verify worker functionality
- **Cache Integration**: Queue stats cached for 2 minutes for performance

**Circuit Breaker States**:
- **CLOSED**: Normal operation, all jobs processed
- **OPEN**: Service protection active, jobs saved to database only
- **HALF_OPEN**: Testing recovery, limited job processing

**Dead Letter Queue**:
- **Automatic Routing**: Jobs failing 3+ times automatically moved to DLQ
- **24-Hour TTL**: DLQ messages expire after 24 hours to prevent buildup
- **Manual Recovery**: Admin can view and reprocess DLQ messages

#### Production Deployment

**Single Command Startup**:
```bash
npm start  # Starts server + workers automatically
```

**Graceful Shutdown**:
- Proper RabbitMQ connection cleanup
- Worker process termination
- Database connection pool closure
- 10-second force shutdown timeout

**Scaling Considerations**:
- Workers run in same process for development
- Easy to separate workers to different processes/servers
- RabbitMQ clustering supported for high availability
- Database connection pooling optimized for concurrent job processing

#### Integration with Existing Systems

**Cache Invalidation**:
- Queue operations invalidate `admin:queue:*` cache patterns
- Real-time statistics updated after job status changes
- Cache-aside pattern for optimal performance

**Activity Logging**:
- All queue operations logged to activity system
- Job failures tracked with full error context
- Admin actions (retry, test jobs) logged with user attribution

**Error Handling**:
- Circuit breaker failures logged with context
- Database fallback operations tracked
- Comprehensive error messages for admin troubleshooting

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
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
} = require("../middlewares/errorHandler");

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
    const [result] = await db.query("UPDATE users SET email = ? WHERE id = ?", [
      email,
      id,
    ]);

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

  if (req.file.size > 5 * 1024 * 1024) {
    // 5MB
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
  message =
    "CSRF token validation failed. Please refresh the page and try again.";
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

#### RabbitMQ Job Queue (`RABBITMQ_ENABLED=true`)

**Required when enabled:**

- `RABBITMQ_HOST` - RabbitMQ server host
- `RABBITMQ_PORT` - RabbitMQ server port
- `RABBITMQ_USER` - RabbitMQ authentication username
- `RABBITMQ_PASSWORD` - RabbitMQ authentication password

**Optional:**

- `RABBITMQ_MAX_RECONNECT_ATTEMPTS` - Max reconnection attempts (default: 10)
- `RABBITMQ_RECONNECT_DELAY` - Reconnection delay in ms (default: 5000)
- `RABBITMQ_QUEUE_DURABLE` - Queue durability (default: true)
- `RABBITMQ_QUEUE_AUTO_DELETE` - Auto-delete queues (default: false)
- `RABBITMQ_MESSAGE_PERSISTENT` - Message persistence (default: true)

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

#### JWT Authentication (`JWT_ENABLED=true`)

**Required when enabled:**

- `JWT_SECRET` - JWT signing secret key

**Optional:**

- `JWT_EXPIRES_IN` - Access token expiration (default: "1h")
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: "7d")
- `JWT_ALGORITHM` - JWT signing algorithm (default: "HS256")

#### CORS Configuration (`CORS_ENABLED=true`)

**Optional (all have defaults):**

- `CORS_ORIGIN` - Allowed origins (default: "\*", support comma-separated multiple origins)
- `CORS_CREDENTIALS` - Allow credentials (default: true)
- `CORS_METHODS` - Allowed HTTP methods (default: "GET,HEAD,PUT,PATCH,POST,DELETE")
- `CORS_ALLOWED_HEADERS` - Allowed request headers
- `CORS_EXPOSED_HEADERS` - Headers exposed to client
- `CORS_MAX_AGE` - Preflight cache duration in seconds (default: 86400)
- `CORS_PREFLIGHT_CONTINUE` - Pass preflight to next handler (default: false)
- `CORS_OPTIONS_SUCCESS_STATUS` - Status code for successful OPTIONS requests (default: 204)

### Built-in Features (Always Available)

**Response Compression Configuration:**

- `COMPRESSION_ENABLED` - Enable/disable all compression (default: true)
- `COMPRESSION_THRESHOLD` - Minimum response size to compress in bytes (default: 1024)
- `COMPRESSION_LEVEL` - Gzip compression level 1-9 (default: 6)
- `COMPRESSION_CHUNK_SIZE` - Gzip streaming chunk size in bytes (default: 16384)
- `BROTLI_ENABLED` - Enable/disable Brotli compression (default: true)
- `BROTLI_QUALITY` - Brotli quality 0-11 (default: 4)
- `BROTLI_CHUNK_SIZE` - Brotli streaming chunk size in bytes (default: 16384)

**Database Connection Pool:**

- `DB_CONNECTION_LIMIT` - Max simultaneous connections (default: 10 dev, 50 prod)
- `DB_ACQUIRE_TIMEOUT` - Connection acquire timeout in ms (default: 60000)
- `DB_QUERY_TIMEOUT` - Query timeout in ms (default: 60000)

**Password Policy Configuration:**

- `PASSWORD_MIN_LENGTH` - Minimum password length (default: 8)
- `PASSWORD_MAX_LENGTH` - Maximum password length (default: 128)
- `PASSWORD_REQUIRE_UPPERCASE` - Require uppercase letters (default: true)
- `PASSWORD_REQUIRE_LOWERCASE` - Require lowercase letters (default: true)
- `PASSWORD_REQUIRE_NUMBERS` - Require numbers (default: true)
- `PASSWORD_REQUIRE_SYMBOLS` - Require special characters (default: true)
- `PASSWORD_MIN_SYMBOLS` - Minimum special characters (default: 1)
- `PASSWORD_MIN_NUMBERS` - Minimum numbers (default: 1)
- `PASSWORD_MAX_REPEATING` - Max consecutive identical chars (default: 3)
- `PASSWORD_FORBIDDEN_PATTERNS` - Comma-separated forbidden words

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

### Import Organization Standards

**All JavaScript files in this project follow a consistent import organization pattern**:

```js
// === Side-effect imports (HARUS PALING ATAS) ===
require("./instrument.js"); // OTEL, APM, error monitoring
require("module-alias/register"); // Module alias registration
require("dotenv").config(); // Environment variable loading

// === Core modules ===
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

// === Third-party modules ===
const express = require("express");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
// ... sorted alphabetically

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { log, LOG_LEVELS } = require("@helpers/log");
const { csrfGlobalMiddleware } = require("@middlewares/csrfProtection");
// ... sorted alphabetically

// === Relative imports ===
const config = require("./config");
const routes = require("./routes");
// ... sorted alphabetically
```

**Import Organization Rules**:

1. **Side-effect imports** go first (instrument.js, module-alias, dotenv)
2. **Core modules** (Node.js built-ins with `node:` prefix)
3. **Third-party modules** (from node_modules, sorted alphabetically)
4. **Absolute/alias imports** (using `@` aliases, sorted alphabetically)
5. **Relative imports** (using `./` or `../`, sorted alphabetically)
6. **Visual separation** with comments and blank lines between each group
7. **Alphabetical sorting** within each group for consistency

**Benefits**:

- ✅ **Consistency** across all files
- ✅ **Readability** with clear visual separation
- ✅ **Maintainability** easy to add/remove dependencies
- ✅ **Team-ready** standardized structure

## Testing

- **No test framework** currently configured
- **Manual testing** via web interface and API test suite
- **Database seeder** provides test users for development
- **JWT API Test Suite**: `examples/implement_jwt.html` - Comprehensive testing interface with:
  - **Token Management**: localStorage persistence with automatic validation
  - **Authentication APIs**: login, refresh, protected routes testing
  - **Cache API Testing**: stats, performance test, flush operations (requires JWT auth)
  - **Real-time UI**: Beautiful animations, toasts, loading states
  - **CORS Support**: Cross-origin testing capabilities
  - **Modern Design**: Tailwind CSS with gradient backgrounds and micro-interactions
  - **Response Terminal**: JSON syntax highlighting with smooth scrolling
  - **Smart Authorization**: Buttons automatically enable/disable based on login status

### Local GitHub Actions Testing

- **nektos/act**: Local GitHub Actions runner for testing workflows before pushing
- **Installation**: `brew install act` (macOS) or check [nektos/act documentation](https://github.com/nektos/act)
- **Usage**: `act` - Run all workflows locally
- **Secret files**: Use `.secrets` file for environment variables (already ignored in `.gitignore`)
- **Benefits**: Test CI/CD workflows locally without pushing to GitHub

## Additional Resources

https://chatgpt.com/share/6883a5cc-f2c0-8005-95cf-e8a76653d1d2
