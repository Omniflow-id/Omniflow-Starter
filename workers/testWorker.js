require("module-alias/register");

const { consume } = require("@helpers/queue");

class TestWorker {
  constructor() {
    this.queueName = "test_queue";
    this.isRunning = false;
  }

  async start() {
    try {
      console.log(`🧪 Starting test worker for queue: ${this.queueName}`);

      await consume(this.queueName, async (data) => {
        console.log("🎯 JOB RECEIVED:", data);

        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("✅ JOB COMPLETED");
      });

      this.isRunning = true;
      console.log(`✅ Test worker started successfully for ${this.queueName}`);
    } catch (error) {
      console.error("❌ Failed to start test worker:", error.message);
      throw error;
    }
  }

  async stop() {
    this.isRunning = false;
    console.log("🛑 Test worker stopped");
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
