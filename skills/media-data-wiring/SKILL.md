---
name: media-data-wiring
description: How to wire @fotoowl/media-react + @fotoowl/media-core data hooks, MediaProvider, the Pexels API key, pagination, and the download/view event bus. Use whenever adding or modifying data-fetching behavior (search, curated/popular lists, single-item fetch, event tracking) in apps/web or any other consumer of this SDK.
---

# Media Data Wiring

## When to use this skill

Use this skill when you are:
- Adding a new screen/component in `apps/web` (or any future consumer app) that needs to fetch photos or videos from Pexels.
- Wiring up `MediaProvider` at an app root.
- Deciding whether to use an imperative search hook or an auto-fetching query hook.
- Implementing pagination / "load more" for search results.
- Subscribing to or emitting `download`/`view` events.
- Debugging "why didn't my data load" or "why did my list get replaced instead of appended" issues.

Do **not** use this skill for how `MediaGrid`/`MediaLightbox`/`ReelSwiper` render or accept props — that's `media-ui-components`.

## Architecture / dependency direction

```
app (e.g. apps/web)
   ↓ imports
@fotoowl/media-react   (hooks, MediaProvider — React-only glue)
   ↓ imports
@fotoowl/media-core     (MediaCore class, Pexels HTTP client, cache, event bus — framework-agnostic)
   ↓ HTTP
Pexels API
```

- `media-core` has **zero** React dependency and never imports `media-react`.
- `media-react` is a thin wrapper: every hook body is a few lines that call a method on the `MediaCore` instance (obtained via `useMediaCore()`) and track React state around it. It does **not** reimplement fetching, caching, deduplication, or mapping — that all lives in `MediaCore`.
- An app should never call `fetch()`/`axios` against Pexels directly, and never import `MediaCore`'s internal modules (`@fotoowl/media-core/dist/...` or source paths) — only the package root export.

## Configuring MediaProvider

`MediaProvider` (from `@fotoowl/media-react`) takes **either** a pre-built `client` **or** a `config` — never both (the prop type is a discriminated union with `client?: never` / `config?: never` on the opposite branch, so TypeScript rejects passing both):

```tsx
import { MediaProvider } from "@fotoowl/media-react";

// Option A — let the provider construct the MediaCore instance:
<MediaProvider config={{ apiKey: API_KEY }}>
  <App />
</MediaProvider>

// Option B — pass an already-constructed instance (e.g. shared with media-native):
const client = createMediaCore({ apiKey: API_KEY });
<MediaProvider client={client}>
  <App />
</MediaProvider>
```

`MediaCoreConfig` (the shape of `config`) is:

```ts
interface MediaCoreConfig {
  apiKey: string;            // required
  baseUrl?: string;          // defaults to "https://api.pexels.com"
  cacheTtlMs?: number;       // defaults to 5 minutes
  timeoutMs?: number;        // defaults to 15000
  enableDefaultLogging?: boolean; // defaults to true (see Events below)
}
```

`MediaProvider` memoizes the constructed instance on `[client, config?.apiKey, config?.baseUrl, config?.cacheTtlMs, config?.timeoutMs, config?.enableDefaultLogging]` — passing a new inline `config={{...}}` object literal every render is fine; it will **not** rebuild `MediaCore` unless one of those primitive values actually changes.

## Explicit API-key flow (read this before wiring auth)

- `MediaCoreConfig.apiKey` is the **only** way a key reaches `MediaCore`. There is no other auth mechanism.
- **`media-core` and `media-react` never read `.env`, `process.env`, or `import.meta.env` themselves.** Grep the source — there is no such reference anywhere in either package. This is an architectural rule, not an oversight: the SDK is framework/bundler-agnostic, so it cannot assume Vite, Node, or any specific env-loading mechanism exists. If you find yourself wanting to read an env var inside `packages/media-core` or `packages/media-react`, stop — that logic belongs in the app.
- **Constructing `MediaCore` with a missing/empty key throws synchronously.** `PexelsHttpClient`'s constructor (called from `MediaCore`'s constructor) throws a `ConfigurationError` if `apiKey` is empty or whitespace-only. Since `MediaProvider` builds the instance inside a `useMemo` that runs during render, an empty key crashes the render tree unless the app guards against it *before* mounting `MediaProvider`.

