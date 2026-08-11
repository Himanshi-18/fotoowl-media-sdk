# FotoOwl Media SDK — Documentation

A headless media SDK for browsing Pexels photos/videos, split into a framework-agnostic core, thin React and React Native data-layer wrappers, and headless (unstyled) UI component packages for each platform.

## Packages

| Package | Path | Purpose |
|---|---|---|
| `@fotoowl/media-core` | `packages/media-core` | Framework-agnostic Pexels client: auth, caching, request dedup, typed errors, event bus. |
| `@fotoowl/media-react` | `packages/media-react` | React hooks + `MediaProvider` wrapping `media-core`. |
| `@fotoowl/media-native` | `packages/media-native` | Same hooks/provider surface as `media-react`, for React Native. |
| `@fotoowl/media-ui-react` | `packages/media-ui-react` | Headless React components: `MediaGrid`, `MediaLightbox`, `ReelSwiper`. |
| `@fotoowl/media-ui-native` | `packages/media-ui-native` | Same three components, built on React Native primitives. |
| `apps/web` | `apps/web` | Vite + React demo app wiring all of the above together. |
| `skills/` | `skills/` | AI-coding-assistant skill docs for consuming `media-react` + `media-ui-react` correctly. |

## Where to start

- New to the codebase? Read [`sdk/architecture.md`](sdk/architecture.md) first — it explains the dependency direction between every package.
- Building a data-fetching feature? See [`sdk/usage.md`](sdk/usage.md) and [`sdk/media-react.md`](sdk/media-react.md) (or [`sdk/media-native.md`](sdk/media-native.md) for React Native).
- Building UI with the headless components? See [`components/headless-contract.md`](components/headless-contract.md), then [`components/grid.md`](components/grid.md), [`components/lightbox.md`](components/lightbox.md), [`components/reel-swiper.md`](components/reel-swiper.md).
- Setting up the Pexels API key? See [`sdk/authentication.md`](sdk/authentication.md).

## SDK docs (`docs/sdk/`)

| Doc | Covers |
|---|---|
| [`media-core.md`](sdk/media-core.md) | `MediaCore` class: config, photo/video methods, errors, caching, events, all exported types |
| [`media-react.md`](sdk/media-react.md) | `MediaProvider` + every React hook, with real usage examples |
| [`media-native.md`](sdk/media-native.md) | The React Native equivalent, dependency model, and its untested-on-a-real-app limitations |
| [`architecture.md`](sdk/architecture.md) | Package dependency direction across the whole repo |
| [`authentication.md`](sdk/authentication.md) | How the Pexels API key flows from `.env` → Vite → `MediaCore`, and the client-key trade-off |
| [`events.md`](sdk/events.md) | The `download`/`view` event bus, `useMediaEvent`/`useMediaEvents` |
| [`caching.md`](sdk/caching.md) | `SimpleCache` + `RequestDeduplicator` and how `MediaCore` uses them |
| [`usage.md`](sdk/usage.md) | End-to-end code examples against the real public API |

## Component docs (`docs/components/`)

| Doc | Covers |
|---|---|
| [`media-ui-react.md`](components/media-ui-react.md) | Package purpose, exports, headless philosophy |
| [`media-ui-native.md`](components/media-ui-native.md) | RN package purpose, exports, FlatList/Modal approach |
| [`grid.md`](components/grid.md) | `MediaGrid` — web and native, side by side |
| [`lightbox.md`](components/lightbox.md) | `MediaLightbox` — web and native, side by side |
| [`reel-swiper.md`](components/reel-swiper.md) | `ReelSwiper` — web and native, side by side |
| [`headless-contract.md`](components/headless-contract.md) | What these components will and won't style for you |
| [`accessibility.md`](components/accessibility.md) | Actual, implemented accessibility behavior only |

## Scope note

This documentation describes the SDK/component packages and the `apps/web` demo exactly as implemented at the time of writing. It does not describe `media-ui-native` running inside a real React Native application — no such app exists in this repository (see [`sdk/media-native.md`](sdk/media-native.md) and [`components/media-ui-native.md`](components/media-ui-native.md) for what that means in practice).
