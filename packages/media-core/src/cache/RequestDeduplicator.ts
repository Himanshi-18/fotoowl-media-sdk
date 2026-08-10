/**
 * Ensures concurrent calls for the same key share a single in-flight
 * request instead of firing duplicate network calls.
 */
export class RequestDeduplicator {
  private readonly pending = new Map<string, Promise<unknown>>();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}
