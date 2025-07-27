# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Omniflow-Starter** is a Node.js ERP module starter pack built with Express.js, MySQL, and Nunjucks templating. It provides user management, role-based access control, activity logging, and Excel file processing capabilities for HRIS applications.

## Development Commands

- **Start server**: `npm start` or `npm run dev` (runs on port 1234 or PORT env var)
- **No build process** - static files served directly from public/

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

- OpenTelemetry (OTEL) integration for application monitoring and tracing
- Custom error middleware in `middlewares/errorHandler.js`
- Flash messages for user feedback using connect-flash

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

- **Custom Filters**:
  - `formatRupiah(amount)` - Formats numbers as Indonesian Rupiah currency
  - `formatDateTime(date, format)` - Formats datetime with configurable timezone (default: "DD MMMM YYYY HH:mm:ss")
  - `formatDate(date, format)` - Formats date only with configurable timezone (default: "DD MMMM YYYY")
  - `formatTime(date, format)` - Formats time only with configurable timezone (default: "HH:mm:ss")
  - `date` - Standard date filter with YYYY default format

## Configuration System

**Centralized Configuration**: All configuration managed through `config/` directory with environment-specific overrides.

### Configuration Files

- `config/index.js` - Base configuration with all environment variables
- `config/development.js` - Development environment overrides (debug enabled, seeds allowed)
- `config/production.js` - Production environment overrides (secure cookies, no seeds)

### Required `.env` variables:

- `NODE_ENV` - Environment (development/production)
- `SESSION_KEY` - Session encryption key
- `APP_URL` - Application URL (default: "http://localhost")
- `PORT` - Server port (default: 1234)

**Database Configuration:**

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection

**OpenTelemetry Configuration:**

- `OTEL_SERVICE_NAME` - Service name (default: "omniflow-starter")
- `OTEL_SERVICE_VERSION` - Service version (default: "1.0.0")
- `OTEL_METRICS_PORT` - Prometheus metrics port (default: 9091)
- `OTEL_METRICS_ENDPOINT` - Metrics endpoint path (default: "/metrics")
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` - OTLP traces endpoint (default: "http://localhost:4318/v1/traces")

**S3 Configuration (for future file storage):**

- `S3_ENDPOINT_URL` - S3 endpoint URL
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `S3_FOLDER_NAME` - S3 folder/prefix for file organization

**Optional Configuration:**

- `TIMEZONE` - Application timezone (default: "Asia/Jakarta")
- `LOG_LEVEL` - Logging level (default: "info")
- `LOG_FILE` - Log file path (default: "./logs/app.log")

## Testing

- No test framework currently configured
- Manual testing via web interface
- Database seeder provides test users for development

https://chatgpt.com/share/6883a5cc-f2c0-8005-95cf-e8a76653d1d2
