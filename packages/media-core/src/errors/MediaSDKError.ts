export interface MediaSDKErrorOptions {
  status?: number;
  cause?: unknown;
}

export class MediaSDKError extends Error {
  readonly status?: number;
  readonly cause?: unknown;

  constructor(message: string, options: MediaSDKErrorOptions = {}) {
    super(message);
    this.name = "MediaSDKError";
    this.status = options.status;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends MediaSDKError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends MediaSDKError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends MediaSDKError {
  constructor(message = "Invalid or missing Pexels API key", status = 401) {
    super(message, { status });
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends MediaSDKError {
  constructor(message = "Requested media was not found", status = 404) {
    super(message, { status });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends MediaSDKError {
  readonly retryAfterSeconds?: number;

  constructor(message = "Pexels API rate limit exceeded", retryAfterSeconds?: number) {
    super(message, { status: 429 });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class NetworkError extends MediaSDKError {
  constructor(message = "Network request to Pexels API failed", cause?: unknown) {
    super(message, { cause });
    this.name = "NetworkError";
  }
}

export class ApiError extends MediaSDKError {
  constructor(message: string, status: number) {
    super(message, { status });
    this.name = "ApiError";
  }
}