### Correct Vite usage

Vite only exposes env vars prefixed `VITE_` to client code via `import.meta.env`. This repo's actual pattern (see `apps/web/src/App.tsx`):

```tsx
const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

function App() {
  // Guard BEFORE ever rendering <MediaProvider> — do not attempt requests
  // with a missing key, and do not let MediaCore's constructor throw.
  if (!API_KEY) return <MissingApiKeyNotice />;
  return (
    <MediaProvider config={{ apiKey: API_KEY }}>
      {/* ... */}
    </MediaProvider>
  );
}
```

Add `interface ImportMetaEnv { readonly VITE_PEXELS_API_KEY: string }` in a `vite-env.d.ts` (already present in `apps/web/src/vite-env.d.ts`) so `import.meta.env.VITE_PEXELS_API_KEY` is typed instead of `any`.

## Hooks reference

`useMediaCore()`
```ts
function useMediaCore(): MediaCore
```
Returns the `MediaCore` instance from the nearest `MediaProvider`. **Throws** `Error("useMediaCore must be used within a <MediaProvider>.")` if called outside one. Every other hook calls this internally — you only need it directly for advanced use (e.g. calling `core.trackDownload(...)`, `core.clearCache()`).

`useSearchPhotos()` — **imperative**
```ts
function useSearchPhotos(): {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  search: (params: MediaSearchParams) => Promise<void>;
  reset: () => void;
}
```
Does nothing until you call `search({ query, page?, perPage? })`. `query` is required and must be non-empty (`MediaCore.searchPhotos` throws `ValidationError` otherwise — surfaced through `error`, not thrown into your component).

`useSearchVideos()` — same shape, `videos`/`VideoMedia[]` instead of `photos`.

`useCuratedPhotos(params?: MediaListParams)` — **automatic**
```ts
function useCuratedPhotos(params?: { page?: number; perPage?: number }): {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}
```
Fetches on mount, and again whenever `page`/`perPage` change. Call `refetch()` to force a re-run without changing args.

`usePopularVideos(params?: MediaListParams)` — same shape as above, `videos`/`VideoMedia[]`, auto-fetches.

`usePhoto(id: number | undefined)` — **automatic**
```ts
function usePhoto(id: number | undefined): {
  photo: PhotoMedia | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}
```
Pass `undefined` to intentionally skip fetching (e.g. before an id is known) — `loading` stays `false` and no request fires. Refetches automatically when `id` changes.

`useVideo(id: number | undefined)` — same shape as `usePhoto`, `video`/`VideoMedia`.

### Loading / error semantics (all hooks)

- `loading: boolean` — `true` while a request for the *current* args is in flight. Superseded/stale responses (e.g. you called `search()` again before the first call resolved) are dropped, so `loading`/`error`/`data` always reflect the *latest* call only.
- `error: Error | undefined` — a plain `Error`, but at runtime it is usually one of `media-core`'s typed errors (`ValidationError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `NetworkError`, `ApiError`, `ConfigurationError`), all extending `MediaSDKError` (`.message`, optional `.status`, optional `.cause`). It's always safe to render `error.message` directly.

### Imperative vs. automatic — when to use each

| Hook | Trigger | Use for |
|---|---|---|
| `useSearchPhotos`, `useSearchVideos` | You call `search(params)` | User-initiated actions: a search box submit, a filter change, "search again" |
| `useCuratedPhotos`, `usePopularVideos`, `usePhoto`, `usePhoto`/`useVideo` | Runs itself on mount + arg change | Passive/derived data: a details page for a known id, a "trending now" panel |

