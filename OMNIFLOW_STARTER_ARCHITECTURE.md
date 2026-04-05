# Omniflow Starter Architecture

Reference document for building consistent modules (Helpdesk, CRM, Inventory, HR, Project).

---

## 1. Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Templating | Nunjucks |
| Query Builder | Knex.js |
| Database | MySQL |
| Cache | Redis |
| Queue | RabbitMQ |
| Auth (Web) | express-session |
| Auth (API) | JWT (jsonwebtoken) |
| Validation | Custom (ValidationError class) |
| Security | helmet, csrf-csrf, express-rate-limit, cors |
| File Processing | Multer, ExcelJS |
| Code Quality | Biome (formatter/linter) |

---

## 2. Folder Structure

| Directory | Purpose |
|-----------|---------|
| `/config` | Environment configuration & validation |
| `/db` | Database layer (migrations, seeders) |
| `/helpers` | Utility functions (cache, queue, email, logging) |
| `/middlewares` | Express middleware (auth, rate limiting, error handling) |
| `/routes` | Route handlers (web & API) |
| `/services` | Business logic (currently unused, logic in routes) |
| `/views` | Nunjucks templates |
| `/public` | Static assets (JS, CSS, images) |
| `/workers` | Background job workers |

---

## 3. Module Pattern

**Hybrid**: Layer-based with feature-nested structure.

```
routes/
├── admin/                    # Web routes (session auth)
│   ├── {feature}/
│   │   ├── {feature}.router.js
│   │   └── *.js             # Individual route handlers
│   └── admin.router.js      # Mounts all sub-routers
├── api/                     # API routes (JWT auth)
│   ├── {feature}/
│   │   └── *.router.js
│   └── api.router.js
└── client/                  # Public/client routes
```

### Route Group Structure
Each feature has its own folder under `routes/admin/` or `routes/api/`:

```
routes/admin/user/
├── user.router.js           # Router definition
├── user.controller.js        # Optional: shared controller functions
├── getAllUsersPage.js      # GET /user/index handler
├── createNewUser.js        # POST /user/create handler
├── updateUser.js         # POST /user/update/:id handler
├── deleteUser.js       # POST /user/delete/:id handler
└── ...
```

---

## 4. Database Pattern (Knex)

### Migration Naming
```
db/migrations/YYYYMMDDHHMMSS_{description}.js
```

### Table Conventions
- **Snake_case** for table/column names
- **Primary key**: `id` (INT AUTO_INCREMENT)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (nullable for soft delete)
- **Foreign keys**: `{table}_id` pattern (e.g., `role_id`, `user_id`)

### Soft Delete Pattern
```javascript
table.timestamp("deleted_at").nullable(); // Soft delete
```

### Seeder Location
```
db/seeders/
├── index.js              # Master seeder (calls others in order)
└── data/
    ├── roles.js
    ├── permissions.js
    ├── rolePermissions.js
    └── users.seeder.js
```

---

## 5. Routing Pattern

### URL Convention
- Web: `/admin/{feature}`, `/admin/{feature}/action`
- API: `/api/{feature}`, `/api/{feature}/action`

### Router Registration (admin.router.js)
```javascript
router.use("/{feature}", isLoggedInAndActive, adminLimiter, featureRouter);
```

### Route Files Export
Each route file exports a function or router:
```javascript
module.exports = router;
// or individual handlers exported
```

### Middleware Stack (typical)
```javascript
router.get("/path", withLocale("admin/feature"), handler);
// withLocale: i18n translation
// isLoggedInAndActive: auth check
// adminLimiter: rate limiting
// doubleCsrfProtection: CSRF for POST
```

---

## 6. Service Layer Pattern

Business logic currently embedded in route handlers. For consistent modules:

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Validation | Route handler | Input validation, throw ValidationError |
| Orchestration | Route handler | Call helpers, db queries |
| Transactions | Route handler | Use db.query() with callbacks |

```javascript
// Route handler pattern
const createItem = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  // Validation
  if (!name) throw new ValidationError("Name is required", "name");
  
  // Database operation
  const [result] = await db.query("INSERT INTO items (...) VALUES (...)", [...]);
  
  // Cache invalidation
  await invalidateCache("admin:items:*");
  
  // Response
  res.redirect("/admin/items");
});
```

---

## 7. View Layer Pattern (Nunjucks)

### Layout Structure
```
views/
├── layout/
│   └── masterLayout.njk      # Base layout
├── components/
│   ├── sidebar.njk          # Navigation (permission-based)
│   ├── navbar.njk
│   └── ...
├── includes/
│   ├── head.njk
│   └── script.njk
└── pages/
    └── admin/
        └── {feature}/
            └── index.njk     # Feature page
```

### Permission-Based Navigation (sidebar.njk)
```nunjucks
{% if hasPermission(permissions, 'view_items') %}
  <a href="/admin/items">Items</a>
{% endif %}
```

### Template Helpers Available
- `csrfField()` - CSRF hidden input
- `hasPermission(permissions, 'permission_name')`
- `hasAnyPermission(permissions, ['a', 'b'])`
- `hasAllPermissions(permissions, ['a', 'b'])`
- `formatRupiah(amount)` - Currency formatting
- `formatDateTime(date)`, `formatDate(date)`, `formatTime(date)`

### Page Template Pattern
```nunjucks
{% extends "layout/masterLayout.njk" %}

{% block content %}
<div class="container-fluid">
  <h1>{{ t('items.title') }}</h1>
  <!-- content -->
</div>
{% endblock %}
```

---

## 8. Auth Pattern

