#!/bin/sh

# Docker entrypoint script for Omniflow-Starter
# Handles database migration and seeding before starting the application

echo "🚀 [DOCKER-ENTRYPOINT] Starting Omniflow-Starter initialization..."

# Wait for database to be ready
echo "⏳ [DOCKER-ENTRYPOINT] Waiting for database connection..."
timeout=60
while ! nc -w 3 $DB_HOST $DB_PORT > /dev/null 2>&1; do
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "❌ [DOCKER-ENTRYPOINT] Database connection timeout after 60 seconds"
    exit 1
  fi
  echo "⏳ [DOCKER-ENTRYPOINT] Database not ready, waiting... ($timeout seconds remaining)"
  sleep 1
done

echo "✅ [DOCKER-ENTRYPOINT] Database connection established"

# Run database migrations
echo "📊 [DOCKER-ENTRYPOINT] Running database migrations..."
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ [DOCKER-ENTRYPOINT] Database migrations completed successfully"
else
    echo "❌ [DOCKER-ENTRYPOINT] Database migrations failed"
    exit 1
fi

# Run database seeders (only if not in production or explicitly enabled)
if [ "$NODE_ENV" != "production" ] || [ "$FORCE_SEED" = "true" ]; then
    echo "🌱 [DOCKER-ENTRYPOINT] Running database seeders..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo "✅ [DOCKER-ENTRYPOINT] Database seeding completed successfully"
        echo "👤 [DOCKER-ENTRYPOINT] Default users created:"
        echo "   • Admin: admin@omniflow.id / Admin12345."
        echo "   • Manager: manager@omniflow.id / Manager12345."
        echo "   • User: user@omniflow.id / User12345."
    else
        echo "⚠️ [DOCKER-ENTRYPOINT] Database seeding failed (continuing anyway)"
    fi
else
    echo "🏭 [DOCKER-ENTRYPOINT] Skipping database seeding (production mode)"
    echo "💡 [DOCKER-ENTRYPOINT] Set FORCE_SEED=true to run seeders in production"
fi

echo "🎉 [DOCKER-ENTRYPOINT] Database initialization completed"
echo "🚀 [DOCKER-ENTRYPOINT] Starting application..."

# Execute the main command (from Dockerfile CMD)
exec "$@"