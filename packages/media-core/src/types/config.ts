export interface MediaCoreConfig {
  /** Pexels API key. Must be supplied explicitly by the consumer — never hardcoded or read from env by this package. */
  apiKey: string;
  /** Overrides the Pexels API origin. Defaults to "https://api.pexels.com". */
  baseUrl?: string;
  /** Default cache TTL in milliseconds for GET responses. Defaults to 5 minutes. */
  cacheTtlMs?: number;
  /** Request timeout in milliseconds. Defaults to 15000. */
  timeoutMs?: number;
  /** Whether to auto-register the built-in console logger for `download`/`view` events. Defaults to true. */
  enableDefaultLogging?: boolean;
}
