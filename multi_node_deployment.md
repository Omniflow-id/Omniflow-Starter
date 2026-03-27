# Multi-Node Deployment Guide

> **📍 Repository Reference**: This documentation is for the **Omniflow-Starter** project.  
> **🔍 Implementation Details**: All fixes documented here were implemented in git commit `9af582e` (feat: enhance multi-node deployment security and scalability).  
> **📂 Typical Location**: Most users have this repo at `/Documents/GitHub/Omniflow-Starter/` (adjust path as needed for your setup).  
> **🤖 For AI Assistants**: You can reference this specific commit to see the exact implementation of all security fixes mentioned below.

## Implementation Commit Reference

**Commit Hash**: `9af582e`  
**Commit Message**: `feat: enhance multi-node deployment security and scalability`

**Files Modified**:
- `config/index.js` - CSRF fallback fix
- `helpers/getClientIP.js` - X-Forwarded-For IP detection fix  
- `middlewares/rateLimiter.js` - Redis graceful fallback
- `routes/admin/auth/login.js` - Session regeneration on login
- `routes/admin/auth/verifyOTP.js` - Session regeneration on OTP success
- `server.js` - Worker separation feature flag
- `multi_node_deployment.md` - This documentation

**Git Command to View Changes**:
```bash
git show 9af582e
git diff 9af582e^ 9af582e  # Show exact diff
```

## Ringkasan Arsitektur

**Omniflow-Starter** telah dirancang untuk mendukung deployment multi-node dengan beberapa komponen yang shared by design:

- **Runtime**: SSR Node.js Express + Nunjucks dengan static file serving dan route web/API dari satu binary HTTP server
- **Session Storage**: Disimpan di MySQL via `express-mysql-session`, bukan di memory process - sehingga state login otomatis shared antar node
- **Redis Cache**: Cache dan rate limiting shared antar node via Redis
- **RabbitMQ Queue**: Job queue async shared, namun **worker dan web process menyatu** (perlu separation untuk scaling optimal)
- **SSE/Streaming**: Ada endpoint streaming untuk AI/chat yang butuh konfigurasi nginx khusus

## ✅ Fixes yang Sudah Diterapkan

### 1. Session Fixation Vulnerability (HIGH PRIORITY)

**Problem**: Login sukses tidak melakukan `session.regenerate()`, membuka celah session fixation attack.

**Fix Applied**: 

Ditambahkan `req.session.regenerate()` di kedua flow login:

**File: `routes/admin/auth/login.js`**
```javascript
// Development bypass flow
if (isDevelopmentBypass()) {
  const userPermissions = await loadUserPermissions(user);

  // Regenerate session ID to prevent session fixation
  req.session.regenerate((err) => {
    if (err) {
      console.error("❌ [SESSION] Failed to regenerate session:", err.message);
      throw new AuthenticationError("Session regeneration failed");
    }

    // Set session with permissions after regeneration
    req.session.user = { /* user data */ };
    req.session.permissions = userPermissions;

    // Log successful login and redirect
    logSuccessfulLogin(user, req).then(() => {
      req.flash("success", t("messages.loginSuccessDev"));
      res.redirect("/admin");
    }).catch((logError) => {
      console.error("❌ [LOGIN] Failed to log successful login:", logError.message);
      req.flash("success", t("messages.loginSuccessDev"));
      res.redirect("/admin");
    });
  });
}
```

**File: `routes/admin/auth/verifyOTP.js`**
```javascript
// Normal 2FA completion flow
const userPermissions = await loadUserPermissions(user);

// Regenerate session ID to prevent session fixation
req.session.regenerate((err) => {
  if (err) {
    console.error("❌ [SESSION] Failed to regenerate session:", err.message);
    throw new AuthenticationError("Session regeneration failed");
  }

  // Set session with permissions after regeneration
  req.session.user = { /* user data */ };
  req.session.permissions = userPermissions;

  // Log successful 2FA completion and redirect
  logSuccessfulLogin(user, req, "2fa_complete").then(() => {
    req.flash("success", "messages.otpVerifiedWelcome");
    res.redirect("/admin");
  }).catch((logError) => {
    console.error("❌ [2FA] Failed to log successful login:", logError.message);
    req.flash("success", "messages.otpVerifiedWelcome");
    res.redirect("/admin");
  });
});
```

### 2. CSRF_SECRET Fallback Inconsistency (HIGH PRIORITY)

**Problem**: `config/validation.js` mengandalkan fallback ke `SESSION_KEY` tapi `config/index.js` tidak implement fallback.

