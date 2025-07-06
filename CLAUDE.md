# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Omniflow-Starter** is a Node.js ERP module starter pack built with Express.js, MySQL, and Nunjucks templating. It provides user management, role-based access control, activity logging, and Excel file processing capabilities for HRIS applications.

## Development Commands

- **Start server**: `node server.js` (runs on port 1234 or PORT env var)
- **Database setup**: `node db/migration.js` (creates tables)
- **Seed default users**: `node db/seeder.js` (creates admin/manager/user accounts)
- **No build process** - static files served directly from public/

## Architecture

### Entry Points
- `server.js` - Server startup
- `app.js` - Express configuration and middleware setup
- `instrument.js` - Sentry monitoring initialization

### Database Layer
- MySQL with connection pooling (`db/db.js`)
- Two main tables: `users` and `activity_logs`
- Migration script creates schema with proper indexes
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

### File Processing
- Excel import/export using ExcelJS
- Template downloads for bulk user import
- Multer for file uploads with automatic cleanup
- Templates stored in memory, processed files cleaned after use

## Key Patterns

### Error Handling
- OpenTelemetry (OTEL) integration for application monitoring and tracing
- Custom error middleware in `middlewares/errorHandler.js`
- Flash messages for user feedback using connect-flash

### Frontend Architecture
- Nunjucks templates with layout inheritance
- Bootstrap + Alpine.js + HTMX for modern interactions
- DataTables for advanced table functionality
- Component-based template structure in `views/components/`
- **Custom Nunjucks filters**: 
  - `formatRupiah` (formats numbers as Indonesian Rupiah currency)
  - `formatDateTime` (formats datetime with Jakarta timezone, default: "DD MMMM YYYY HH:mm:ss")
  - `formatDate` (formats date only with Jakarta timezone, default: "DD MMMM YYYY")
  - `formatTime` (formats time only with Jakarta timezone, default: "HH:mm:ss")

### Security
- Helmet for security headers and CSP
- bcrypt for password hashing
- Session security with httpOnly cookies
- Trust proxy configuration for production deployment

## Environment Configuration

Required `.env` variables:
- `SESSION_KEY` - Session encryption key
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `OTEL_SERVICE_NAME` - OpenTelemetry service name (default: "omniflow-hris")
- `OTEL_SERVICE_VERSION` - Service version (default: "1.0.0")
- `OTEL_METRICS_PORT` - Prometheus metrics port (default: 9091)
- `OTEL_METRICS_ENDPOINT` - Metrics endpoint path (default: "/metrics")
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` - OTLP traces endpoint (default: "http://localhost:4318/v1/traces")

## Testing

- No test framework currently configured
- Manual testing via web interface
- Database seeder provides test users for development