const amqp = require("amqplib");
const { db } = require("@db/db");
const config = require("@config");
const CircuitBreaker = require("./circuitBreaker");
const { notifyRabbitMQError } = require("@helpers/beepbot");

// Import system logging (lazy load to avoid circular dependency)
let logSystemActivity = null;
const getSystemLogger = () => {
  if (!logSystemActivity) {
    const { logSystemActivity: logger } = require("@helpers/log");
    logSystemActivity = logger;
  }
  return logSystemActivity;
};

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.rabbitmq.maxReconnectAttempts || 10;
    this.reconnectDelay = config.rabbitmq.reconnectDelay || 5000;
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectionTimer = null;

    // Circuit breaker for external services protection
    this.circuitBreaker = new CircuitBreaker("RabbitMQ", {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
    });
  }

  async connect() {
    // Prevent multiple concurrent connection attempts
    if (this.isReconnecting) {
      return this.isConnected;
    }

    this.isReconnecting = true;

    try {
      // Build URL from individual components with proper encoding
      const encodedUser = encodeURIComponent(config.rabbitmq.username);
      const encodedPassword = encodeURIComponent(config.rabbitmq.password);
      const rabbitmqUrl = `amqp://${encodedUser}:${encodedPassword}@${config.rabbitmq.host}:${config.rabbitmq.port}`;

      console.log("🐰 [RABBITMQ] Attempting connection:", {
        url: rabbitmqUrl.replace(/\/\/.*@/, "//***:***@"),
        attempt: this.reconnectAttempts + 1,
      });

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.connection.on("error", this.handleConnectionError.bind(this));
      this.connection.on("close", this.handleConnectionClose.bind(this));

      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;

      console.log("✅ [RABBITMQ] Connected successfully");

      // Log system activity for RabbitMQ connection
      const logger = getSystemLogger();
      if (logger) {
        logger({
          activity: "RabbitMQ queue service connected successfully",
          metadata: {
            eventType: "rabbitmq_connected",
            host: config.rabbitmq.host,
            port: config.rabbitmq.port,
            reconnectAttempt: this.reconnectAttempts,
            circuitBreakerStatus: this.circuitBreaker.getStatus().state,
          },
        }).catch((logErr) =>
          console.error("Failed to log RabbitMQ connect:", logErr.message)
        );
      }

      // Clear any pending reconnection timer
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
        this.reconnectionTimer = null;
      }

      await this.setupQueues();
      console.log("🚀 [RABBITMQ] Ready to process jobs");

      return true;
    } catch (error) {
      this.isConnected = false;
      this.isReconnecting = false;
      await this.handleConnectionError(error);
      return false;
    }
  }

  async setupQueues() {
    // Setup Dead Letter Exchange first
    await this.setupDeadLetterExchange();

    const queues = ["test_queue", "email_queue"];

    for (const queueName of queues) {
      await this.setupQueueWithDLQ(queueName);
      console.log(`✅ [RABBITMQ] Queue ${queueName} setup completed with DLQ`);
    }
  }

  async setupDeadLetterExchange() {
    // Dead Letter Exchange
    await this.channel.assertExchange("dlx", "direct", { durable: true });

    // Dead Letter Queue
    await this.channel.assertQueue("dead_letter_queue", {
      durable: true,
      arguments: {
        "x-message-ttl": 24 * 60 * 60 * 1000, // 24 hours TTL for DLQ messages
      },
    });

    // Bind DLQ to DLX
    await this.channel.bindQueue("dead_letter_queue", "dlx", "dead");

    console.log("☠️ [RABBITMQ] Dead Letter Exchange and Queue setup completed");
  }

  async setupQueueWithDLQ(queueName) {
    await this.channel.assertQueue(queueName, {
      ...config.rabbitmq.defaultQueueOptions,
      arguments: {
        "x-dead-letter-exchange": "dlx",
        "x-dead-letter-routing-key": "dead",
        "x-max-retries": 3, // Max retries before going to DLQ
      },
    });
  }

  async handleConnectionError(error) {
    this.isConnected = false;

    console.error("❌ [RABBITMQ] Connection error:", {
      error: error.message,
      reconnectAttempts: this.reconnectAttempts,
    });

    // Send BeepBot notification for RabbitMQ errors
    notifyRabbitMQError(error, {
      host: config.rabbitmq.host,
      port: config.rabbitmq.port,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      circuitBreakerStatus: this.circuitBreaker.getStatus().state,
      severity:
        this.reconnectAttempts >= this.maxReconnectAttempts
          ? "critical"
          : "error",
      environment: process.env.NODE_ENV,
    }).catch((notifyErr) => {
      console.error(
        "❌ [BEEPBOT] Failed to send RabbitMQ error notification:",
        notifyErr.message
      );
    });

    if (
      !this.isReconnecting &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.isReconnecting = true;
      await this.reconnect();
    }
  }

  async handleConnectionClose() {
    this.isConnected = false;
    this.connection = null;
    this.channel = null;

    console.warn("⚠️ [RABBITMQ] Connection closed");

    // Schedule single reconnection attempt after delay
    if (
      !this.reconnectionTimer &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectionTimer = setTimeout(() => {
        this.reconnectionTimer = null;
        if (!this.isConnected && config.rabbitmq.enabled) {
          console.log("🔄 [RABBITMQ] Attempting reconnection...");
          this.reconnect();
        }
      }, 15000); // 15 seconds delay
    }
  }

  async reconnect() {
    this.reconnectAttempts++;

    const delays = [1000, 2000, 5000, 10000, 30000];
    const delay =
      delays[Math.min(this.reconnectAttempts - 1, delays.length - 1)];

    console.log(
      `🔄 [RABBITMQ] Retry attempt ${this.reconnectAttempts}, waiting ${delay}ms`
    );

    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  async sendToQueue(queueName, data, options = {}) {
    let jobId = null;

    try {
      // Save job to database as pending (unless it's a retry)
      if (!options.skipDbInsert) {
        const [result] = await db.query(
          "INSERT INTO jobs (queue, data, status, max_attempts) VALUES (?, ?, 'pending', ?)",
          [queueName, JSON.stringify(data), options.maxAttempts || 3]
        );
        jobId = result.insertId;
      }

      // Use circuit breaker to protect against RabbitMQ failures
      const success = await this.circuitBreaker.execute(async () => {
        if (!this.isConnected || !this.channel) {
          throw new Error("RabbitMQ not connected");
        }

        const message = Buffer.from(JSON.stringify({ ...data, jobId }));
        const result = this.channel.sendToQueue(queueName, message, {
          ...config.rabbitmq.defaultMessageOptions,
          priority: options.priority || 5,
          ...options,
        });

        if (!result) {
          throw new Error("Failed to send to queue - channel not ready");
        }

        return result;
      });

      if (success) {
        console.log(`📤 [RABBITMQ] Message sent to ${queueName}`, {
          jobId: jobId,
          dataKeys: Object.keys(data),
        });
        return true;
      }
    } catch (error) {
      console.error(`❌ [RABBITMQ] Failed to send to ${queueName}:`, {
        error: error.message,
        jobId: jobId,
        circuitBreaker: error.circuitBreaker || false,
      });

      if (jobId) {
        const errorMsg = error.circuitBreaker
          ? `Circuit breaker OPEN: ${error.message}`
          : error.message;
        await this.updateJobStatus(jobId, "failed", errorMsg);
      }
      return false;
    }
  }

  async updateJobStatus(jobId, status, error = null) {
    try {
      const updateFields = { status };
      const updateValues = [status];

      if (status === "processing") {
        updateFields.started_at = "NOW()";
        updateValues.push();
      } else if (status === "completed") {
        updateFields.completed_at = "NOW()";
        updateValues.push();
      } else if (status === "failed" && error) {
        updateFields.error = "?";
        updateValues.push(error);
      }

      let sql = "UPDATE jobs SET status = ?";
      if (status === "processing") {
        sql += ", started_at = NOW()";
      } else if (status === "completed") {
        sql += ", completed_at = NOW()";
      } else if (status === "failed" && error) {
        sql += ", error = ?";
      }
      sql += " WHERE id = ?";

      updateValues.push(jobId);

      await db.query(sql, updateValues);
    } catch (error) {
      console.error(`❌ [RABBITMQ] Error updating job status:`, error.message);
    }
  }

  async consume(queueName, callback, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        console.error(
          `❌ [RABBITMQ] Cannot consume ${queueName}: not connected`
        );
        return false;
      }

      await this.channel.consume(
        queueName,
        async (msg) => {
          if (msg !== null) {
            let jobId = null;
            try {
              const data = JSON.parse(msg.content.toString());
              jobId = data.jobId;

              console.log(`⚙️ [RABBITMQ] Processing job from ${queueName}`, {
                jobId: jobId,
                dataKeys: Object.keys(data),
              });

              // Update job status to processing
              if (jobId) {
                await this.updateJobStatus(jobId, "processing");
              }

              await callback(data);

              // Update job status to completed
              if (jobId) {
                await this.updateJobStatus(jobId, "completed");
              }

              this.channel.ack(msg);

              console.log(`✅ [RABBITMQ] Job completed from ${queueName}`);
            } catch (error) {
              console.error(`❌ [RABBITMQ] Job failed from ${queueName}:`, {
                error: error.message,
                jobId: jobId,
              });

              // Update job status to failed
              if (jobId) {
                await this.updateJobStatus(jobId, "failed", error.message);
              }

              this.channel.nack(msg, false, false);
            }
          }
        },
        {
          noAck: false,
          ...options,
        }
      );

      console.log(`👂 [RABBITMQ] Started consuming ${queueName}`);
      return true;
    } catch (error) {
      console.error(
        `❌ [RABBITMQ] Failed to setup consumer for ${queueName}:`,
        {
          error: error.message,
        }
      );
      return false;
    }
  }

  async getStats() {
    try {
      const [results] = await db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM jobs 
        GROUP BY status
      `);

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      results.forEach((row) => {
        stats[row.status] = parseInt(row.count);
      });

      return stats;
    } catch (error) {
      console.error("❌ [RABBITMQ] Error getting job stats:", error.message);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  async retryFailedJobs(limit = 10) {
    try {
      const [failedJobs] = await db.query(
        `SELECT * FROM jobs 
         WHERE status = 'failed' 
         AND attempts < max_attempts 
         ORDER BY created_at ASC 
         LIMIT ?`,
        [limit]
      );

      let retried = 0;
      for (const job of failedJobs) {
        try {
          await db.query(
            "UPDATE jobs SET status = 'pending', attempts = attempts + 1 WHERE id = ?",
            [job.id]
          );

          const data = JSON.parse(job.data);
          const success = await this.sendToQueue(job.queue, data, {
            skipDbInsert: true,
          });

          if (success) {
            retried++;
          } else {
            await db.query("UPDATE jobs SET status = 'failed' WHERE id = ?", [
              job.id,
            ]);
          }
        } catch (error) {
          await db.query(
            "UPDATE jobs SET status = 'failed', error = ? WHERE id = ?",
            [error.message, job.id]
          );
        }
      }

      if (retried > 0) {
        console.log(`🔄 [RABBITMQ] Retried ${retried} failed jobs`);
      }

      return retried;
    } catch (error) {
      console.error("❌ [RABBITMQ] Error retrying failed jobs:", {
        error: error.message,
      });
      return 0;
    }
  }

  async getRecentFailedJobs(limit = 5) {
    try {
      const [jobs] = await db.query(
        `SELECT * FROM jobs 
         WHERE status = 'failed' 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit]
      );
      return jobs;
    } catch (error) {
      console.error(
        "❌ [RABBITMQ] Error getting recent failed jobs:",
        error.message
      );
      return [];
    }
  }

  async getFailedJobs(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [jobs] = await db.query(
        `SELECT * FROM jobs 
         WHERE status = 'failed' 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countResult] = await db.query(
        "SELECT COUNT(*) as total FROM jobs WHERE status = 'failed'"
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        jobs,
        pagination: {
          currentPage: page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("❌ [RABBITMQ] Error getting failed jobs:", error.message);
      return {
        jobs: [],
        pagination: {
          currentPage: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempt: this.reconnectAttempts,
      isReconnecting: this.isReconnecting,
      nextReconnectIn: this.isReconnecting ? this.reconnectDelay : null,
      circuitBreaker: this.circuitBreaker.getStatus(),
    };
  }

  async getDeadLetterStats() {
    try {
      if (!this.isConnected || !this.channel) {
        return { messageCount: 0, consumerCount: 0, error: "Not connected" };
      }

      const queueInfo = await this.channel.checkQueue("dead_letter_queue");
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      console.error("❌ [RABBITMQ] Error getting DLQ stats:", error.message);
      return { messageCount: 0, consumerCount: 0, error: error.message };
    }
  }

  async getDLQMessages(limit = 10) {
    try {
      if (!this.isConnected || !this.channel) {
        return [];
      }

      const messages = [];
      let messageCount = 0;

      return new Promise((resolve) => {
        this.channel.consume(
          "dead_letter_queue",
          (msg) => {
            if (msg && messageCount < limit) {
              try {
                const content = JSON.parse(msg.content.toString());
                messages.push({
                  content,
                  properties: msg.properties,
                  fields: msg.fields,
                  timestamp: new Date(),
                });
                messageCount++;
                this.channel.nack(msg, false, true); // Return to queue
              } catch (error) {
                console.error(
                  "❌ [RABBITMQ] Error parsing DLQ message:",
                  error.message
                );
              }
            }

            if (messageCount >= limit || !msg) {
              resolve(messages);
            }
          },
          { noAck: false }
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve(messages), 5000);
      });
    } catch (error) {
      console.error("❌ [RABBITMQ] Error getting DLQ messages:", error.message);
      return [];
    }
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
    return this.circuitBreaker.getStatus();
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;

      // Clear reconnection timer
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
        this.reconnectionTimer = null;
      }

      console.log("😇 [RABBITMQ] Connection closed gracefully");
    } catch (error) {
      console.error("❌ [RABBITMQ] Error closing connection:", error.message);
    }
  }
}

const queueService = new QueueService();

// Initialize RabbitMQ connection if enabled
if (config.rabbitmq.enabled) {
  queueService.connect().catch((error) => {
    console.error("❌ [RABBITMQ] Initial connection failed:", error.message);
  });
} else {
  console.log("⚠️ [RABBITMQ] Job queue is disabled");
}

module.exports = {
  queueService,
  sendToQueue: (queueName, data, options) =>
    queueService.sendToQueue(queueName, data, options),
  consume: (queueName, callback, options) =>
    queueService.consume(queueName, callback, options),
  retryFailedJobs: (limit) => queueService.retryFailedJobs(limit),
  getConnectionStatus: () => queueService.getConnectionStatus(),
  getStats: () => queueService.getStats(),
  getRecentFailedJobs: (limit) => queueService.getRecentFailedJobs(limit),
  getFailedJobs: (page, limit) => queueService.getFailedJobs(page, limit),
  getDeadLetterStats: () => queueService.getDeadLetterStats(),
  getDLQMessages: (limit) => queueService.getDLQMessages(limit),
  resetCircuitBreaker: () => queueService.resetCircuitBreaker(),
  closeConnection: () => queueService.close(),
};
