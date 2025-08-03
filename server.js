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
      console.log(
        `🚀 [SERVER] Application running on http://localhost:${PORT}`
      );

      // Start workers after server is ready
      if (config.rabbitmq.enabled) {
        try {
          const workerManager = require("./workers");
          await workerManager.start();
          console.log("✅ [WORKERS] All workers started successfully");
        } catch (error) {
          console.error("❌ [WORKERS] Failed to start:", error.message);
        }
      }
    });
  } catch (error) {
    console.error(`❌ [SERVER] Failed to start:`, error.message);
  }
};

// Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(
    `\n🛑 [SHUTDOWN] Received ${signal}, starting graceful shutdown...`
  );

  server.close(async () => {
    console.log("📴 [SERVER] HTTP server closed gracefully");

    try {
      // Close RabbitMQ connection
      if (config.rabbitmq.enabled) {
        const { closeConnection } = require("@helpers/queue");
        await closeConnection();
        console.log("🐰 [RABBITMQ] Connection closed gracefully");
      }

      // Close database pool
      const { closePool } = require("@db/db");
      await closePool();
      console.log("💾 [DATABASE] Pool closed gracefully");

      console.log("✅ [SHUTDOWN] Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error(
        "❌ [SHUTDOWN] Error during graceful shutdown:",
        error.message
      );
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("💀 [SHUTDOWN] Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10000);
}

start();
