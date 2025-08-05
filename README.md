# Omniflow-Starter
Node.js ERP Module Starter Pack with Express.js, MySQL, and Nunjucks

## Overview
Production-ready ERP starter with comprehensive user management, flexible permission system, enterprise-grade activity logging, and modular architecture for rapid development.

## Quick Start
```bash
npm install
cp .env.example .env
# Configure database and session key
npm run dev
```

## Development Roadmap

### ✅ Current Features (v1.1)
- [x] User authentication & session management with sliding timeout
- [x] **Flexible Permission Override System (PBAC + RBAC)**
  - [x] Role-based permissions with user-specific grants/revokes
  - [x] Advanced permission management UI
  - [x] Real-time permission updates with AJAX
- [x] **Enterprise-Grade Activity Logging System**
  - [x] Comprehensive audit trail with metadata capture
  - [x] Sensitive data masking (PII protection)
  - [x] Request tracing with UUID correlation
  - [x] Performance monitoring integration
- [x] **Redis Caching System**
  - [x] High-performance caching with database fallback
  - [x] Pattern-based cache invalidation
  - [x] Multiple caching strategies (user, admin, API)
- [x] **RabbitMQ Job Queue System**
  - [x] Enterprise-grade message queue with circuit breaker
  - [x] Dead letter queue handling
  - [x] Admin management interface
- [x] **Security & Protection**
  - [x] Multi-tier rate limiting (general, auth, admin, uploads)
  - [x] Advanced bot protection with threat detection
  - [x] CSRF protection with Laravel-style implementation
  - [x] Password complexity policies with bulk generation
  - [x] **2FA Email OTP Authentication System**
    - [x] Enterprise-grade two-factor authentication
    - [x] Non-blocking email delivery via RabbitMQ
- [x] **File Processing & Storage**
  - [x] Excel operations with dynamic template generation
  - [x] **S3 upload helper with multi-provider support**
  - [x] Multer integration with file type validation
- [x] **Performance Optimization**
  - [x] Response compression (Brotli + Gzip)
  - [x] Database connection pooling optimization
  - [x] Cache-aside pattern implementation
- [x] **Error Handling & Validation**
  - [x] Centralized error handler with custom error classes
  - [x] Environment variable validation system
  - [x] Graceful degradation for optional features
- [x] **BeepBot Critical Notification System**
  - [x] External alerting for system failures
  - [x] Jakarta timezone localization
  - [x] Independent operation when database is down
- [x] Database migrations with Knex.js
- [x] OpenTelemetry monitoring integration

### 🔥 Phase 1: Core Infrastructure (High Priority)
- [x] **Database Optimization**
  - [x] Connection pooling configuration
  - [x] Database indexing strategy
  - [x] Migration rollback system
  - [ ] Slow query monitoring
- [x] **Security Enhancement**
  - [x] Granular RBAC permissions system
  - [x] Password complexity policies
  - [x] Bulk user password generation
  - [x] Session timeout optimization
  - [ ] Database field encryption

### 🚀 Phase 2: Advanced Features (Medium Priority)
- [x] **Background Processing**
  - [x] Redis caching layer (optional)
  - [x] RabbitMQ queue system (optional)
  - [x] **Email notification system with 2FA OTP**
    - [x] Non-blocking queue-based email delivery
    - [x] Professional HTML email templates
    - [x] Development bypass functionality
    - [x] Automatic fallback to synchronous mode
  - [x] Background job processing
- [x] **Data Management**
  - [ ] Automated backup/restore system
  - [x] Comprehensive audit trail
  - [ ] Data archiving system
  - [x] File storage optimization

### ⚡ Phase 3: Enterprise Features (Low Priority)
- [ ] **Developer Experience**
  - [ ] Production-safe seeder management
  - [ ] Database VIEWs for complex queries
  - [ ] MATERIALIZED VIEWs for aggregations
  - [ ] API documentation generator
- [ ] **Monitoring & Analytics**
  - [ ] Health check endpoints
  - [ ] Performance metrics dashboard
  - [ ] Custom alerting system

## Feature Toggle System

All advanced features are **optional** and environment-based:

```env
# Core features (always enabled)
DB_HOST=localhost
SESSION_KEY=your-secret-key

# Optional: Redis caching system
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: RabbitMQ job queue
RABBITMQ_ENABLED=true
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672

# Optional: S3 file storage (multi-provider support)
S3_ENABLED=true
S3_ENDPOINT_URL=your-s3-endpoint
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket

# Optional: Email notifications with 2FA OTP support
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
DEV_2FA_BYPASS=true  # Development bypass for 2FA

# Optional: BeepBot critical notifications
BEEPBOT_ENABLED=true
BEEPBOT_SECRET=your-beepbot-secret

# Optional: JWT API authentication
JWT_ENABLED=true
JWT_SECRET=your-jwt-secret

# Optional: OpenTelemetry monitoring
MONITORING_ENABLED=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=your-otel-endpoint
```

## Implementation Strategy

- **Graceful degradation**: Advanced features have fallbacks
- **Modular architecture**: Enable only what you need
- **Zero breaking changes**: Backward compatibility maintained
- **Progressive enhancement**: Add features as requirements grow

## Contributing

1. Pick a feature from the roadmap
2. Create feature branch: `git checkout -b feature/rbac-permissions`
3. Implement with tests and documentation
4. Submit PR with roadmap checkbox updates

## License
MIT
