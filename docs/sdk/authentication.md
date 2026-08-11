# Authentication

## How the API key is configured

`MediaCore` never hardcodes, generates, or reads an API key itself — it only accepts one explicitly:

```ts
interface MediaCoreConfig {
  apiKey: string; // required
  // ...
}

new MediaCore({ apiKey: PEXELS_API_KEY });
```

**Neither `@fotoowl/media-core` nor `@fotoowl/media-react`/`@fotoowl/media-native` reads `.env`, `process.env`, or `import.meta.env` anywhere in their source.** This is architectural, not incidental: these packages must stay usable outside of Vite (or Node, or any specific env-loading convention), so the key can only arrive through `MediaCoreConfig.apiKey`, supplied by whatever application constructs the SDK.

Passing an empty or whitespace-only `apiKey` throws `ConfigurationError` **synchronously**, from `PexelsHttpClient`'s constructor (called from `MediaCore`'s constructor):

```ts
if (!options.apiKey || options.apiKey.trim() === "") {
  throw new ConfigurationError("A Pexels API key is required to initialize media-core.");
}
```

Since `MediaProvider` (in `media-react`/`media-native`) constructs `MediaCore` inside a `useMemo` that runs during render, this throw happens during a React render pass if you mount `MediaProvider` with a missing key — see below for how `apps/web` avoids that.

## How `apps/web` passes the key

`apps/web/src/App.tsx`:

```tsx
const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export default function App() {
  // Guarded BEFORE ever rendering <MediaProvider> — avoids the
  // ConfigurationError throw and avoids attempting any request.
  if (!API_KEY) return <MissingApiKeyNotice />;
  return (
    <MediaProvider config={{ apiKey: API_KEY }}>
      {/* ... */}
    </MediaProvider>
  );
}
```

This is the **only** place in the entire repository where an environment variable is read and handed to the SDK. If the key is missing, the app renders a developer-facing configuration message instead of mounting `MediaProvider` or attempting any request.

## The Vite `VITE_PEXELS_API_KEY` requirement

Vite only exposes environment variables to client-side code via `import.meta.env` when they're prefixed `VITE_` — this is a Vite security feature, not a convention specific to this repo. The repository's root `.env` therefore needs **both**:

```
PEXELS_API_KEY=...          # not read by any package or app directly
VITE_PEXELS_API_KEY=...     # read by apps/web via import.meta.env
```

`apps/web/vite.config.ts` sets `envDir: "../../"` so Vite loads `.env` from the **monorepo root** rather than requiring a second `.env` file inside `apps/web`. A tracked `apps/web/.env.example` documents the required variable name with a placeholder value only:

```
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

`apps/web/src/vite-env.d.ts` declares `ImportMetaEnv.VITE_PEXELS_API_KEY: string` so `import.meta.env.VITE_PEXELS_API_KEY` is typed instead of falling back to `any`.

## Security trade-off: a client-side API key in a browser demo

`apps/web` is a **browser-only** application that calls the Pexels API directly from client-side code. This means:

- `VITE_PEXELS_API_KEY` is inlined into the built JavaScript bundle at build time (this was verified during Phase 6 — the compiled bundle does contain the key string). Anyone who opens browser devtools, views page source, or downloads the built bundle can read it.
- This is an accepted, deliberate trade-off for a demo app hitting a public read-only API directly from the browser — it is **not** a mistake specific to this implementation, and there is no way to avoid it while keeping the app "browser calls Pexels directly, no backend." Any `VITE_`-prefixed (or equivalent client-bundler-prefixed) environment variable in any Vite/CRA/similar app has this property.
- The only way to avoid exposing the key to the browser at all would be to add a backend/proxy service that holds the key server-side and forwards Pexels requests on the client's behalf — which this repository does not have, and which was explicitly out of scope for the `apps/web` demo (see [`architecture.md`](architecture.md); no backend package exists in this repo).
- Practical mitigation if this were ever deployed beyond a local demo: rotate the key if it's ever exposed publicly (e.g. committed by accident, or the built bundle is served publicly and you want to retire that specific key), and treat Pexels API keys as inherently low-stakes secrets (rate-limited, free-tier, no billing/PII exposure) rather than as you would a payment or user-data credential.

**No real API key is included anywhere in this documentation, in `.env.example`, or in any tracked file in this repository.** `.env` itself is `.gitignore`d.

## Related docs

[`media-core.md`](media-core.md) · [`media-react.md`](media-react.md) · [`usage.md`](usage.md)
