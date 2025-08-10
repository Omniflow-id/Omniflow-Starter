# 🐳 Docker + Nix Development Workflow

Comprehensive development and production deployment guide combining the best of Nix and Docker.

## 🎯 Unified Development Strategy

This project provides **one solution for both development and production**, combining:
- **Nix** for reproducible development environment
- **Docker** for containerized services and production deployment
- **Multi-stage builds** for optimized dev/prod containers

## 🚀 Quick Start Commands

### **🐳 Full Docker Development (Recommended)**

```bash
# First time setup
npm run docker:dev:build    # Build & start all services + auto DB setup
npm run docker:dev:logs     # Monitor application logs

# Daily development (fast)
npm run docker:dev          # Start without rebuilding
npm run docker:dev:down     # Stop all services
```

**✨ Auto Database Setup**: Docker automatically handles:
- 🔄 **Database migrations** - Creates all tables
- 🌱 **Database seeding** - Inserts default users and data
- ⏳ **Health checks** - Waits for MySQL to be ready

### **🔄 Hybrid Development (Alternative)**

```bash
# Services in Docker, app native
nix develop                 # Enter Nix development shell
npm run docker:dev          # Start MySQL, Redis, RabbitMQ only  
npm run dev                 # Run app with nodemon (native)
```

### **🏭 Production Deployment**

```bash
npm run docker:prod:build   # Production with PM2 clustering
npm run docker:prod:logs    # Monitor production logs
```

## 🏗️ Architecture Overview

### **Multi-Stage Dockerfile**

```
├── base         - Common dependencies (Node.js, system tools)
├── development  - Nodemon + dev dependencies + live reload
├── prod-deps    - Production deps + PM2 installation
└── production   - Optimized runtime with PM2 cluster mode
```

### **Docker Compose Files**

- `docker-compose.yml` - **Production** deployment with PM2
- `docker-compose.dev.yml` - **Development** with nodemon + live reload

### **Nix Development Shell**

```nix
buildInputs = [
  nodejs_22        # Node.js runtime
  nodemon          # Development auto-reload
  pm2              # Process manager
  docker           # Container runtime
  docker-compose   # Multi-container orchestration
  curl jq          # Development utilities
]
```

## 📋 Available NPM Scripts

### **Core Development**
```bash
npm run dev              # Nodemon (native development)
npm start               # Node.js (production mode)
```

### **PM2 Process Management**
```bash
npm run pm2:dev         # Start with PM2 (development config)
npm run pm2:prod        # Start with PM2 (production cluster)
npm run pm2:stop        # Stop PM2 processes
npm run pm2:restart     # Restart PM2 processes
npm run pm2:logs        # View PM2 logs
npm run pm2:monitor     # PM2 monitoring dashboard
npm run pm2:status      # PM2 process status
```

### **Docker Development**
```bash
npm run docker:dev      # Start dev environment
npm run docker:dev:build # Build and start dev environment
npm run docker:dev:down  # Stop dev environment
npm run docker:dev:logs  # View app logs (dev)
```

### **Database Management**
```bash
npm run db:migrate      # Run database migrations
npm run db:seed         # Run database seeders
npm run db:setup        # Run migrations + seeders
npm run db:reset        # Reset database (rollback + migrate + seed)
npm run db:status       # Check migration status
```

### **Docker Production**
```bash
npm run docker:prod      # Start production environment
npm run docker:prod:build # Build and start production
npm run docker:prod:down  # Stop production environment
npm run docker:prod:logs  # View app logs (production)
```

### **Utilities**
```bash
npm run docker:clean     # Clean Docker system and volumes
npm run setup:dev       # Complete development setup
npm run setup:prod      # Complete production setup
```

## 🛠️ Development Workflows

### **🐳 Full Docker Development (Recommended)**
Complete containerized environment with live reload:

```bash
# Setup once
npm run docker:dev:build    # Build & start all services

# Daily development
npm run docker:dev          # Start (fast, no rebuild)
npm run docker:dev:logs     # Monitor logs
npm run docker:dev:down     # Stop when done
```

