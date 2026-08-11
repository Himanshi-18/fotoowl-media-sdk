# `@fotoowl/media-react`

Thin React bindings around `@fotoowl/media-core`. Every hook here calls a `MediaCore` method and tracks the result in React state — no fetching, caching, or mapping logic lives in this package.

## Public API (`src/index.ts`)

```ts
export { MediaProvider, MediaCoreContext } from "./MediaProvider";
export type { MediaProviderProps } from "./MediaProvider";

export * from "./hooks"; // useMediaCore, useSearchPhotos, useSearchVideos,
                          // useCuratedPhotos, usePopularVideos, usePhoto,
                          // useVideo, useMediaEvent, useMediaEvents

export type { MediaCore, MediaCoreConfig } from "@fotoowl/media-core";
```

## `MediaProvider`

```tsx
type MediaProviderProps =
  | { children: ReactNode; client: MediaCore; config?: never }
  | { children: ReactNode; client?: never; config: MediaCoreConfig };

function MediaProvider(props: MediaProviderProps): JSX.Element
```

Accepts **either** a pre-built `client` instance **or** a `config` object — never both (TypeScript rejects passing both). When given `config`, it builds `MediaCore` via `useMemo`, re-creating it only if `client` or one of `config.apiKey` / `config.baseUrl` / `config.cacheTtlMs` / `config.timeoutMs` / `config.enableDefaultLogging` actually changes — a fresh inline `config={{...}}` object every render is safe.

```tsx
<MediaProvider config={{ apiKey: PEXELS_API_KEY }}>
  <App />
</MediaProvider>
```

If neither `client` nor `config` is supplied, or `config.apiKey` is empty, construction throws synchronously during render (see [`authentication.md`](authentication.md)) — guard for a missing key *before* rendering `MediaProvider`.

`MediaCoreContext` (a plain `React.Context<MediaCore | null>`) is also exported for advanced use (e.g. tests that want to supply a mock provider value directly).

## `useMediaCore()`

```ts
function useMediaCore(): MediaCore
```
Reads the `MediaCore` instance from context. Throws `Error("useMediaCore must be used within a <MediaProvider>.")` if there is no ancestor `MediaProvider`. Every other hook calls this internally.

## Search hooks — imperative

```ts
function useSearchPhotos(): {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  search: (params: MediaSearchParams) => Promise<void>;
  reset: () => void;
}

function useSearchVideos(): {
  videos: VideoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  search: (params: MediaSearchParams) => Promise<void>;
  reset: () => void;
}
```

Neither hook fetches anything until `search({ query, page?, perPage? })` is called. Calling `search()` again **replaces** `photos`/`videos` with the new page's results — it does not append (see [`usage.md`](usage.md) for pagination accumulation). `reset()` clears `photos`/`videos`/`error` back to their initial state.

```tsx
const { photos, loading, error, search } = useSearchPhotos();

<button onClick={() => search({ query: "mountains", page: 1, perPage: 20 })} disabled={loading}>
  Search
</button>
```

## Curated/popular hooks — automatic

```ts
function useCuratedPhotos(params?: MediaListParams): {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

function usePopularVideos(params?: MediaListParams): {
  videos: VideoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}
```

Fetch automatically on mount, and again whenever `params.page`/`params.perPage` change. `refetch()` re-runs the same request without changing args.

```tsx
const { videos, loading, error } = usePopularVideos({ perPage: 10 });
```

## Single-item hooks — automatic, skippable

```ts
function usePhoto(id: number | undefined): {
  photo: PhotoMedia | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

function useVideo(id: number | undefined): {
  video: VideoMedia | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}
```

Pass `undefined` to intentionally skip fetching (e.g. before an id is known) — `loading` stays `false` and no request fires. Automatically refetches when `id` changes to a new value.

## Event hooks

```ts
function useMediaEvent<K extends "download" | "view">(
  event: K,
  listener: (payload: MediaSDKEvents[K]) => void
): void

function useMediaEvents(): EventEmitter<MediaSDKEvents>
```

`useMediaEvent` subscribes for the component's lifetime and unsubscribes automatically; safe to pass an inline listener every render. `useMediaEvents` returns the raw emitter for manual `on`/`off`. Full behavior and examples: [`events.md`](events.md).

## Loading / error semantics

All hooks share the same shape: `loading: boolean` reflects only the latest call (stale/superseded responses are dropped), and `error: Error | undefined` is typically one of `media-core`'s typed errors (`ValidationError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `NetworkError`, `ApiError`, `ConfigurationError`) — always safe to render `error.message`.

## Related docs

[`architecture.md`](architecture.md) · [`authentication.md`](authentication.md) · [`events.md`](events.md) · [`usage.md`](usage.md) · [`media-native.md`](media-native.md) (React Native equivalent) · [`../../skills/media-data-wiring/SKILL.md`](../../skills/media-data-wiring/SKILL.md)
