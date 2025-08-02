/**
 * Circuit Breaker Pattern Implementation
 * Protects external services from cascading failures
 */

class CircuitBreaker {
  constructor(service, options = {}) {
    this.service = service;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    
    console.log(`🔐 Circuit Breaker initialized for ${service}`);
  }

  async execute(operation, ...args) {
    if (this.state === 'OPEN') {
      if (this._shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit Breaker HALF_OPEN for ${this.service}`);
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
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) { // Need 2 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log(`✅ Circuit Breaker CLOSED for ${this.service}`);
      }
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.successCount = 0;
      console.log(`❌ Circuit Breaker back to OPEN for ${this.service}`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`🚨 Circuit Breaker OPEN for ${this.service} (${this.failureCount} failures)`);
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
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    console.log(`🔄 Circuit Breaker manually reset for ${this.service}`);
  }
}

module.exports = CircuitBreaker;