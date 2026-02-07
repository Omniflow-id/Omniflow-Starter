const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
} = require("@middlewares/errorHandler");
const { db, getPoolStats, testConnection } = require("@db/db");
const { getRedisStats, isConnected: isRedisConnected } = require("@db/redis");
const {
  getConnectionStatus: getRabbitMQStatus,
  getStats: getRabbitMQStats,
} = require("@helpers/queue");
const config = require("@config");

const getHealthAPI = asyncHandler(async (_req, res) => {
  const startTime = Date.now();

  // Test database connection
  const dbHealthy = await testConnection();

  // Get Redis and RabbitMQ connection status (synchronous)
  const redisHealthy = isRedisConnected();
  const rabbitStatus = getRabbitMQStatus();
  const rabbitHealthy = rabbitStatus?.connected || false;

  // Get detailed stats
  const poolStats = getPoolStats();
  const redisStats = getRedisStats();
  const rabbitStats = getRabbitMQStats();

  // Calculate individual component statuses
  const databaseStatus = dbHealthy ? "healthy" : "unhealthy";
  const redisStatus = redisHealthy ? "healthy" : "unhealthy";
  const rabbitHealthStatus = rabbitHealthy ? "healthy" : "unhealthy";

  // Determine overall health status
  // System is healthy if database is healthy (core dependency)
  // Redis and RabbitMQ are optional, so degraded if they're down but DB is up
  let overallStatus = "healthy";
  let healthMessage = "All systems operational";

  if (!dbHealthy) {
    overallStatus = "unhealthy";
    healthMessage = "Database connection is critical - system may be impaired";
  } else if (!redisHealthy || !rabbitHealthy) {
    overallStatus = "degraded";
    healthMessage =
      "Optional services are unavailable - core functionality intact";
  }

  // Calculate pool utilization
  const poolUtilization =
    poolStats.totalConnections > 0
      ? (poolStats.activeConnections / poolStats.totalConnections) * 100
      : 0;

  // Memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryPercent =
    memoryUsage.heapTotal > 0
      ? Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      : 0;

  // Response time
  const responseTime = Date.now() - startTime;

  const healthData = {
    service: "omniflow-starter",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    status: overallStatus,
    message: healthMessage,
    timestamp: new Date().toISOString(),
    response_time_ms: responseTime,
    uptime_seconds: Math.round(process.uptime()),
    components: {
      database: {
        status: databaseStatus,
        message: dbHealthy
          ? "Database connection is active"
          : "Database connection failed",
        details: {
          healthy: dbHealthy,
          host: config.database.host,
          database: config.database.database,
          pool: {
            total_connections: poolStats.totalConnections,
            active_connections: poolStats.activeConnections,
            idle_connections: poolStats.idleConnections,
            queued_requests: poolStats.queuedRequests,
            utilization_percent: Math.round(poolUtilization),
            acquire_timeout_ms: poolStats.acquireTimeout,
            query_timeout_ms: poolStats.queryTimeout,
          },
        },
      },
      redis: {
        status: redisStatus,
        message: redisHealthy
          ? "Redis cache connection is active"
          : "Redis cache connection failed",
        details: {
          healthy: redisStats.connected,
          host: config.redis?.host || "N/A",
          port: config.redis?.port || "N/A",
          stats: {
            total_keys: redisStats.totalKeys || 0,
            memory_used_mb: redisStats.memoryUsed || 0,
            connected_clients: redisStats.connectedClients || 0,
          },
        },
      },
      rabbitmq: {
        status: rabbitHealthStatus,
        message: rabbitHealthy
          ? "RabbitMQ queue connection is active"
          : "RabbitMQ queue connection failed",
        details: {
          healthy: rabbitStats.connected,
          host: config.rabbitmq?.host || "N/A",
          port: config.rabbitmq?.port || "N/A",
          stats: {
            status: rabbitStats.status || "disconnected",
            circuit_breaker: rabbitStats.circuitBreaker || "unknown",
            queues: rabbitStats.queues || [],
          },
        },
      },
    },
    system: {
      memory: {
        used_mb: memoryUsedMB,
        total_mb: memoryTotalMB,
        usage_percent: memoryPercent,
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        array_buffers_mb: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu_usage_percent: Math.round(
          (process.cpuUsage().user / 1000000 / process.uptime()) * 100
        ),
      },
    },
  };

  // Determine HTTP status code
  let httpStatus = 200;
  if (overallStatus === "unhealthy") {
    httpStatus = 503;
  } else if (overallStatus === "degraded") {
    httpStatus = 200; // Still responding, just degraded
  }

  res.status(httpStatus).json({
    message: healthMessage,
    success: overallStatus !== "unhealthy",
    data: healthData,
  });
});

