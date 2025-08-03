/**
 * Circuit Breaker Pattern Implementation
 * Protects external services from cascading failures
 */

// Import system logging (lazy load to avoid circular dependency)
let logSystemActivity = null;
const getSystemLogger = () => {
  if (!logSystemActivity) {
    const { logSystemActivity: logger } = require("@helpers/log");
    logSystemActivity = logger;
  }
  return logSystemActivity;
};

class CircuitBreaker {
  constructor(service, options = {}) {
    this.service = service;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;

    console.log(`🔐 [CIRCUIT-BREAKER] Initialized for ${service}`);
  }

  async execute(operation, ...args) {
    if (this.state === "OPEN") {
      if (this._shouldAttemptReset()) {
        this.state = "HALF_OPEN";
        console.log(`🔄 [CIRCUIT-BREAKER] HALF_OPEN for ${this.service}`);
      } else {
        const error = new Error(`Circuit breaker is OPEN for ${this.service}`);
        error.circuitBreaker = true;
        throw error;
      }
    }

    try {
      const result = await operation(...args);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        // Need 2 successes to close
        this.state = "CLOSED";
        this.successCount = 0;
        console.log(`✅ [CIRCUIT-BREAKER] CLOSED for ${this.service}`);

        // Log circuit breaker state change
        const logger = getSystemLogger();
        if (logger) {
          logger({
            activity: `Circuit breaker closed for ${this.service}`,
            metadata: {
              eventType: "circuit_breaker_closed",
              service: this.service,
              previousState: "HALF_OPEN",
              newState: "CLOSED",
              successCount: this.successCount,
              failureCount: this.failureCount,
            },
          }).catch((logErr) =>
            console.error("Failed to log circuit breaker:", logErr.message)
          );
        }
      }
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.successCount = 0;
      console.log(`❌ [CIRCUIT-BREAKER] Back to OPEN for ${this.service}`);

      // Log circuit breaker opened from half-open
      const logger = getSystemLogger();
      if (logger) {
        logger({
          activity: `Circuit breaker reopened for ${this.service}`,
          metadata: {
            eventType: "circuit_breaker_reopened",
            service: this.service,
            previousState: "HALF_OPEN",
            newState: "OPEN",
            failureCount: this.failureCount,
            reason: "failed_during_recovery",
          },
        }).catch((logErr) =>
          console.error("Failed to log circuit breaker:", logErr.message)
        );
      }
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.log(
        `🚨 [CIRCUIT-BREAKER] OPEN for ${this.service} (${this.failureCount} failures)`
      );

      // Log circuit breaker opened from threshold
      const logger = getSystemLogger();
      if (logger) {
        logger({
          activity: `Circuit breaker opened for ${this.service} - threshold reached`,
          metadata: {
            eventType: "circuit_breaker_opened",
            service: this.service,
            previousState: "CLOSED",
            newState: "OPEN",
            failureCount: this.failureCount,
            failureThreshold: this.failureThreshold,
            reason: "failure_threshold_exceeded",
          },
        }).catch((logErr) =>
          console.error("Failed to log circuit breaker:", logErr.message)
        );
      }
    }
  }

  _shouldAttemptReset() {
    return Date.now() - this.lastFailureTime >= this.recoveryTimeout;
  }

  getStatus() {
    return {
      service: this.service,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
    };
  }

  // Reset circuit breaker manually (for admin panel)
  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    console.log(`🔄 [CIRCUIT-BREAKER] Manually reset for ${this.service}`);
  }
}

module.exports = CircuitBreaker;
