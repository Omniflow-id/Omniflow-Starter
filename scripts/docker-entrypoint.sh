#!/bin/sh

# Docker entrypoint script for Omniflow-Starter
# Handles database migration and seeding before starting the application

echo "🚀 [DOCKER-ENTRYPOINT] Starting Omniflow-Starter initialization..."

# Wait for database to be ready
echo "⏳ [DOCKER-ENTRYPOINT] Waiting for database connection..."
timeout=60
while ! nc -w 3 "$DB_HOST" "${DB_PORT:-3306}" > /dev/null 2>&1; do
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "❌ [DOCKER-ENTRYPOINT] Database connection timeout after 60 seconds"
    exit 1
  fi
  echo "⏳ [DOCKER-ENTRYPOINT] Database not ready, waiting... ($timeout seconds remaining)"
  sleep 1
done

echo "✅ [DOCKER-ENTRYPOINT] Database connection established"
echo "🚀 [DOCKER-ENTRYPOINT] Starting application..."

# Execute the main command (from Dockerfile CMD)
exec "$@"