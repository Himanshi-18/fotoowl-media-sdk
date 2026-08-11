# `@fotoowl/media-core`

Framework-agnostic Pexels media SDK core. Pure TypeScript — no React, React Native, or DOM dependency anywhere in `packages/media-core/src`.

## Purpose

Wraps the Pexels REST API with:
- An explicit, non-hardcoded API-key configuration.
- In-memory response caching and request deduplication.
- Typed request/response contracts and typed errors.
- A small typed event bus (`download` / `view`).

## Public API (`src/index.ts`)

```ts
export { MediaCore, createMediaCore } from "./MediaCore";

export * from "./types";     // Media, PhotoMedia, VideoMedia, Pagination,
                              // MediaSearchParams, MediaListParams,
                              // PhotosResult, VideosResult, MediaCoreConfig,
                              // MediaSDKEvents, DownloadEventPayload, ViewEventPayload,
                              // + raw Pexels wire types
export * from "./errors";    // MediaSDKError and subclasses
export { EventEmitter } from "./events/EventEmitter";
export type { Listener, Unsubscribe } from "./events/EventEmitter";
export { SimpleCache, RequestDeduplicator } from "./cache";
```

## Creating a `MediaCore` instance

```ts
import { MediaCore, createMediaCore } from "@fotoowl/media-core";

const core = new MediaCore({ apiKey: PEXELS_API_KEY });
// or, equivalently:
const core2 = createMediaCore({ apiKey: PEXELS_API_KEY });
```

`createMediaCore` is a one-line factory (`return new MediaCore(config)`) — use whichever reads better; they're identical.

## Configuration — `MediaCoreConfig`

```ts
interface MediaCoreConfig {
  apiKey: string;                  // required — see authentication.md
  baseUrl?: string;                 // default: "https://api.pexels.com"
  cacheTtlMs?: number;               // default: 300000 (5 minutes)
  timeoutMs?: number;                 // default: 15000
  enableDefaultLogging?: boolean;      // default: true — see events.md
}
```

Passing an empty or whitespace-only `apiKey` throws `ConfigurationError` **synchronously, from the constructor** — before any network call is attempted. See [`authentication.md`](authentication.md).

## Photo operations

```ts
searchPhotos(params: MediaSearchParams): Promise<PhotosResult>
curatedPhotos(params?: MediaListParams): Promise<PhotosResult>
getPhoto(id: number): Promise<PhotoMedia>
```

- `MediaSearchParams = { query: string; page?: number; perPage?: number }`. `query` must be non-empty — an empty/whitespace query throws `ValidationError` (not a network call).
- `MediaListParams = { page?: number; perPage?: number }`.
- `PhotosResult = { items: PhotoMedia[]; pagination: Pagination }` — **one page per call**; see [`usage.md`](usage.md) for accumulating multiple pages.
- Backing endpoints: `GET /v1/search`, `GET /v1/curated`, `GET /v1/photos/:id`.

## Video operations

```ts
searchVideos(params: MediaSearchParams): Promise<VideosResult>
popularVideos(params?: MediaListParams): Promise<VideosResult>
getVideo(id: number): Promise<VideoMedia>
```

Same parameter/return shape as the photo methods, with `VideosResult = { items: VideoMedia[]; pagination: Pagination }`. Backing endpoints: `GET /videos/search`, `GET /videos/popular`, `GET /videos/videos/:id`.

## Core data types

```ts
type MediaType = "photo" | "video";

interface MediaItem {
  id: number; type: MediaType; url: string; width: number; height: number;
  alt?: string; photographer?: string; photographerUrl?: string; avgColor?: string;
}

interface PhotoMedia extends MediaItem {
  type: "photo";
  src: { original: string; large: string; medium: string; small: string; tiny: string };
}

interface VideoMedia extends MediaItem {
  type: "video";
  videoFiles: Array<{ id: number; quality: string; fileType: string; width?: number; height?: number; link: string }>;
  duration?: number;
}

type Media = PhotoMedia | VideoMedia;

interface Pagination { page: number; perPage: number; totalResults?: number; nextPage?: string; prevPage?: string; }
```

`VideoMedia` has **no thumbnail/poster field** — Pexels' raw video payload includes one (`image`), but `MediaCore`'s mapper does not surface it on `VideoMedia`. Consumers needing a video poster must render a `<video>`/native video element themselves; this is not a bug to "fix" in consumer code, it reflects the current mapped type.

## Errors

All errors extend `MediaSDKError extends Error` (`message`, optional `status`, optional `cause`):

| Class | When thrown |
|---|---|
| `ConfigurationError` | `apiKey` missing/empty when constructing `MediaCore` |
| `ValidationError` | `searchPhotos`/`searchVideos` called with an empty `query` |
| `AuthenticationError` | HTTP 401 or 403 from Pexels |
| `NotFoundError` | HTTP 404 |
| `RateLimitError` | HTTP 429 (has an optional `retryAfterSeconds`, read from the `Retry-After` header) |
| `NetworkError` | `fetch` itself throws (offline, DNS failure, timeout abort, etc.) |
| `ApiError` | Any other non-OK HTTP status |

These are thrown from `async` methods, so callers see them as rejected promises — `media-react`/`media-native` hooks catch them and expose them via their `error` field rather than letting them propagate. See [`media-react.md`](media-react.md).

## Caching

Every `GET` (all six methods above) is routed through an internal `cachedGet` helper: a cache key of `` `${path}?${JSON.stringify(params)}` `` is checked in a `SimpleCache` instance (constructed with `cacheTtlMs` from config); on a miss, the request is routed through a `RequestDeduplicator` so concurrent calls for the same key share one in-flight `fetch`. Full behavior: [`caching.md`](caching.md).

`clearCache(): void` clears the entire cache.

## Events

`MediaCore.events` is a `readonly EventEmitter<MediaSDKEvents>` restricted to exactly two events, `download` and `view`. Nothing inside `MediaCore` emits them automatically — call `core.trackDownload(media, url)` / `core.trackView(media)` yourself. Full behavior: [`events.md`](events.md).

## Related docs

[`authentication.md`](authentication.md) · [`caching.md`](caching.md) · [`events.md`](events.md) · [`usage.md`](usage.md) · [`media-react.md`](media-react.md) · [`media-native.md`](media-native.md)
