# Events

## The event emitter

`packages/media-core/src/events/EventEmitter.ts` implements a minimal generic typed pub/sub emitter:

```ts
type EventMap = Record<string, unknown>;
type Listener<Payload> = (payload: Payload) => void;
type Unsubscribe = () => void;

class EventEmitter<Events extends EventMap> {
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe;
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  removeAllListeners(event?: keyof Events): void;
}
```

`on()` returns its own `Unsubscribe` function, so independent subscribers never interfere with each other — calling one subscriber's returned unsubscribe function does not affect any other listener on the same event.

`MediaCore.events` is a `readonly EventEmitter<MediaSDKEvents>` instance created once per `MediaCore` instance.

## Available events

```ts
interface DownloadEventPayload { mediaId: number; type: "photo" | "video"; url: string; timestamp: number; }
interface ViewEventPayload     { mediaId: number; type: "photo" | "video"; timestamp: number; }

interface MediaSDKEvents {
  download: DownloadEventPayload;
  view: ViewEventPayload;
  [key: string]: unknown; // index signature — see note below
}
```

Exactly two named events are defined: `download` and `view`. (The `[key: string]: unknown` index signature is a TypeScript artifact of the interface definition, not an invitation to emit arbitrary event names in application code — no other event name is ever emitted anywhere in `media-core`, and no hook subscribes to anything else.)

**Nothing inside `MediaCore` emits these automatically as a side effect of fetching data.** They only fire when application code explicitly calls:

```ts
core.trackDownload(media: PhotoMedia | VideoMedia, url: string): void;
core.trackView(media: PhotoMedia | VideoMedia): void;
```

Both build the appropriate payload (`mediaId: media.id`, `type: media.type`, `timestamp: Date.now()`, and `url` for downloads) and call `this.events.emit(...)`.

## Default console logging

`MediaCore`'s constructor auto-subscribes a console logger to both events when `config.enableDefaultLogging` is `true` (the default):

```ts
function logDownloadEvent(payload: DownloadEventPayload): void {
  console.log(`[media-core] download: ${payload.type} #${payload.mediaId}`, payload);
}
function logViewEvent(payload: ViewEventPayload): void {
  console.log(`[media-core] view: ${payload.type} #${payload.mediaId}`, payload);
}
```

Disable it via `config.enableDefaultLogging: false` at construction time, or call `core.disableDefaultLogging()` afterward — both unsubscribe the logger without affecting any other subscriber.

## Subscribing / unsubscribing directly on `MediaCore`

```ts
const core = new MediaCore({ apiKey });
const unsubscribe = core.events.on("download", (payload) => {
  console.log(payload.mediaId, payload.url);
});

// later
unsubscribe();
```

## `useMediaEvent` (React / React Native)

```ts
function useMediaEvent<K extends "download" | "view">(
  event: K,
  listener: (payload: MediaSDKEvents[K]) => void
): void
```

```tsx
useMediaEvent("view", (payload) => {
  analytics.track("media_viewed", payload);
});
```

Subscribes for the component's lifetime and unsubscribes automatically on unmount (or when `event`/the `MediaCore` instance changes). Safe to pass a new inline arrow function on every render — the listener is kept in a ref internally, and the effect only re-subscribes based on `[core, event]`, not on every render.

## `useMediaEvents` (React / React Native) — manual control

```ts
function useMediaEvents(): EventEmitter<MediaSDKEvents>
```

Returns the raw emitter for cases where `useMediaEvent`'s automatic lifecycle doesn't fit. **The caller is responsible for calling the `Unsubscribe` function `on()` returns** — typically in a `useEffect` cleanup:

```tsx
const events = useMediaEvents();
useEffect(() => {
  const off = events.on("download", handleDownload);
  return off; // required — useMediaEvents does not clean this up for you
}, [events]);
```

## Unsubscribe / cleanup expectations, summarized

| API | Cleans up automatically? |
|---|---|
| `useMediaEvent(event, listener)` | Yes — on unmount / `event` change / `core` change |
| `useMediaEvents().on(event, listener)` | No — you must call the returned `Unsubscribe` yourself |
| `core.events.on(event, listener)` (outside React) | No — same as above |
| `core.disableDefaultLogging()` | Removes only the built-in console logger, not your own listeners |

## Related docs

[`media-core.md`](media-core.md) · [`media-react.md`](media-react.md) · [`../../skills/media-data-wiring/SKILL.md`](../../skills/media-data-wiring/SKILL.md)