**Fix Applied**: 

**File: `config/index.js`**
```javascript
csrf: {
  secret: process.env.CSRF_SECRET || process.env.SESSION_KEY, // Added fallback
  cookieName: "csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
  },
},
```

### 3. Client IP Detection Fix (HIGH PRIORITY)

**Problem**: `getClientIP` helper salah mengambil elemen terakhir dari `X-Forwarded-For` (proxy IP) bukan client IP yang sebenarnya (leftmost).

**Fix Applied**: 

**File: `helpers/getClientIP.js`**
```javascript
const getClientIP = (req) => {
  // Get IP from various headers and sources
  // X-Forwarded-For format: client_ip, proxy1_ip, proxy2_ip
  // We want the leftmost (first) IP which is the original client
  const rawIP =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || // Changed from .pop() to [0]
    req.headers["x-real-ip"] ||
    req.headers["x-client-ip"] ||
    req.ip ||
    req.connection.remoteAddress ||
    "0.0.0.0";

  // ... rest of IPv6 handling logic
};
```

### 4. Worker Separation Feature Flag (HIGH PRIORITY)

**Problem**: Web node dan worker RabbitMQ menyatu, sehingga scaling web ikut scaling consumer queue.

**Fix Applied**: 

**File: `config/index.js`**
```javascript
rabbitmq: {
  enabled: process.env.RABBITMQ_ENABLED === "true",
  // ... existing config
  
  // Worker management
  runWorkers: process.env.RUN_WORKERS !== "false", // Default: true (workers run by default)
},
```

**File: `server.js`**
```javascript
// Start workers after server is ready (if enabled)
if (config.rabbitmq.enabled && config.rabbitmq.runWorkers) {
  try {
    const workerManager = require("./workers");
    await workerManager.start();
    console.log("✅ [WORKERS] All workers started successfully");
  } catch (error) {
    console.error("❌ [WORKERS] Failed to start:", error.message);
  }
} else if (config.rabbitmq.enabled && !config.rabbitmq.runWorkers) {
  console.log("🔧 [WORKERS] Workers disabled via RUN_WORKERS=false");
}
```

### 5. Redis-Down Graceful Handling (MEDIUM PRIORITY)

**Problem**: Rate limiter mengalami TypeError saat Redis client null, tidak graceful fallback ke memory store.

**Fix Applied**: 

**File: `middlewares/rateLimiter.js`**
```javascript
const createStore = (prefix) => {
  if (!config.redis?.enabled) return undefined;

  return new RedisStore({
    sendCommand: async (...args) => {
      const client = getRedis();
      if (!client) {
        console.error(
          "❌ [RATE-LIMIT] Redis client is null but redis is enabled! Falling back to memory store."
        );
        // Throw error to trigger express-rate-limit fallback to memory store
        throw new Error("Redis client not available");
      }
      try {
        const result = await client.call(...args);
        return result;
      } catch (err) {
        console.error("❌ [RATE-LIMIT] Redis call error:", err.message);
        // Re-throw to trigger fallback to memory store
        throw err;
      }
    },
    prefix: prefix ? `${prefix}:` : "starter:",
  });
};
```

## 🚀 Deployment Configuration

### Environment Variables for Multi-Node

**Web Nodes (Frontend/API)**:
```bash
# Core settings
NODE_ENV=production
RUN_WORKERS=false  # ⚠️ DISABLE workers on web nodes
TRUST_PROXY=1

# Database (shared)
DB_HOST=your-shared-mysql
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=omniflow_starter

# Redis (shared)
REDIS_ENABLED=true
REDIS_HOST=your-shared-redis
REDIS_PORT=6379

# RabbitMQ (shared, but workers disabled)
RABBITMQ_ENABLED=true
RABBITMQ_HOST=your-shared-rabbitmq
RABBITMQ_USER=your-user
RABBITMQ_PASSWORD=your-password

# Session & Security
SESSION_KEY=your-secure-session-key-min-32-chars
CSRF_SECRET=your-csrf-secret  # Or will fallback to SESSION_KEY
APP_URL=https://yourdomain.com
```

