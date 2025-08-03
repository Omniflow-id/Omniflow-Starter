require("module-alias/register");

const { consume } = require("@helpers/queue");

class TestWorker {
  constructor() {
    this.queueName = "test_queue";
    this.isRunning = false;
  }

  async start() {
    try {
      console.log(
        `🧪 [TEST-WORKER] Starting consumer for queue: ${this.queueName}`
      );

      await consume(this.queueName, async (data) => {
        console.log("🎯 [TEST-WORKER] Job received:", data);

        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("✅ [TEST-WORKER] Job completed successfully");
      });

      this.isRunning = true;
      console.log(`✅ [TEST-WORKER] Consumer started for ${this.queueName}`);
    } catch (error) {
      console.error("❌ [TEST-WORKER] Failed to start:", error.message);
      throw error;
    }
  }

  async stop() {
    this.isRunning = false;
    console.log("🛑 [TEST-WORKER] Worker stopped gracefully");
  }

  getStatus() {
    return {
      name: "TestWorker",
      queue: this.queueName,
      running: this.isRunning,
    };
  }
}

module.exports = TestWorker;