Never wrap `search()` in a `useEffect` to make it "auto-run on mount" — if you want auto-fetch behavior, use one of the automatic hooks instead of reimplementing that pattern around a mutation hook.

## Pagination: the hook returns ONE page, the app accumulates

`searchPhotos`/`searchVideos`/`curatedPhotos`/`popularVideos` all return `{ items, pagination }` for exactly the page requested. **Each new `search()`/`refetch()` call replaces `photos`/`videos` in the hook's state — it does not append.** If you need an infinite-scroll list, the app must keep its own accumulator. This is the actual pattern used in `apps/web/src/components/PhotoSearch.tsx`:

```tsx
const { photos, pagination, loading, error, search } = useSearchPhotos();
const [allPhotos, setAllPhotos] = useState<PhotoMedia[]>([]);

// A page-1 result is a fresh search → replace. Any later page → append.
useEffect(() => {
  if (photos.length === 0) return;
  setAllPhotos((prev) => (pagination?.page === 1 ? photos : [...prev, ...photos]));
}, [photos, pagination?.page]);

function handleSubmit(query: string) {
  void search({ query, page: 1, perPage: 20 });
}

function handleLoadMore() {
  void search({ query, page: (pagination?.page ?? 1) + 1, perPage: 20 });
}

const hasMore = Boolean(pagination?.nextPage);
```

`Pagination` is `{ page, perPage, totalResults?, nextPage?, prevPage? }` — `nextPage` mirrors Pexels' own `next_page` field and is the correct signal for `hasMore`; don't compute it from `totalResults` unless you specifically need an exact count.

## Media events: `download` / `view`

`MediaCore` has a built-in typed event bus with exactly two events, defined in `MediaSDKEvents`:
```ts
interface DownloadEventPayload { mediaId: number; type: "photo" | "video"; url: string; timestamp: number; }
interface ViewEventPayload     { mediaId: number; type: "photo" | "video"; timestamp: number; }
```

**Nothing emits these automatically.** They only fire when *you* call one of these `MediaCore` instance methods (get the instance via `useMediaCore()`):
```ts
core.trackDownload(media, url); // media: PhotoMedia | VideoMedia
core.trackView(media);
```
Call these from the UI moment that actually represents a download/view — e.g. a "Download" button's `onClick`, or when a lightbox opens for an item.

By default (`enableDefaultLogging: true`, the default), `MediaCore`'s constructor auto-subscribes a console logger to both events — you'll see `[media-core] download: photo #123 …` in devtools without doing anything. Disable it via `config.enableDefaultLogging: false`, or call `core.disableDefaultLogging()`.

`useMediaEvent(event, listener)` — auto subscribe/unsubscribe:
```ts
function useMediaEvent<K extends "download" | "view">(
  event: K,
  listener: (payload: MediaSDKEvents[K]) => void
): void
```
```tsx
useMediaEvent("download", (payload) => {
  analytics.track("media_downloaded", payload);
});
```
Safe to pass a fresh inline arrow function every render — internally the listener is kept in a ref, and the effect only re-subscribes if `event` or the `MediaCore` instance itself changes. Cleanup (calling the underlying `off`) happens automatically on unmount.

`useMediaEvents()` — escape hatch for manual control:
```ts
function useMediaEvents(): EventEmitter<MediaSDKEvents>
```
Returns the raw emitter. Use this only when `useMediaEvent`'s auto-managed lifecycle doesn't fit (e.g. subscribing outside a component). **You are responsible for calling the `Unsubscribe` function `on()` returns yourself** — typically in a `useEffect` cleanup:
```tsx
const events = useMediaEvents();
useEffect(() => {
  const off = events.on("view", handleView);
  return off; // don't forget this
}, [events]);
```

## What belongs in the app vs. the SDK