**✅ Benefits:**
- 🌍 **True production parity** - same environment everywhere
- 🔄 **Team consistency** - no "works on my machine" 
- 📦 **Zero local setup** - no Node.js/MySQL/Redis installation needed
- 🎯 **Live code reload** - instant file change detection
- 🐳 **Container isolation** - clean, reproducible environment
- 🗄️ **Auto database setup** - migrations and seeding handled automatically

**🎯 Perfect for:**
- Team development (consistent environment)
- New developers (zero setup time)  
- Production-like testing
- CI/CD workflows

**🔐 Default Users (auto-created)**:
- **Admin**: admin@omniflow.id / Admin12345.
- **Manager**: manager@omniflow.id / Manager12345.
- **User**: user@omniflow.id / User12345.

### **🔄 Hybrid Development (Alternative)**
Services in Docker, app runs natively:

```bash
# Setup once
nix develop                 # Enter development shell
npm install                 # Install dependencies
npm run docker:dev          # Start only services (MySQL, Redis, RabbitMQ)

# Daily development  
npm run dev                 # Native nodemon with hot reload
```

**✅ Benefits:**
- ⚡ **Fastest hot reload** - native nodemon performance
- 🔧 **Full debugging** - native Node.js debugging tools
- 📦 **Isolated services** - containerized databases
- 🎯 **Flexible development** - mix of native and containerized

**🎯 Perfect for:**
- Performance-critical debugging
- Advanced Node.js development
- Custom development tools
- Nix environment users

## 🏭 Production Deployment Options

### **Option 1: Docker Production (Recommended)**
Complete containerized deployment with PM2 clustering:

```bash
# On production server
git clone <your-repo>
cd omniflow-starter

# Deploy
npm run setup:prod      # Install deps + start containers
npm run docker:prod:logs # Monitor deployment
```

**Features:**
- PM2 cluster mode (max CPU utilization)
- Health checks and auto-restart
- Persistent volumes for data
- Isolated network environment

### **Option 2: VPS/Bare Metal with PM2**
Traditional server deployment:

```bash
# On production server
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup services (MySQL, Redis, RabbitMQ)
# ... service installation ...

# Deploy application
git clone <your-repo>
cd omniflow-starter
npm ci --only=production
npm run pm2:prod        # Start with PM2 cluster
```

## 🔧 Configuration Management

### **Environment Variables**
- `.env.example` - Template with all options
- `docker-compose.yml` - Production environment variables
- `docker-compose.dev.yml` - Development overrides

### **Key Differences: Dev vs Prod**

| Feature | Development | Production |
|---------|-------------|------------|
| **Process Manager** | Nodemon | PM2 Cluster |
| **Instances** | 1 (fork mode) | Max CPU cores |
| **File Watching** | ✅ Enabled | ❌ Disabled |
| **Memory Limit** | No limit | 1GB per instance |
| **Health Checks** | Less strict | Robust |
| **Database Pool** | 10 connections | 50 connections |
| **Logging** | Debug level | Info level |
| **CORS** | Permissive | Restrictive |

### **PM2 Ecosystem Configuration**

The `ecosystem.config.js` automatically adapts based on environment:

```javascript
env_development: {
  instances: 1,           // Single instance
  exec_mode: "fork",      // Fork mode
  watch: true,            // File watching enabled
},
env_production: {
  instances: "max",       // All CPU cores
  exec_mode: "cluster",   // Cluster mode
  watch: false,           // No file watching
}
```

## 🔍 Monitoring & Debugging

### **Development Monitoring**
```bash
# Application logs
npm run dev                    # Console output
npm run docker:dev:logs        # Docker app logs

# PM2 monitoring
npm run pm2:monitor           # Visual dashboard
npm run pm2:logs              # Real-time logs
npm run pm2:status            # Process status
```

