# Omniflow-Starter Documentation

Node.js ERP Module Starter Pack with Express.js, MySQL, and Nunjucks

## Overview

**Omniflow-Starter** is a production-ready ERP starter pack built with Express.js, MySQL, and Nunjucks templating. It provides comprehensive user management, flexible permission system, enterprise-grade activity logging, and modular architecture for rapid development.

## Quick Start

```bash
npm install
cp .env.example .env
# Configure database and session key
npm run dev
```

Server runs on port 1234 (or PORT env var)

## Development Commands

- **Start server**: `npm start` or `npm run dev`
- **Code formatting**: `npm run format` (Biome formatter + linter with auto-fix)
- **Code linting**: `npm run lint` (Biome linter check only)
- **No build process** - static files served directly from public/

## Key Features

### 🔐 Authentication & Security

- Session-based authentication with 24-hour timeout
- **2FA Email OTP System** with non-blocking queue-based delivery
- JWT Authentication for API endpoints
- **Flexible Permission Override System (PBAC + RBAC)**
- Multi-tier rate limiting and bot protection
- CSRF protection with Laravel-style implementation

### 📊 Activity Logging

- **Enterprise-Grade Activity Logging System**
- Comprehensive audit trail with metadata capture
- Sensitive data masking (PII protection)
- Request tracing with UUID correlation
- Performance monitoring integration

### ⚡ Performance & Caching

- **Redis Caching System** with database fallback
- Pattern-based cache invalidation
- Response compression (Brotli + Gzip)
- Database connection pooling optimization

### 🐰 Job Queue System

- **RabbitMQ Job Queue System** with circuit breaker
- Dead letter queue handling
- Admin management interface
- Background job processing

### 📁 File Processing

- Excel operations with dynamic template generation
- **S3 upload helper with multi-provider support**
- Multer integration with file type validation

### 🚨 Monitoring & Alerts

- **BeepBot Critical Notification System**
- OpenTelemetry monitoring integration
- External alerting for system failures

## Architecture

### Entry Points

- `server.js` - Server startup
- `app.js` - Express configuration and middleware setup
- `instrument.js` - OpenTelemetry monitoring initialization

### Database Layer

- **MySQL with optimized connection pooling**
- Environment-aware pool sizing and monitoring
- Knex.js integration for migrations and seeding
- Main tables: `users` and `activity_logs`

### Module Aliases

The project uses `module-alias` for cleaner import paths:

```js
const { db } = require("@db/db");
const { log } = require("@helpers/log");
const { asyncHandler } = require("@middlewares/errorHandler");
```

Available aliases:

- `@` - Project root
- `@config` - Configuration files
- `@db` - Database files
- `@helpers` - Helper utilities
- `@middlewares` - Express middlewares
- `@routes` - Route handlers
- `@views` - Nunjucks templates
- `@public` - Static files

## Route Structure

- **Public**: `/` (client landing)
- **Admin Web**: `/admin/*` (dashboard, user management)
- **User Management**: `/admin/user/*` (CRUD, Excel import/export)
- **Activity Logs**: `/admin/log/*` (view logs, export)
- **Cache Management**: `/admin/cache/*` (cache operations)
- **Queue Management**: `/admin/queue/*` (job monitoring)
- **API Endpoints**: `/api/*` (JWT-based, JSON responses)

## Feature Toggle System

All advanced features are **optional** and environment-based:

```env
# Core features (always enabled)
DB_HOST=localhost
SESSION_KEY=your-secret-key

# Optional: Redis caching system
REDIS_ENABLED=true
REDIS_HOST=localhost

# Optional: RabbitMQ job queue
RABBITMQ_ENABLED=true
RABBITMQ_HOST=localhost

# Optional: Email notifications with 2FA OTP
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com

# Optional: S3 file storage
S3_ENABLED=true
S3_ENDPOINT_URL=your-s3-endpoint
```

## Default Users

After running database seeds:

- admin@omniflow.id / Admin12345.
- manager@omniflow.id / Manager12345.
- user@omniflow.id / User12345.

## License

MIT
