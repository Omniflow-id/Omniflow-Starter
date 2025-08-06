# Architecture

Omniflow-Starter follows a modular, layered architecture designed for scalability, maintainability, and enterprise-grade features.

## Project Structure

```
├── server.js              # Application entry point
├── app.js                 # Express configuration
├── instrument.js          # OpenTelemetry monitoring
├── config/                # Configuration management
├── db/                    # Database layer
├── routes/                # Route handlers
├── controllers/           # Business logic
├── middlewares/           # Express middlewares
├── helpers/               # Utility functions
├── views/                 # Nunjucks templates
├── public/                # Static files
└── workers/               # Background job processors
```

## Module Aliases

Clean import paths using `module-alias`:

```js
// Instead of relative paths
const { db } = require("../../../db/db");

// Use aliases
const { db } = require("@db/db");
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

## Application Layers

### Entry Layer
- **server.js** - Server startup and graceful shutdown
- **app.js** - Express app configuration and middleware setup
- **instrument.js** - OpenTelemetry initialization

### Configuration Layer
- **config/index.js** - Centralized configuration
- **config/development.js** - Development overrides
- **config/production.js** - Production overrides
- **config/validation.js** - Environment validation

### Database Layer
- **db/db.js** - MySQL connection pool management
- **db/redis.js** - Redis caching client
- **db/migrations/** - Database schema versions
- **db/seeders/** - Development data population

### Route Layer
- **routes/admin/** - Admin web interface routes
- **routes/api/** - REST API endpoints
- **routes/client/** - Public client routes

### Controller Layer
- **controllers/admin/** - Admin business logic
- **controllers/api/** - API business logic
- Follows single responsibility principle

### Middleware Layer
- **middlewares/errorHandler.js** - Centralized error handling
- **middlewares/auth.js** - Authentication & authorization
- **middlewares/rateLimiter.js** - Rate limiting protection
- **middlewares/botProtection.js** - Anti-bot security
- **middlewares/csrfProtection.js** - CSRF token validation

### Helper Layer
- **helpers/log.js** - Activity logging system
- **helpers/cache.js** - Redis caching utilities
- **helpers/queue.js** - RabbitMQ job queue
- **helpers/beepbot.js** - Critical alerting system

### View Layer
- **views/layouts/** - Nunjucks layout templates
- **views/pages/** - Page-specific templates
- **views/components/** - Reusable components

### Worker Layer
- **workers/emailWorker.js** - Email job processor
- **workers/testWorker.js** - Development job testing
- **workers/workerManager.js** - Worker lifecycle management

## Data Flow

### Web Request Flow
```
Request → Rate Limiter → Bot Protection → CSRF → Auth → Controller → Response
```

### API Request Flow  
```
Request → Rate Limiter → CORS → JWT Auth → Controller → JSON Response
```

### Background Job Flow
```
Job Created → RabbitMQ Queue → Worker Process → Database Update → Activity Log
```

### Cache Flow
```
Request → Cache Check → Redis/Database → Cache Update → Response
```

## Database Design

### Core Tables
- **users** - User accounts with role-based access
- **roles** - User role definitions
- **permissions** - System permission definitions  
- **role_permissions** - Role-to-permission mappings
- **user_permissions** - User-specific permission overrides
- **activity_logs** - Comprehensive audit trail
- **jobs** - Background job queue persistence

### Key Features
- **Connection Pooling** - Environment-aware pool sizing
- **Migration System** - Knex.js schema versioning
- **Seeder Management** - Controlled data population
- **Soft Deletes** - Data retention for audit compliance

## Security Architecture

### Multi-Layer Protection
1. **Rate Limiting** - Multi-tier request throttling
2. **Bot Protection** - Automated threat detection
3. **CSRF Protection** - Cross-site request forgery prevention
4. **Authentication** - Session + JWT dual system
5. **Authorization** - Flexible RBAC + PBAC permissions

### Data Protection
- **Sensitive Data Masking** - Automatic PII protection
- **Request Tracing** - UUID-based correlation
- **Activity Logging** - Complete audit trail
- **Error Handling** - Security-aware error responses

## Performance Architecture  

### Caching Strategy
- **Redis Layer** - High-performance in-memory caching
- **Database Fallback** - Graceful degradation
- **Pattern Invalidation** - Intelligent cache cleanup
- **TTL Management** - Configurable expiration

### Compression
- **Brotli + Gzip** - Dual-algorithm compression
- **Content-Type Aware** - Selective compression
- **Streaming Support** - Memory-efficient processing

### Connection Management
- **Database Pooling** - Optimized connection reuse
- **Redis Clustering** - High-availability support
- **RabbitMQ Persistence** - Reliable message delivery

## Monitoring Architecture

### Application Monitoring
- **OpenTelemetry** - Distributed tracing
- **Activity Logging** - Business event tracking
- **Performance Metrics** - Response time monitoring
- **Error Tracking** - Comprehensive error capture

### External Alerting
- **BeepBot Integration** - Critical failure notifications
- **Jakarta Timezone** - Localized timestamps
- **Independent Operation** - Works when database is down

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design** - No server-side state dependencies
- **Session Store** - Externalized session management
- **Job Queue** - Distributed background processing
- **File Storage** - S3-compatible cloud storage

### Vertical Scaling
- **Connection Pooling** - Efficient resource utilization
- **Caching Layers** - Reduced database load
- **Compression** - Bandwidth optimization
- **Lazy Loading** - On-demand resource loading

## Development Workflow

### Code Organization
- **Import Standards** - Consistent module organization
- **Error Handling** - Centralized error management
- **Template Patterns** - Reusable component structure
- **Testing Strategy** - Manual + automated testing

### Quality Assurance
- **Biome Linting** - Code quality enforcement
- **Environment Validation** - Configuration verification
- **Security Scanning** - Automated vulnerability detection
- **Performance Monitoring** - Real-time metrics tracking