### **Production Monitoring**
```bash
# Docker monitoring
docker-compose logs -f app    # Application logs
docker stats                  # Resource usage

# PM2 monitoring
pm2 monit                     # Visual dashboard
pm2 logs                      # Application logs
pm2 status                    # Cluster status
```

### **Health Checks**
All services include health checks:
- **MySQL**: `mysqladmin ping`
- **Redis**: `redis-cli ping`
- **RabbitMQ**: `rabbitmq-diagnostics ping`
- **App**: `curl -f http://localhost:1234/health`

## 🚨 Troubleshooting

### **Common Issues**

**Port conflicts:**
```bash
# Check what's using port 1234
lsof -i :1234
# Kill process if needed
kill -9 <PID>
```

**Docker permission issues:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**PM2 processes stuck:**
```bash
npm run pm2:stop
pm2 kill                # Nuclear option
pm2 resurrect           # Restore saved processes
```

**Database connection issues:**
```bash
# Reset Docker volumes
npm run docker:dev:down
docker volume rm $(docker volume ls -q)
npm run docker:dev:build
```

## 🎉 Benefits of This Setup

### **Developer Experience**
- ✅ One command development setup
- ✅ Consistent environment across team
- ✅ Fast iteration with hot reload
- ✅ Production parity testing

### **Production Ready**
- ✅ PM2 clustering for performance
- ✅ Health checks and auto-restart
- ✅ Graceful shutdown handling
- ✅ Resource monitoring

### **DevOps Friendly**
- ✅ Docker for consistent deployment
- ✅ Multi-stage builds for optimization
- ✅ Environment-specific configurations
- ✅ Easy scaling and maintenance

---

## 🎯 **TL;DR - Quick Decision Guide**

**🚀 Just want to code?**
```bash
npm run docker:dev:build    # First time (with build)
npm run docker:dev          # Daily development (fast)
```

**🔧 Need debugging/performance?**  
```bash
nix develop && npm run docker:dev && npm run dev
```

**🏭 Production deployment?**
```bash
npm run docker:prod:build
```

The setup handles nodemon vs PM2 automatically based on environment! 🎯

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (recommended: 8GB)
- 10GB free disk space

## Quick Start

### 1. Clone and Setup Environment

```bash
# Clone repository
git clone <your-repository-url>
cd omniflow-starter

# Copy Docker environment template
cp .env.docker .env

# Edit environment variables (optional)
nano .env
```

### 2. Start All Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

### 3. Initialize Database

The application will automatically run migrations and seeders on first startup. Default users:

- **Admin**: admin@omniflow.id / Admin12345.
- **Manager**: manager@omniflow.id / Manager12345.
- **User**: user@omniflow.id / User12345.

### 4. Access Application

- **Web Interface**: http://localhost:1234
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **MySQL**: localhost:3306 (omniflow/omniflow123)
- **Redis**: localhost:6379

## Services Overview

### Application (Node.js)
- **Container**: `omniflow_app`
- **Port**: 1234
- **Health Check**: `/health` endpoint
- **Volumes**: `./logs`, `./uploads`

### MySQL Database
- **Container**: `omniflow_mysql`
- **Port**: 3306
- **Database**: `omniflow_starter`
- **User**: `omniflow` / `omniflow123`
- **Volume**: `mysql_data`

### Redis Cache
- **Container**: `omniflow_redis`
- **Port**: 6379
- **Volume**: `redis_data`

### RabbitMQ Queue
- **Container**: `omniflow_rabbitmq`
- **AMQP Port**: 5672
- **Management Port**: 15672
- **User**: `admin` / `admin123`
- **Volume**: `rabbitmq_data`

## Environment Configuration

### Required Variables

Copy `.env.docker` to `.env` and modify these essential settings:

```env
# Security (CHANGE THESE!)
SESSION_KEY=your-super-secret-session-key-change-this-in-production
CSRF_SECRET=your-csrf-secret-key-change-this

# Application
APP_URL=http://localhost:1234
NODE_ENV=production
```

