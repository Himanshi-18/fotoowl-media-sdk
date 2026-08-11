# Caching and request deduplication

`packages/media-core/src/cache/` contains two small, independent utility classes. Both are exported from the package root for advanced/direct use, but ordinary consumers never construct them — `MediaCore` owns one instance of each internally.

## `SimpleCache<T>`

```ts
class SimpleCache<T = unknown> {
  constructor(defaultTtlMs: number = 300000); // 5 minutes
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void; // ttlMs defaults to defaultTtlMs
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}
```

Actual behavior, read directly from the implementation:
- Backed by a plain `Map<string, { value: T; expiresAt: number }>` — **in-memory only**, scoped to the `MediaCore` instance's lifetime. Nothing is persisted to disk, `localStorage`, or across page reloads/app restarts.
- `get()` checks `Date.now() > entry.expiresAt`; an expired entry is deleted and `undefined` is returned (lazy expiry — there is no background timer sweeping expired entries).
- `has()` is implemented as `this.get(key) !== undefined`, so it also triggers lazy expiry.
- There is no maximum size / eviction policy beyond TTL expiry — entries only leave the cache by expiring, being explicitly `delete`d, or `clear()`.

## `RequestDeduplicator`

```ts
class RequestDeduplicator {
  dedupe<T>(key: string, fn: () => Promise<T>): Promise<T>;
}
```

Backed by a `Map<string, Promise<unknown>>` of in-flight promises. If `dedupe(key, fn)` is called while a promise for the same `key` is already pending, the **existing** promise is returned and `fn` is **not** called again. The pending entry is removed once the promise settles (success or failure), via `.finally()`. This only deduplicates *concurrent* calls for the same key — it does not affect calls made after the first one has already resolved (that's what `SimpleCache`'s TTL is for).

## How `MediaCore` uses them together

Every one of `MediaCore`'s six data methods (`searchPhotos`, `curatedPhotos`, `getPhoto`, `searchVideos`, `popularVideos`, `getVideo`) routes through a single private helper:

```ts
private async cachedGet<T>(path: string, params = {}): Promise<T> {
  const key = `${path}?${JSON.stringify(params)}`;
  const cached = this.cache.get(key) as T | undefined;
  if (cached !== undefined) return cached;

  return this.dedup.dedupe(key, async () => {
    const result = await this.http.get<T>(path, params);
    this.cache.set(key, result);
    return result;
  });
}
```

In order:
1. Build a cache key from the request path and its (already-mapped, snake_case Pexels-style) query params, via `JSON.stringify`.
2. Check `SimpleCache` — return immediately on a hit.
3. On a miss, run the actual `fetch` through `RequestDeduplicator` — so if the same request is fired twice before the first resolves (e.g. two components mounting the same query simultaneously), only one network call happens.
4. Cache the freshly-fetched result before returning it.

`cache` is constructed once per `MediaCore` instance with `new SimpleCache(config.cacheTtlMs ?? 300000)` — so every cached entry for that instance shares the same TTL; there is no per-call TTL override exposed through `MediaCore`'s public methods (`SimpleCache.set`'s `ttlMs` parameter exists, but `MediaCore` never passes anything other than the default when calling it).

`MediaCore.clearCache(): void` calls `this.cache.clear()` — it does not touch the `RequestDeduplicator`'s in-flight map (which self-clears via `.finally()` regardless).

## What this does *not* do (avoid inventing behavior)

- No cross-instance or cross-tab/cross-process cache sharing.
- No cache invalidation on mutation (there are no mutating Pexels endpoints exposed, so this doesn't arise).
- No stale-while-revalidate behavior — a cache hit returns the cached value as-is; it does not trigger a background refresh.
- No configurable cache key strategy — the key is always `path + JSON.stringify(params)`, not customizable per call.

## Related docs

[`media-core.md`](media-core.md) · [`usage.md`](usage.md)
