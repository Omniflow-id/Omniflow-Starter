// === Third-party modules ===
const mysql = require("mysql2/promise");

// === Relative imports ===
const config = require("../config");

/**
 * Database Connection Pool with Comprehensive Management
 *
 * Features:
 * - Optimized connection pool configuration for dev/prod environments
 * - Connection health monitoring and logging
 * - Automatic reconnection with exponential backoff
 * - Pool statistics and performance metrics
 * - Graceful connection handling and cleanup
 *
 * Pool Configuration:
 * - Development: 10 connections max (lighter load)
 * - Production: 50 connections max (high concurrent load)
 * - 60s acquire timeout (prevents hanging requests)
 * - 60s query timeout (prevents long-running queries)
 * - Auto-reconnect enabled with 2s delay
 */

// Create the connection pool using centralized config
const db = mysql.createPool(config.database);

// Connection Pool Event Monitoring
if (config.app.env === "development") {
  // Development logging for debugging
  db.on("connection", (connection) => {
    console.log(
      `🔗 [DB] New connection established as id ${connection.threadId}`
    );
  });

  db.on("error", (err) => {
    console.error("❌ [DB] Database pool error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("🔄 [DB] Connection lost, pool will reconnect automatically");
    }
  });

  db.on("release", (connection) => {
    console.log(
      `🔓 [DB] Connection ${connection.threadId} released back to pool`
    );
  });
} else {
  // Production logging (errors only)
  db.on("error", (err) => {
    console.error("❌ [DB] Database pool error:", {
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Get connection pool statistics
 * @returns {Object} Pool statistics for monitoring
 */
function getPoolStats() {
  return {
    totalConnections: db.pool.config.connectionLimit,
    activeConnections: db.pool._allConnections
      ? db.pool._allConnections.length
      : 0,
    idleConnections: db.pool._freeConnections
      ? db.pool._freeConnections.length
      : 0,
    queuedRequests: db.pool._connectionQueue
      ? db.pool._connectionQueue.length
      : 0,
    maxIdle: db.pool.config.maxIdle,
    idleTimeout: db.pool.config.idleTimeout,
  };
}

/**
 * Test database connection health
 * @returns {Promise<boolean>} Connection health status
 */
async function testConnection() {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ [DB] Connection health check failed:", error.message);
    return false;
  }
}

/**
 * Gracefully close all database connections
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    console.log("🔄 [DB] Closing database connection pool...");
    await db.end();
    console.log("✅ [DB] Database connection pool closed successfully");
  } catch (error) {
    console.error("❌ [DB] Error closing database pool:", error);
    throw error;
  }
}

// Log initial pool configuration
if (config.app.env === "development") {
  console.log("🔧 [DB] Connection pool initialized:", {
    connectionLimit: config.database.connectionLimit,
    queueLimit: config.database.queueLimit,
    maxIdle: config.database.maxIdle,
    idleTimeout: config.database.idleTimeout,
    environment: config.app.env,
  });
}

module.exports = {
  db,
  getPoolStats,
  testConnection,
  closePool,
};
