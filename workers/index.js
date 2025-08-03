require("module-alias/register");

const { queueService } = require("@helpers/queue");

// Import all workers
const TestWorker = require("./testWorker");

class WorkerManager {
  constructor() {
    this.isShuttingDown = false;
    this.workers = [];
    this.initializeWorkers();
  }

  initializeWorkers() {
    // Register all workers here
    this.workers = [
      new TestWorker(),
      // new EmailWorker(), // Future workers
      // new NotificationWorker(),
    ];
  }

  async start() {
    try {
      console.log("🔧 [WORKERS] Starting Worker Manager...");

      // Wait for RabbitMQ connection to be ready
      await this.waitForConnection();

      // Start all workers
      for (const worker of this.workers) {
        try {
          await worker.start();
        } catch (error) {
          console.error(
            `❌ [WORKERS] Failed to start ${worker.constructor.name}:`,
            error.message
          );
        }
      }

      const runningWorkers = this.workers.filter((w) => w.isRunning).length;
      console.log(
        `✅ [WORKERS] Manager started: ${runningWorkers}/${this.workers.length} workers running`
      );

      this.setupGracefulShutdown();
    } catch (error) {
      console.error(
        "❌ [WORKERS] Failed to start Worker Manager:",
        error.message
      );
      throw error;
    }
  }

  async waitForConnection(maxWaitTime = 30000) {
    const startTime = Date.now();

    while (!queueService.isConnected) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error("Timeout waiting for RabbitMQ connection");
      }

      console.log("⏳ [WORKERS] Waiting for RabbitMQ connection...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("🐰 [WORKERS] RabbitMQ connection ready, starting workers...");
  }

  async stop() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log("🛑 [WORKERS] Stopping all workers...");

    for (const worker of this.workers) {
      try {
        await worker.stop();
      } catch (error) {
        console.error(
          `❌ [WORKERS] Error stopping ${worker.constructor.name}:`,
          error.message
        );
      }
    }

    console.log("✅ [WORKERS] All workers stopped gracefully");
  }

  getStatus() {
    return {
      manager: "WorkerManager",
      workers: this.workers.map((w) => w.getStatus()),
      totalWorkers: this.workers.length,
      runningWorkers: this.workers.filter((w) => w.isRunning).length,
    };
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 [WORKERS] Received ${signal}, shutting down...`);
      await this.stop();
    };

    // Only setup if running as standalone (not from server.js)
    if (require.main === module) {
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    }
  }
}

const workerManager = new WorkerManager();

// Allow running as standalone script
if (require.main === module) {
  workerManager.start().catch((error) => {
    console.error("❌ [WORKERS] Manager startup failed:", error.message);
    process.exit(1);
  });
}

module.exports = workerManager;
