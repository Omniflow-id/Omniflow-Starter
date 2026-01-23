# ==================================
# Multi-stage Dockerfile for Omniflow-Starter
# Supports both development and production builds
# ==================================

# Base stage - common dependencies
FROM node:22-alpine AS base

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    dumb-init \
    netcat-openbsd

# Copy package files
COPY package*.json ./

# ================================== 
# Development stage
# ==================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Copy and set permissions for entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create necessary directories and set permissions before switching user
RUN mkdir -p logs uploads && \
    chown -R node:node /app && \
    chmod -R 755 /app/logs /app/uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 1234

# Development health check (less strict)
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=2 \
    CMD curl -f http://localhost:1234/health || exit 1

# Set entrypoint for database initialization
ENTRYPOINT ["docker-entrypoint.sh"]

# Development command - use nodedirectly
CMD ["node", "--no-deprecation", "server.js"]

# ==================================
# Production dependencies stage
# ==================================
FROM base AS prod-deps

# Install production dependencies (omit dev dependencies)
RUN npm install --omit=dev && npm cache clean --force

# ==================================
# Production stage  
# ==================================
FROM node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    dumb-init \
    netcat-openbsd

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package*.json ./

# Copy application code
COPY . .

# Copy and set permissions for entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create necessary directories and set permissions before switching user
RUN mkdir -p logs uploads && \
    chown -R node:node /app && \
    chmod -R 755 /app/logs /app/uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 1234

# Production health check (more robust)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:1234/health || exit 1

# Set entrypoint for database initialization
ENTRYPOINT ["docker-entrypoint.sh"]

# Production command - use node directly
CMD ["dumb-init", "node", "server.js"]