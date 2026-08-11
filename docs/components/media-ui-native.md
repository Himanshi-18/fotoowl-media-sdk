# `@fotoowl/media-ui-native`

## Purpose

The React Native counterpart to `@fotoowl/media-ui-react`: the same three headless components (`MediaGrid`, `MediaLightbox`, `ReelSwiper`), implemented on React Native primitives instead of DOM/web APIs. Same independence guarantee: no dependency on `@fotoowl/media-core`, `@fotoowl/media-react`, `@fotoowl/media-native`, or any network/Pexels logic.

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

Its `MediaType`/`MediaItemBase`/`PhotoMediaItem`/`VideoMediaItem`/`MediaItem` types are declared independently from `media-ui-react`'s (same shape, separate declaration) — deliberately, so neither UI package depends on the other. `src/internal/useLatestRef.ts` is not exported.

## React Native implementation approach

| Concern | Web (`media-ui-react`) | Native (`media-ui-native`) |
|---|---|---|
| List rendering | Plain `<div>`/`renderItem` map | `FlatList` |
| Infinite scroll | `IntersectionObserver` sentinel `<div>` | `FlatList`'s native `onEndReached` |
| Modal | Controlled `<div>` + focus trap | RN `Modal` (`transparent`, `animationType`) |
| Close/back | `Escape` keydown | `Modal`'s `onRequestClose` (Android hardware back / RN-documented) |
| Snap paging | CSS `scroll-snap-type`/`scroll-snap-align` | `FlatList`'s native `pagingEnabled` |
| Active-item detection | `IntersectionObserver` | `FlatList`'s `onViewableItemsChanged` + `viewabilityConfig` |

None of this is a web implementation "ported" to RN — each behavior uses the RN-native mechanism for the same effect.

### `MediaGrid`
Wraps `FlatList`. `onLoadMore` is wired to `onEndReached`/`onEndReachedThreshold`, debounced with a ref flag that re-arms on `onMomentumScrollBegin` (a documented `FlatList` gotcha: `onEndReached` can otherwise fire more than once for the same scroll position). `numColumns` is FlatList's own grid support, passed straight through.

### `MediaLightbox`
Wraps RN's `Modal` (`transparent`, `animationType`) with a `Pressable` backdrop and a no-op-`onPress` inner `Pressable` for content — RN has no `stopPropagation`, so an inner `Pressable` claiming the touch is the idiomatic way to stop a content tap from also closing the modal. Android hardware back is handled via `Modal`'s own `onRequestClose` prop — nothing custom. `accessibilityViewIsModal` on the content is the RN/VoiceOver equivalent of a web focus trap.

### `ReelSwiper`
Wraps `FlatList` with `pagingEnabled`. The component measures its own height via `onLayout` (not `Dimensions.get('window')`, so it's correct under split-screen/rotation) and sizes each item to match — which also gives a trivial uniform `getItemLayout`, used for both `pagingEnabled` correctness and reliable `scrollToIndex`/`initialScrollIndex`.

## Dependency model

```json
"dependencies": {},
"peerDependencies": { "react": ">=18.0.0", "react-native": ">=0.70.0" },
"peerDependenciesMeta": { "react-native": { "optional": true } },
"devDependencies": { "@types/react": "^18.3.0", "@types/react-native": "^0.70.19", "react": "^18.3.0" }
```

No runtime dependencies at all. `react-native` is a peer dependency marked `optional` for the same reason as `@fotoowl/media-native` — see [`../sdk/architecture.md`](../sdk/architecture.md#why-react-native-is-an-optional-peer-dependency). `@types/react-native@^0.70.19` is a types-only devDependency used solely so this package can be type-checked without installing the real (much heavier) `react-native` runtime package.

## Limitations due to no real RN app

**No React Native application exists in this repository.** This has concrete consequences for what has and hasn't been verified:

- `tsc --noEmit` passes against `@types/react-native@0.70.19` — confirming the code is *type-correct* against that (2022-era) API surface for `FlatList`, `Modal`, `Pressable`, `Image`, `View`, etc.
- This does **not** confirm the components render or behave correctly on an actual device or simulator — there is no RN app in this repo to mount them in, and none was created.
- `@types/react-native@0.70.19` may not perfectly reflect the API surface of whatever `react-native` version a real consuming app eventually uses; the props/behavior documented here matches the source code as written, not a live-tested RN runtime.
- Interaction details that can only be observed at runtime — paging "feel," backdrop touch-swallowing, hardware back-button behavior — are implemented per RN's documented, standard patterns, but have not been visually or interactively confirmed.

## Related docs

[`media-ui-react.md`](media-ui-react.md) · [`grid.md`](grid.md) · [`lightbox.md`](lightbox.md) · [`reel-swiper.md`](reel-swiper.md) · [`../sdk/media-native.md`](../sdk/media-native.md)
