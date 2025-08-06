# Omniflow-Starter Documentation

Welcome to **Omniflow-Starter**, a comprehensive Node.js ERP module starter pack built with Express.js, MySQL, and Nunjucks templating. This documentation will guide you through setting up, configuring, and extending the application.

## What is Omniflow-Starter?

Omniflow-Starter is a production-ready enterprise application foundation that provides:

- **User Management & Authentication** - Role-based access control with 2FA
- **Activity Logging** - Comprehensive audit trail system
- **Job Queue System** - RabbitMQ-based background processing
- **Caching Layer** - Redis integration for performance optimization
- **File Processing** - S3-compatible storage with Excel operations
- **Security Features** - CSRF protection, rate limiting, bot protection

## Quick Navigation

- **[Getting Started](getting-started.md)** - Installation and setup guide
- **[Configuration](configuration.md)** - Environment variables and feature configuration
- **[Architecture](architecture.md)** - System architecture and design patterns
- **[Features](features.md)** - Detailed feature documentation

## Key Features at a Glance

### 🔐 Authentication & Authorization
- Session-based authentication with JWT API support
- Role-Based Access Control (RBAC) with granular permissions
- Two-Factor Authentication (2FA) with email OTP
- User account management with active/inactive status

### 📊 Enterprise Monitoring
- Comprehensive activity logging system
- Redis-based caching with performance metrics
- RabbitMQ job queue monitoring
- OpenTelemetry integration for observability

### 🚀 Performance & Scalability
- Connection pool optimization for MySQL
- Automatic response compression (Brotli + Gzip)
- Rate limiting with multiple tiers
- Circuit breaker pattern for external services

### 🛡️ Security & Protection
- CSRF protection with Laravel-style token handling
- Multi-layer bot protection
- Advanced rate limiting
- Sensitive data masking in logs

### 📁 File Management
- S3-compatible file storage (AWS S3, Cloudflare R2, DigitalOcean Spaces)
- Excel file processing and template generation
- Bulk user import/export capabilities

## Technology Stack

- **Backend**: Node.js with Express.js framework
- **Database**: MySQL with Knex.js query builder
- **Templating**: Nunjucks with Bootstrap + Alpine.js
- **Caching**: Redis with intelligent fallback
- **Queue**: RabbitMQ for background job processing
- **Storage**: S3-compatible cloud storage
- **Monitoring**: OpenTelemetry with custom metrics

## Getting Help

If you need assistance with Omniflow-Starter:

1. Check the relevant documentation section
2. Review the `CLAUDE.md` file for development guidance
3. Look at the example files in the project
4. Check the configuration validation messages for setup issues

Start with the [Getting Started](getting-started.md) guide to begin your journey with Omniflow-Starter!
