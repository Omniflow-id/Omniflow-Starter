// === Side-effect imports (HARUS PALING ATAS) ===
require("module-alias/register");

// === Core modules ===
const http = require("node:http");

// === Relative imports ===
const app = require("./app");
const config = require("./config");

const PORT = config.app.port;
const server = http.createServer(app);

const start = () => {
  try {
    server.listen(PORT, async () => {
      console.log(`🚀 [SERVER] is running on port http://localhost:${PORT}`);

      // Start workers after server is ready
      if (config.rabbitmq.enabled) {
        try {
          const workerManager = require("./workers");
          await workerManager.start();
          console.log("🔧 [WORKERS] Started successfully");
        } catch (error) {
          console.error("❌ [WORKERS] Failed to start:", error.message);
        }
      }
    });
  } catch (error) {
    console.log(`⚠️ [ERROR], ${error}`);
  }
};

// Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("📴 HTTP server closed");

    try {
      // Close RabbitMQ connection
      if (config.rabbitmq.enabled) {
        const { closeConnection } = require("@helpers/queue");
        await closeConnection();
        console.log("🐰 RabbitMQ connection closed");
      }

      // Close database pool
      const { closePool } = require("@db/db");
      await closePool();
      console.log("💾 Database pool closed");

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("💀 Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

start();