### Optional Features

Enable optional features by setting to `true` and providing configuration:

#### Email Notifications
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### S3 File Storage
```env
S3_ENABLED=true
S3_ENDPOINT_URL=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
```

#### JWT API Authentication
```env
JWT_ENABLED=true
JWT_SECRET=your-jwt-secret-key
```

## Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart application only
docker-compose restart app

# View logs
docker-compose logs -f app
docker-compose logs mysql redis rabbitmq

# Shell access
docker-compose exec app sh
docker-compose exec mysql mysql -u omniflow -p omniflow_starter
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npx knex migrate:latest

# Run seeders
docker-compose exec app npx knex seed:run

# Database backup
docker-compose exec mysql mysqldump -u omniflow -pomniflow123 omniflow_starter > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u omniflow -pomniflow123 omniflow_starter < backup.sql
```

### Maintenance
```bash
# Update application image
docker-compose build app
docker-compose up -d app

# Clean up unused resources
docker system prune -f

# View resource usage
docker stats

# Check health status
docker-compose ps
```

## Data Persistence

All data is persisted in Docker volumes:

- `mysql_data` - Database files
- `redis_data` - Cache data  
- `rabbitmq_data` - Queue data
- `./logs` - Application logs (host mount)
- `./uploads` - File uploads (host mount)

### Backup Data Volumes
```bash
# Backup MySQL data
docker run --rm -v omniflow-starter_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .

# Backup Redis data
docker run --rm -v omniflow-starter_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

## Production Deployment

### Security Considerations

1. **Change Default Passwords**:
   ```env
   SESSION_KEY=generate-strong-random-key
   DB_PASSWORD=strong-database-password
   RABBITMQ_PASSWORD=strong-rabbitmq-password
   ```

2. **Use Docker Secrets** (Docker Swarm):
   ```yaml
   secrets:
     db_password:
       external: true
   ```

3. **Limit Network Exposure**:
   ```yaml
   # Remove port mappings for internal services
   # mysql:
   #   ports:
   #     - "3306:3306"  # Remove this line
   ```

### Performance Optimization

1. **Increase Resource Limits**:
   ```yaml
   app:
     deploy:
       resources:
         limits:
           memory: 2G
           cpus: '2'
         reservations:
           memory: 1G
           cpus: '1'
   ```

2. **Configure Connection Pools**:
   ```env
   DB_CONNECTION_LIMIT=100
   REDIS_MAX_RETRIES=10
   ```

### Monitoring Setup

1. **Enable OpenTelemetry**:
   ```env
   MONITORING_ENABLED=true
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger:4318/v1/traces
   ```

2. **Add Monitoring Services** to `docker-compose.yml`:
   ```yaml
   jaeger:
     image: jaegertracing/all-in-one:latest
     ports:
       - "16686:16686"
       - "4318:4318"
   ```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait for health check
# 2. Missing environment variables - check .env file
# 3. Port conflicts - change PORT in .env
```

### Database Connection Issues
```bash
# Test MySQL connection
docker-compose exec mysql mysql -u omniflow -pomniflow123 -e "SELECT 1"

# Reset database
docker-compose down
docker volume rm omniflow-starter_mysql_data
docker-compose up -d
```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application health
curl http://localhost:1234/health

# View detailed logs
docker-compose logs -f app | grep ERROR
```

### Clean Reinstall
```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Development with Docker

### Development Override
Create `docker-compose.override.yml`:
```yaml
version: '3.8'
services:
  app:
    environment:
      NODE_ENV: development
      DEV_2FA_BYPASS: true
    volumes:
      - .:/app
      - /app/node_modules
    command: ["npm", "run", "dev"]
```

### Hot Reload
```bash
# Mount source code for development
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Support

For issues and questions:
1. Check application logs: `docker-compose logs app`
2. Verify service health: `docker-compose ps`
3. Review environment configuration: `.env` file
4. Consult main documentation: `README.md`