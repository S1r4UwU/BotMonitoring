export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // nombre d'échecs avant OPEN
  timeout: number; // (ms) délai max d'une opération avant échec
  resetTimeout: number; // (ms) durée avant tentative de HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: number;

  constructor(private readonly config: CircuitBreakerConfig) {}

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = undefined;
  }

  private onFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // L'opération doit respecter le signal si elle supporte AbortController
      const result = await operation();
      clearTimeout(timeoutId);
      this.onSuccess();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      this.onFailure();
      throw error;
    }
  }

  // Getters d'observabilité
  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      config: this.config,
    } as const;
  }
}

export const defaultCircuitConfig: CircuitBreakerConfig = {
  failureThreshold: 3,
  timeout: 15_000,
  resetTimeout: 60_000,
};