const getHealthDetailedAPI = asyncHandler(async (_req, res) => {
  // More detailed health check including extended information
  const startTime = Date.now();

  // Get all component stats
  const poolStats = getPoolStats();
  const redisStats = getRedisStats();
  const rabbitStats = getRabbitMQStats();
  const rabbitStatus = getRabbitMQStatus();

  // Get database info
  const dbInfo = { version: "unknown", connected: false };
  try {
    const [versionResult] = await db.query("SELECT VERSION() as version");
    if (versionResult && versionResult.length > 0) {
      dbInfo.version = versionResult[0].version;
      dbInfo.connected = true;
    }
  } catch (dbError) {
    dbInfo.error = dbError.message;
  }

  // Extended system info
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const detailedHealthData = {
    service: "omniflow-starter",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: dbInfo.connected ? "healthy" : "unhealthy",
        message: dbInfo.connected
          ? "Database connection is active"
          : "Database connection failed",
        details: {
          connected: dbInfo.connected,
          version: dbInfo.version,
          host: config.database.host,
          database: config.database.database,
          connection_limit: config.database.connectionLimit,
          pool: {
            total: poolStats.totalConnections,
            active: poolStats.activeConnections,
            idle: poolStats.idleConnections,
            waiting: poolStats.queuedRequests,
            utilization_percent:
              poolStats.totalConnections > 0
                ? Math.round(
                    (poolStats.activeConnections / poolStats.totalConnections) *
                      100
                  )
                : 0,
          },
          timestamps: {
            server_time: new Date().toISOString(),
            timezone: process.env.TIMEZONE || "Asia/Jakarta",
          },
        },
      },
      redis: {
        status: redisStats.connected ? "healthy" : "unhealthy",
        message: redisStats.connected
          ? "Redis cache connection is active"
          : "Redis cache connection failed",
        details: {
          connected: redisStats.connected,
          host: config.redis?.host || "N/A",
          port: config.redis?.port || "N/A",
          keyspace: redisStats.keyspace || {},
          stats: {
            total_keys: redisStats.totalKeys || 0,
            expired_keys: redisStats.expiredKeys || 0,
            evicted_keys: redisStats.evictedKeys || 0,
            used_memory_human: redisStats.usedMemoryHuman || "0B",
            connected_clients: redisStats.connectedClients || 0,
          },
        },
      },
      rabbitmq: {
        status: rabbitStatus.connected ? "healthy" : "unhealthy",
        message: rabbitStatus.connected
          ? "RabbitMQ queue connection is active"
          : "RabbitMQ queue connection failed",
        details: {
          connected: rabbitStatus.connected,
          host: config.rabbitmq?.host || "N/A",
          port: config.rabbitmq?.port || "N/A",
          user: config.rabbitmq?.user || "N/A",
          circuit_breaker: rabbitStats.circuitBreaker || "unknown",
          queues: rabbitStats.queues || [],
        },
      },
    },
    system: {
      memory: {
        heap_used_bytes: memoryUsage.heapUsed,
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_bytes: memoryUsage.heapTotal,
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heap_usage_percent: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        ),
        external_bytes: memoryUsage.external,
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        array_buffers_bytes: memoryUsage.arrayBuffers || 0,
        array_buffers_mb: Math.round(
          (memoryUsage.arrayBuffers || 0) / 1024 / 1024
        ),
        rss_bytes: memoryUsage.rss,
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        user_us: cpuUsage.user,
        system_us: cpuUsage.system,
        usage_percent: Math.round(
          (cpuUsage.user / 1000000 / process.uptime()) * 100
        ),
      },
      process: {
        pid: process.pid,
        node_version: process.version,
        v8_version: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
        release: process.release,
        uptime_seconds: Math.round(process.uptime()),
        argv: process.argv,
      },
    },
    response_time_ms: Date.now() - startTime,
  };

  res.status(200).json({
    message: "Detailed health check completed",
    success: true,
    data: detailedHealthData,
  });
});

const getHealthLivezAPI = asyncHandler(async (_req, res) => {
  // Kubernetes-style liveness probe - just checks if the process is running
  const isHealthy = process.uptime() > 0;

  res.status(isHealthy ? 200 : 503).send(isHealthy ? "OK" : "NOT OK");
});

const getHealthReadyzAPI = asyncHandler(async (_req, res) => {
  // Kubernetes-style readiness probe - checks if the app can handle requests
  const dbHealthy = await testConnection();
  const redisHealthy = isRedisConnected();
  const rabbitStatus = getRabbitMQStatus();
  const rabbitHealthy = rabbitStatus?.connected || false;

  // Only ready if database is healthy (core dependency)
  const isReady = dbHealthy;

  if (isReady) {
    res.status(200).json({
      ready: true,
      checks: {
        database: dbHealthy,
        redis: redisHealthy,
        rabbitmq: rabbitHealthy,
      },
    });
  } else {
    res.status(503).json({
      ready: false,
      checks: {
        database: dbHealthy,
        redis: redisHealthy,
        rabbitmq: rabbitHealthy,
      },
      message: "Not ready to receive traffic",
    });
  }
});

const getHealthStartupAPI = asyncHandler(async (_req, res) => {
  // Kubernetes-style startup probe - checks if the app has finished starting up
  const startupComplete = process.uptime() > 5; // Assume startup is complete after 5 seconds

  if (startupComplete) {
    res.status(200).json({
      started: true,
      uptime_seconds: Math.round(process.uptime()),
      message: "Application startup completed",
    });
  } else {
    res.status(503).json({
      started: false,
      uptime_seconds: Math.round(process.uptime()),
      message: "Application still starting up",
    });
  }
});

module.exports = {
  getHealthAPI,
  getHealthDetailedAPI,
  getHealthLivezAPI,
  getHealthReadyzAPI,
  getHealthStartupAPI,
};
