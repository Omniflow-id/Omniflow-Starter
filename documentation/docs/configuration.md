# Configuration

Omniflow-Starter uses a feature-based configuration system where optional features only require their environment variables when explicitly enabled.

## Core Configuration

These variables are always required:

```env
# Database Connection (Required)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=omniflow_starter

# Session Security (Required)
SESSION_KEY=your-very-long-random-secret-key-at-least-32-characters
```

## Basic Configuration

These have sensible defaults:

```env
# Application
NODE_ENV=development          # Environment: development/production
PORT=1234                    # Server port
APP_URL=http://localhost     # Base URL for emails/links

# Security
CSRF_SECRET=optional         # Falls back to SESSION_KEY
SESSION_TIMEOUT_HOURS=24     # Session timeout in hours

# Timezone
TIMEZONE=Asia/Jakarta        # Application timezone
```

## Optional Features

### Redis Caching System

Enable high-performance caching:

```env
REDIS_ENABLED=true           # Enable Redis caching
REDIS_HOST=127.0.0.1        # Redis server host
REDIS_PORT=6379             # Redis server port
REDIS_PASSWORD=             # Redis password (optional)
REDIS_DB=0                  # Redis database number
```

### RabbitMQ Job Queue System

Enable background job processing:

```env
RABBITMQ_ENABLED=true                    # Enable RabbitMQ
RABBITMQ_HOST=127.0.0.1                 # RabbitMQ server host
RABBITMQ_PORT=5672                      # RabbitMQ server port
RABBITMQ_USER=guest                     # RabbitMQ username
RABBITMQ_PASSWORD=guest                 # RabbitMQ password

# Advanced RabbitMQ Configuration
RABBITMQ_MAX_RECONNECT_ATTEMPTS=10      # Max reconnection attempts
RABBITMQ_RECONNECT_DELAY=5000           # Reconnection delay (ms)
RABBITMQ_QUEUE_DURABLE=true             # Queue durability
RABBITMQ_MESSAGE_PERSISTENT=true        # Message persistence
```

### Email Notifications with 2FA

Enable email system with two-factor authentication:

```env
EMAIL_ENABLED=true                      # Enable email system
SMTP_HOST=smtp.gmail.com               # SMTP server host
SMTP_PORT=587                          # SMTP server port
SMTP_USER=your-email@gmail.com         # SMTP username
SMTP_PASSWORD=your-app-password        # SMTP password (use app password for Gmail)

# Optional Email Settings
SMTP_FROM_NAME=Omniflow System         # Default sender name
SMTP_FROM_EMAIL=your-email@gmail.com   # Default sender email
DEV_2FA_BYPASS=true                    # Bypass 2FA in development
```

### S3 File Storage

Enable cloud file storage (supports AWS S3, Cloudflare R2, DigitalOcean Spaces):

```env
S3_ENABLED=true                         # Enable S3 storage
S3_ENDPOINT_URL=https://s3.amazonaws.com # S3 endpoint URL
S3_ACCESS_KEY=your-access-key          # S3 access key
S3_SECRET_KEY=your-secret-key          # S3 secret key
S3_BUCKET_NAME=your-bucket-name        # S3 bucket name

# Optional S3 Settings
S3_FOLDER_NAME=uploads                  # Folder prefix in bucket
S3_REGION=us-east-1                    # AWS region (if applicable)
```

### JWT API Authentication

Enable JWT-based API authentication:

```env
JWT_ENABLED=true                        # Enable JWT authentication
JWT_SECRET=your-jwt-secret-key         # JWT signing secret

# Optional JWT Settings
JWT_EXPIRES_IN=1h                      # Access token expiration
JWT_REFRESH_EXPIRES_IN=7d              # Refresh token expiration
JWT_ALGORITHM=HS256                    # JWT signing algorithm
```

### OpenTelemetry Monitoring

Enable application monitoring and tracing:

```env
MONITORING_ENABLED=true                                    # Enable monitoring
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=your-otel-endpoint    # OTLP traces endpoint

# Optional Monitoring Settings
OTEL_SERVICE_NAME=omniflow-starter                        # Service name
OTEL_SERVICE_VERSION=1.0.0                               # Service version
OTEL_METRICS_PORT=9091                                   # Prometheus metrics port
OTEL_METRICS_ENDPOINT=/metrics                           # Metrics endpoint path
```

### BeepBot Critical Notifications

Enable external alerting for system failures:

```env
BEEPBOT_ENABLED=true                    # Enable BeepBot notifications
BEEPBOT_SECRET=your-beepbot-secret     # BeepBot API secret
BEEPBOT_CHAT_ID=1185624008             # Telegram chat ID (optional)
```

### CORS Configuration

Enable CORS for API endpoints:

```env
CORS_ENABLED=true                       # Enable CORS
CORS_ORIGIN=*                          # Allowed origins (comma-separated)
CORS_CREDENTIALS=true                  # Allow credentials
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE  # Allowed methods
CORS_MAX_AGE=86400                     # Preflight cache duration
```

## Built-in Features

### Response Compression

These are always available and enabled by default:

```env
COMPRESSION_ENABLED=true               # Enable/disable compression
COMPRESSION_THRESHOLD=1024             # Minimum size to compress (bytes)
COMPRESSION_LEVEL=6                    # Gzip compression level (1-9)
BROTLI_ENABLED=true                   # Enable Brotli compression
BROTLI_QUALITY=4                      # Brotli quality level (0-11)
```

### Database Connection Pool

```env
DB_CONNECTION_LIMIT=10                 # Max connections (10 dev, 50 prod)
DB_ACQUIRE_TIMEOUT=60000              # Connection acquire timeout (ms)
DB_QUERY_TIMEOUT=60000                # Query timeout (ms)
```

### Password Policy

```env
PASSWORD_MIN_LENGTH=8                  # Minimum password length
PASSWORD_MAX_LENGTH=128                # Maximum password length
PASSWORD_REQUIRE_UPPERCASE=true        # Require uppercase letters
PASSWORD_REQUIRE_LOWERCASE=true        # Require lowercase letters
PASSWORD_REQUIRE_NUMBERS=true          # Require numbers
PASSWORD_REQUIRE_SYMBOLS=true          # Require special characters
PASSWORD_MAX_REPEATING=3               # Max consecutive identical chars
```

## Environment-Specific Overrides

### Development
- Debug logging enabled
- HTTPS not required for cookies
- Seeding allowed

### Production
- Secure cookies enabled
- HTTPS required
- Seeding disabled for safety

## Configuration Validation

The application validates all environment variables at startup:

- **Core variables** are always checked
- **Feature variables** are only validated when enabled
- **Helpful error messages** guide you to fix configuration issues

Example validation output:

```
🔧 [CONFIG] Enabled optional features:
   • Redis caching (REDIS_ENABLED=true)
   • Email notifications (EMAIL_ENABLED=true)

✅ [CONFIG] Validation passed (2 optional features enabled)
```