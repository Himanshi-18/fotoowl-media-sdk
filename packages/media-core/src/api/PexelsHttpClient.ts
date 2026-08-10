import { ApiError, AuthenticationError, ConfigurationError, NetworkError, NotFoundError, RateLimitError } from "../errors";

export interface PexelsHttpClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

const DEFAULT_BASE_URL = "https://api.pexels.com";
const DEFAULT_TIMEOUT_MS = 15_000;

/** Thin fetch-based HTTP client for the Pexels API. Framework-agnostic — uses only Web APIs. */
export class PexelsHttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: PexelsHttpClientOptions) {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new ConfigurationError("A Pexels API key is required to initialize media-core.");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async get<T>(path: string, params: QueryParams = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Authorization: this.apiKey },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (cause) {
      throw new NetworkError(`Failed to reach Pexels API: ${(cause as Error).message}`, cause);
    }

    if (!response.ok) {
      await this.throwForStatus(response);
    }

    return (await response.json()) as T;
  }

  private async throwForStatus(response: Response): Promise<never> {
    const body = await response.text().catch(() => "");
    const message = body || response.statusText || "Pexels API request failed";

    switch (response.status) {
      case 401:
      case 403:
        throw new AuthenticationError(message, response.status);
      case 404:
        throw new NotFoundError(message);
      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(message, retryAfter ? Number(retryAfter) : undefined);
      }
      default:
        throw new ApiError(message, response.status);
    }
  }
}