### Web (Session-Based)
- **Middleware**: `isLoggedInAndActive` - checks session + active status
- **Session timeout**: Configurable via `SESSION_TIMEOUT_HOURS`

### API (JWT)
- **Middleware**: `verifyJWT` - validates access token
- **Refresh**: Separate `/api/refresh` endpoint
- **Location**: `middlewares/jwtAuth.js`

### Permission-Based Access
- **Middleware**: `checkPermission('permission_name')`
- **Dynamic**: Permissions loaded to session on login

### User Model (users table)
```sql
- id INT PRIMARY KEY
- username VARCHAR(255) UNIQUE
- email VARCHAR(255) UNIQUE
- password_hash VARCHAR(255)
- full_name VARCHAR(255)
- role_id INT REFERENCES roles(role_id)
- is_active BOOLEAN DEFAULT TRUE
- created_at, updated_at TIMESTAMP
- deleted_at TIMESTAMP (soft delete)
```

---

## 9. Configuration Pattern

### Environment Variables
- **Location**: `.env` file (see `.env.example`)
- **Validation**: `config/validation.js` - feature-based (only validates enabled features)

### Config Loading (config/index.js)
```javascript
module.exports = {
  app: { name, url, port, env },
  session: { secret, cookie: {...} },
  database: { host, user, password, database, connectionLimit },
  redis: { host, port, enabled },
  rabbitmq: { host, port, user, password, enabled },
  // ...
};
```

### Feature Flags
```javascript
REDIS_ENABLED=true   // Enables Redis caching
RABBITMQ_ENABLED=true  // Enables job queue
EMAIL_ENABLED=true    // Enables email
S3_ENABLED=true     // Enables S3 storage
JWT_ENABLED=true     // Enables JWT auth
```

---

## 10. Logging Pattern

### Activity Logging Helper
```javascript
const { logUserActivity, LOG_LEVELS, ACTION_TYPES, RESOURCE_TYPES } = require("@helpers/log");

await logUserActivity({
  activity: "User created item",
  actionType: ACTION_TYPES.CREATE,
  resourceType: RESOURCE_TYPES.ITEM,
  resourceId: itemId,
  dataChanges: { before: null, after: itemData },
}, req);
```

### Log Table Schema
```sql
activity_logs:
- id
- activity_type (user/system)
- activity (TEXT)
- action_type, resource_type, resource_id
- user_id, username, user_email, user_role
- ip_address, user_agent, device_type
- request_method, request_url
- metadata (JSON)
- status (success/failure/warning/info)
- created_at
```

### Console Logging
Uses emoji prefixes:
- `[SERVER]` - Server startup
- `[WORKERS]` - Worker management
- `[REDIS]` - Redis operations
- `[DATABASE]` - Database operations

---

## 11. Error Handling Pattern

### Custom Error Classes
```javascript
// In middlewares/errorHandler.js / centralizedErrorHandler.js
ValidationError(message, field)    // 400
AuthenticationError(message)       // 401
AuthorizationError(message)         // 403
DatabaseError(message)            // 500
```

### Route Handler Usage
```javascript
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

const createItem = asyncHandler(async (req, res) => {
  if (!name) throw new ValidationError("Name is required", "name");
  // ...
});
```

### Centralized Handler
- **Location**: `middlewares/centralizedErrorHandler.js`
- Handles all errors, logs to activity_logs, returns JSON or HTML based on request type

---

## 12. Recommended Module Template

### New Module Structure

```
routes/admin/{module}/
├── {module}.router.js           # Router definition

routes/admin/{module}/
├── getModulePage.js            # GET /admin/{module}
├── getModuleDetailPage.js      # GET /admin/{module}/:id
├── createModule.js             # POST /admin/{module}/create
├── updateModule.js            # POST /admin/{module}/update/:id
├── deleteModule.js            # POST /admin/{module}/delete/:id

routes/api/{module}/
├── {module}.router.js
├── getItems.api.js           # GET /api/{module}
├── createItem.api.js         # POST /api/{module}

views/pages/admin/{module}/
├── index.njk                  # Main page
├── detail.njk                # Detail page
├── form.njk                  # Create/Edit form

db/migrations/
└── YYYYMMDDHHMMSS_create_{module}_table.js

db/seeders/data/
└── {module}.js               # Seed data (optional)
```

### Feature Router Pattern

```javascript
// routes/admin/{module}/{module}.router.js
const express = require("express");
const router = express.Router();

const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { checkPermission } = require("@middlewares/checkPermission");
const { withLocale } = require("@helpers/i18n");
const { uploadLimiter, exportLimiter } = require("@middlewares/rateLimiter");

router.get("/module/index", withLocale("admin/modules"), handler);
router.post("/module/create", doubleCsrfProtection, handler);

module.exports = router;
```

### Sidebar Integration

Add to `views/components/sidebar.njk`:
```nunjucks
{% if hasPermission(permissions, 'view_modules') %}
  <a href="/admin/module">{{ t('sidebar.module') }}</a>
{% endif %}
```

### Permissions Seeder

Add to `db/seeders/data/permissions.js`:
```javascript
// view_modules, manage_modules, etc.
```

---

## Summary

| Aspect | Convention |
|--------|-----------|
| URLs | `/admin/{module}`, `/api/{module}` |
| DB Names | snake_case, soft delete with `deleted_at` |
| Routes | One file per action in feature folder |
| Views | `pages/admin/{feature}/index.njk` |
| Auth | Session (web), JWT (API) |
| Errors | Custom error classes |
| Config | Environment variables |