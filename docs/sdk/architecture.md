# Architecture

## Dependency direction

```
apps/web
   ├──→ @fotoowl/media-ui-react   (rendering: MediaGrid, MediaLightbox, ReelSwiper)
   └──→ @fotoowl/media-react      (data: MediaProvider, hooks)
             └──→ @fotoowl/media-core
                        └──→ Pexels API (HTTP)
```

A React Native app (none exists in this repository yet — see [`media-native.md`](media-native.md)) would follow the same shape:

```
(hypothetical) apps/mobile
   ├──→ @fotoowl/media-ui-native
   └──→ @fotoowl/media-native
             └──→ @fotoowl/media-core
                        └──→ Pexels API (HTTP)
```

The general rule, verified against every package's actual imports:

```
app → UI/component layer → framework wrapper → media-core
```

## Packages and their boundaries

### `@fotoowl/media-core`
Framework-agnostic. Zero React/React Native/DOM imports (verified — no such references anywhere in `packages/media-core/src`). Owns: the Pexels HTTP client, auth header, in-memory caching, request deduplication, response mapping, typed errors, and the `download`/`view` event bus. Never imports any other package in this repo.

### `@fotoowl/media-react`
Depends on `@fotoowl/media-core` (`"@fotoowl/media-core": "*"` in its `package.json`) and peer-depends on `react`. Every hook is a thin wrapper that calls a method on a `MediaCore` instance and tracks the result in React state — it does not reimplement fetching, caching, or mapping. Never imports `@fotoowl/media-ui-react` or `@fotoowl/media-native`.

### `@fotoowl/media-native`
Same relationship to `media-core` as `media-react`, and an almost identical hooks/provider surface (see [`media-native.md`](media-native.md)), but peer-depends on `react-native` (marked `optional` in `peerDependenciesMeta` — see below) instead of assuming a DOM/browser environment.

### `@fotoowl/media-ui-react`
Has **no runtime dependency on any other package in this repo** — its `package.json` lists no `dependencies`, only a `react` peer dependency. It defines its own structural `MediaItem`/`PhotoMediaItem`/`VideoMediaItem` types rather than importing `media-core`'s. Values returned by `media-react`'s hooks (`PhotoMedia`, `VideoMedia`) satisfy this shape naturally, so they can be passed straight in — but there is no import edge between the packages. It never calls the Pexels API and knows nothing about `media-core` or `media-react`.

### `@fotoowl/media-ui-native`
Same independence rule as `media-ui-react`, built on React Native primitives (`FlatList`, `Modal`, `Pressable`, `View`) instead of DOM elements. Also has its own independent type declarations, and peer-depends on `react-native` (optional).

### `apps/web`
The only package in this repo that imports across both the data layer and the rendering layer at once: `@fotoowl/media-react` (data) and `@fotoowl/media-ui-react` (rendering), plus `@fotoowl/media-core` directly for its exported types (`PhotoMedia`, `VideoMedia`). It contains all Pexels-API-key handling, pagination-accumulation logic, and UI state — none of which lives in any package. See [`usage.md`](usage.md) for how it's wired.

### `skills/`
Not a runtime dependency of anything. Two `SKILL.md` documents (`media-data-wiring`, `media-ui-components`) written to teach an AI coding assistant how to correctly consume `media-react` + `media-ui-react` — they describe the same APIs this documentation set describes, aimed at a different audience/format.

## Why `react-native` is an optional peer dependency

`media-native` and `media-ui-native` both declare:
```json
"peerDependencies": { "react": ">=18.0.0", "react-native": ">=0.70.0" },
"peerDependenciesMeta": { "react-native": { "optional": true } }
```
Without `optional: true`, `npm install` attempts to auto-resolve a real `react-native` package to satisfy the peer — and current `react-native` releases require React 19, which conflicts with the React 18 pinned everywhere else in this workspace. Marking it optional keeps the peer range documented (for whichever real RN app eventually consumes these packages) without forcing npm to install the actual (large) `react-native` package into a workspace that has no RN app yet.

## What each layer is and isn't responsible for

| Layer | Responsible for | Not responsible for |
|---|---|---|
| `media-core` | HTTP, auth, caching, dedup, mapping, errors, event bus | React, rendering, env vars |
| `media-react` / `media-native` | React lifecycle around `MediaCore` calls, `MediaProvider` context | Fetching logic itself, rendering, styling |
| `media-ui-react` / `media-ui-native` | Rendering behavior (list, modal, paging) and platform-appropriate accessibility | Data fetching, pagination state, API knowledge, visual design |
| `apps/web` | Env vars, UI state, wiring hooks to components, pagination accumulation | Any of the above — it only composes them |

See also: [`media-core.md`](media-core.md), [`media-react.md`](media-react.md), [`media-native.md`](media-native.md), [`../components/headless-contract.md`](../components/headless-contract.md).
