# `@fotoowl/media-ui-react`

## Purpose

A genuinely headless React component package: `MediaGrid`, `MediaLightbox`, `ReelSwiper`. It renders behavior (list rendering, load-more, modal semantics, snap-paging, active-item detection, keyboard/focus handling), not visual design.

## Public exports (`src/index.ts`)

```ts
export type { MediaType, MediaItemBase, PhotoMediaItem, VideoMediaItem, MediaItem } from "./types";

export { MediaGrid } from "./components/MediaGrid";
export type { MediaGridProps } from "./components/MediaGrid";

export { MediaLightbox } from "./components/MediaLightbox";
export type { MediaLightboxProps } from "./components/MediaLightbox";

export { ReelSwiper } from "./components/ReelSwiper";
export type { ReelSwiperProps } from "./components/ReelSwiper";
```

Nothing under `src/internal/` (the three behavior hooks: `useInfiniteScrollSentinel`, `useFocusTrap`, `useActiveIntersection`) is exported — they're implementation details of the three components above.

## Headless philosophy

Verified directly from the package's `package.json`: it has **no `dependencies`**, only a `react` peer dependency. It cannot call an API, know about Pexels, or import `@fotoowl/media-core`/`@fotoowl/media-react`/`@fotoowl/media-native` — there is nothing in its dependency graph that would allow it to. All data arrives through props (`items`, `item`), and all visuals arrive through render props (`renderItem`, `renderContent`). See [`headless-contract.md`](headless-contract.md) for the full styling contract.

Its own `MediaItem`/`PhotoMediaItem`/`VideoMediaItem` types (in `src/types.ts`) are declared independently of `media-core`'s — deliberately not imported from it — but are structurally identical, so `PhotoMedia`/`VideoMedia` values from `media-react`'s hooks satisfy them with zero adapter code.

## Component overview

| Component | Renders | Doc |
|---|---|---|
| `MediaGrid` | A list of items via `renderItem`, with `onLoadMore`/`hasMore`/`loading`-driven infinite scroll | [`grid.md`](grid.md) |
| `MediaLightbox` | A controlled, focus-trapped modal for a single item | [`lightbox.md`](lightbox.md) |
| `ReelSwiper` | A vertical, snap-paging feed with active-item detection | [`reel-swiper.md`](reel-swiper.md) |

## React dependency model

```json
"peerDependencies": { "react": ">=18.0.0" },
"devDependencies": { "@types/react": "^18.3.0", "react": "^18.3.0" }
```

`react` is a **peer** dependency (not bundled) — the app supplies its own React copy, and this package uses it rather than shipping a second copy. `react`/`@types/react` under `devDependencies` exist only so the package can be type-checked/built in isolation.

## Related docs

[`grid.md`](grid.md) · [`lightbox.md`](lightbox.md) · [`reel-swiper.md`](reel-swiper.md) · [`headless-contract.md`](headless-contract.md) · [`accessibility.md`](accessibility.md) · [`media-ui-native.md`](media-ui-native.md) · [`../../skills/media-ui-components/SKILL.md`](../../skills/media-ui-components/SKILL.md)