| Belongs in `media-core`/`media-react` | Belongs in the app |
|---|---|
| HTTP calls, auth header, caching, request dedup | Reading `import.meta.env` / `.env` |
| Response mapping (Pexels JSON → `PhotoMedia`/`VideoMedia`) | UI state: selected tab, selected item, search query text |
| The `download`/`view` event bus itself | Deciding *when* to call `trackDownload`/`trackView` |
| Loading/error state tracking per request | Accumulating multiple pages into one list |
| Deciding whether a call is "imperative" or "automatic" | Deciding *when* to call `search()` (button, Enter key, debounce, etc.) |

## Common mistakes an AI agent must avoid

1. **Reading env vars inside `packages/media-core` or `packages/media-react`.** Never. The key always arrives via `MediaCoreConfig.apiKey`, supplied by the app.
2. **Assuming `useSearchPhotos`/`useSearchVideos` auto-run on mount.** They don't — nothing happens until `search()` is called.
3. **Assuming `photos`/`videos` accumulate across pages automatically.** They're replaced on every call; the app must accumulate (see Pagination section).
4. **Rendering `<MediaProvider config={{apiKey}}>` without checking the key first.** An empty key throws synchronously during render. Guard before mounting the provider, as `apps/web/src/App.tsx` does.
5. **Passing both `client` and `config` to `MediaProvider`.** The prop type forbids it; if you hit a type error here, pick one.
6. **Forgetting to unsubscribe a manually-created `useMediaEvents()` listener.** `useMediaEvent` handles this for you; raw `events.on(...)` does not.
7. **Assuming `download`/`view` fire automatically from search or rendering.** They only fire when the app explicitly calls `core.trackDownload()`/`core.trackView()`.
8. **Re-deriving `hasMore` from array length instead of `pagination.nextPage`.** Use the SDK-provided signal.
9. **Calling any Pexels endpoint directly with `fetch`/`axios` from the app.** All access must go through `MediaCore` via the hooks.

## Do / Don't

**Do**
- Guard on the API key before rendering `<MediaProvider>`.
- Use `search()`/`refetch()` return values (`Promise<void>`/`Promise<T|undefined>`) with `void` or `await` as appropriate — they don't throw, errors land in `.error`.
- Accumulate paginated results in app-level state, keyed off `pagination.page`.
- Call `core.trackDownload`/`core.trackView` at the exact UI moment those actions happen.
- Use `useMediaEvent` unless you have a specific reason to manage subscriptions manually.

**Don't**
- Don't add a Pexels API key to any file inside `packages/*`.
- Don't wrap an imperative hook's `search()` in a mount-time `useEffect` to fake auto-fetch — use an automatic hook instead.
- Don't assume `MediaGrid`'s `onLoadMore` needs your own `IntersectionObserver` — that's `media-ui-components`'s job, not this layer's.
- Don't call `useMediaCore()` (or any other hook) outside a `MediaProvider` subtree.

## Repository-specific rules

- **Allowed to consume:** `@fotoowl/media-react` (hooks, `MediaProvider`) and, for types only (`PhotoMedia`, `VideoMedia`, `Pagination`, `MediaSearchParams`, `MediaListParams`, `MediaCoreConfig`, error classes), `@fotoowl/media-core` directly. Importing `MediaCore`/`createMediaCore` directly from `@fotoowl/media-core` is fine when you need a shared instance across `media-react` and `media-native` (pass it via `MediaProvider`'s `client` prop).
- **Must never import or modify:** anything inside `packages/media-core/src/*` or `packages/media-react/src/*` from application code — only their public package-root exports. Never import `@fotoowl/media-ui-react` or `@fotoowl/media-ui-native` from this layer's logic files (they're presentation-only and pull no data themselves).
- **Where app-specific logic belongs:** `apps/web/src/**` (or any other consumer app). Query text state, tab selection, pagination accumulation, and calling `trackDownload`/`trackView` all belong in the app, never inside `packages/media-core` or `packages/media-react`.