**Worker Nodes (Background Jobs)**:
```bash
# Core settings
NODE_ENV=production
RUN_WORKERS=true   # ✅ ENABLE workers on dedicated nodes
TRUST_PROXY=1

# Database (shared - same as web)
DB_HOST=your-shared-mysql
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=omniflow_starter

# Redis (shared - same as web)
REDIS_ENABLED=true
REDIS_HOST=your-shared-redis
REDIS_PORT=6379

# RabbitMQ (shared - same as web)
RABBITMQ_ENABLED=true
RABBITMQ_HOST=your-shared-rabbitmq
RABBITMQ_USER=your-user
RABBITMQ_PASSWORD=your-password

# Email for workers
EMAIL_ENABLED=true
SMTP_HOST=your-smtp
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

### Nginx Load Balancer Configuration

**File: `nginx.conf` atau `/etc/nginx/sites-available/omniflow`**

```nginx
upstream omniflow_web {
    # Web nodes (RUN_WORKERS=false)
    server web-node-1:1234 max_fails=3 fail_timeout=30s;
    server web-node-2:1234 max_fails=3 fail_timeout=30s;
    server web-node-3:1234 max_fails=3 fail_timeout=30s;
    
    # Health check configuration
    keepalive 32;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Main proxy configuration
    location / {
        proxy_pass http://omniflow_web;
        
        # Essential headers for multi-node
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Special configuration for SSE/Streaming endpoints
    location /api/ai/chat/stream {
        proxy_pass http://omniflow_web;
        
        # Essential headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE-specific settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # ⚠️ CRITICAL: Disable buffering for streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;  # Long timeout for persistent connections
        proxy_send_timeout 24h;
        
        # Prevent nginx from buffering SSE responses
        add_header X-Accel-Buffering no;
    }

    # Health check endpoint (for load balancer)
    location /api/health/readyz {
        proxy_pass http://omniflow_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Quick health check timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }

    # Static files (optional - could be served by CDN)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        proxy_pass http://omniflow_web;
        proxy_set_header Host $host;
        
        # Cache static files
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
    }
}

# Health check configuration
upstream_conf {
    server {
        listen 8080;
        location /health {
            # Basic nginx status
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        location /upstream_status {
            # Upstream status (requires nginx-plus or custom module)
            access_log off;
            # upstream_status;
        }
    }
}
```

### Docker Compose untuk Multi-Node

**File: `docker-compose.production.yml`**

```yaml
version: '3.8'

services:
  # Shared Infrastructure
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: omniflow_starter
      MYSQL_USER: omniflow
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - omniflow_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - omniflow_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 10s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - omniflow_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      timeout: 30s
      retries: 5

  # Web Nodes (RUN_WORKERS=false)
  web-node-1:
    build: .
    environment:
      - NODE_ENV=production
      - RUN_WORKERS=false
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - RABBITMQ_HOST=rabbitmq
      - SESSION_KEY=${SESSION_KEY}
      - CSRF_SECRET=${CSRF_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - omniflow_network
    restart: unless-stopped

  web-node-2:
    build: .
    environment:
      - NODE_ENV=production
      - RUN_WORKERS=false
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - RABBITMQ_HOST=rabbitmq
      - SESSION_KEY=${SESSION_KEY}
      - CSRF_SECRET=${CSRF_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - omniflow_network
    restart: unless-stopped

  # Worker Nodes (RUN_WORKERS=true)
  worker-1:
    build: .
    environment:
      - NODE_ENV=production
      - RUN_WORKERS=true
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - RABBITMQ_HOST=rabbitmq
      - EMAIL_ENABLED=true
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - omniflow_network
    restart: unless-stopped

  worker-2:
    build: .
    environment:
      - NODE_ENV=production
      - RUN_WORKERS=true
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - RABBITMQ_HOST=rabbitmq
      - EMAIL_ENABLED=true
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - omniflow_network
    restart: unless-stopped

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - web-node-1
      - web-node-2
    networks:
      - omniflow_network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  rabbitmq_data:

networks:
  omniflow_network:
    driver: bridge
```

## ⚠️ Deployment Checklist

### Pre-Deployment Security

1. **Session & CSRF Setup**:
   ```bash
   # Generate secure keys (32+ characters)
   openssl rand -hex 32  # For SESSION_KEY
   openssl rand -hex 32  # For CSRF_SECRET (optional, fallback to SESSION_KEY)
   ```

2. **Database Migration**:
   ```bash
   # Run on one node only (web-node-1)
   npm run migrate:latest
   npm run seed:run  # Only on fresh database
   ```

3. **Environment Variables Validation**:
   ```bash
   # Test configuration on each node
   node -e "
   require('dotenv').config();
   const config = require('./config');
   console.log('Config valid:', {
     workers: config.rabbitmq.runWorkers,
     redis: config.redis.enabled,
     session: !!config.session.secret
   });
   "
   ```

### Testing Multi-Node Setup

1. **Session Sharing Test**:
   ```bash
   # Login on web-node-1, check session on web-node-2
   curl -c cookies.txt -X POST http://web-node-1:1234/admin/login \
     -d "email=admin@omniflow.id&password=Admin12345."
   
   curl -b cookies.txt http://web-node-2:1234/admin/dashboard
   # Should return dashboard (not redirect to login)
   ```

2. **Worker Separation Test**:
   ```bash
   # Send test job via web node
   curl -X POST http://web-node-1:1234/admin/queue/test \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   
   # Check worker logs (should only appear on worker nodes)
   docker logs worker-1 | grep "test_queue"
   docker logs web-node-1 | grep "test_queue"  # Should be empty
   ```

3. **Redis Fallback Test**:
   ```bash
   # Stop Redis temporarily
   docker stop redis
   
   # Test rate limiting (should fallback to memory)
   for i in {1..10}; do
     curl http://nginx/admin/login
     sleep 1
   done
   
   # Restart Redis
   docker start redis
   ```

4. **Load Balancer Health Check**:
   ```bash
   # Test health endpoint
   curl http://nginx/api/health/readyz
   # Should return: {"status":"ok","timestamp":"...","services":{"database":"ok","redis":"ok"}}
   ```

### Performance Monitoring

**Application Metrics**: 
```bash
# Check active connections per node
ss -tuln | grep :1234

# Check memory usage
docker stats web-node-1 web-node-2 worker-1 worker-2

# Check Redis memory
docker exec redis redis-cli INFO memory

# Check MySQL connections
docker exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

**Nginx Monitoring**:
```bash
# Check upstream status
curl http://localhost:8080/health

# Monitor logs
tail -f /var/log/nginx/access.log | grep -E "(502|503|504)"
```

## 🔧 Troubleshooting

### Common Issues

1. **Session Not Sharing**:
   - ✅ Check MySQL session table exists
   - ✅ Verify same SESSION_KEY across all nodes  
   - ✅ Check trust proxy settings
   - ✅ Verify nginx forwards proper headers

2. **Workers Not Processing Jobs**:
   - ✅ Check RUN_WORKERS=true on worker nodes only
   - ✅ Check RabbitMQ connectivity on workers
   - ✅ Verify EMAIL_ENABLED=true if using email jobs

3. **Rate Limiting Issues**:
   - ✅ Check Redis connectivity
   - ✅ Verify rate limiter falls back gracefully
   - ✅ Check client IP detection with X-Forwarded-For

4. **SSE/Streaming Broken**:
   - ✅ Check nginx proxy_buffering off for streaming routes
   - ✅ Verify long timeouts configured
   - ✅ Check X-Accel-Buffering header

### Log Analysis

**Deployment Success Indicators**:
```bash
# Web nodes should show:
grep "🔧 \[WORKERS\] Workers disabled" logs/
grep "✅ \[REDIS\] Connected successfully" logs/
grep "💾 \[DATABASE\] Connected to MySQL" logs/

# Worker nodes should show:
grep "✅ \[WORKERS\] All workers started successfully" logs/
grep "👂 \[RABBITMQ\] Consuming from queue" logs/
```

**Error Patterns to Watch**:
```bash
# Session issues
grep "Session regeneration failed" logs/

# Redis fallback
grep "Falling back to memory store" logs/

# Worker coupling issues  
grep "test_queue" web-node-logs/  # Should be empty

# IP detection issues
grep "0.0.0.0" logs/ | grep "activity"  # Should be minimal
```

## 🚀 Scaling Strategies

### Horizontal Scaling

**Web Nodes**: Scale based on HTTP traffic
```bash
# Add new web node
docker-compose up -d --scale web-node=4
```

**Worker Nodes**: Scale based on queue depth
```bash
# Add new worker node  
docker-compose up -d --scale worker=3
```

**Infrastructure**: Scale shared services independently
- **MySQL**: Master-slave replication, connection pooling
- **Redis**: Cluster mode, Redis Sentinel for HA
- **RabbitMQ**: Clustering, queue mirroring

### Monitoring & Alerting

**Key Metrics to Track**:
- Session sharing rate (should be ~100%)
- Queue processing lag
- Redis hit ratio
- Database connection pool usage  
- Response times per node

**Alert Conditions**:
- Any web node processing workers (misconfiguration)
- Session fallback to database (Redis issue)
- Queue depth > threshold (worker scaling needed)
- High error rate on specific node (node issue)

---

**Note**: File ini mencatat semua perubahan yang sudah diterapkan untuk membuat Omniflow-Starter siap production dengan deployment multi-node yang aman dan scalable.