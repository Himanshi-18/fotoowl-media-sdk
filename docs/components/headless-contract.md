# The headless contract

Applies to all three components in both `@fotoowl/media-ui-react` and `@fotoowl/media-ui-native`.

## Components do not impose visual design

Verified directly from source: there is no color, typography, border, shadow, or spacing decision anywhere in `packages/media-ui-react/src` or `packages/media-ui-native/src`. Every pixel a user sees comes from either the consuming app's CSS/`StyleSheet`, or from what the app's own `renderItem`/`renderContent` functions return.

## The caller controls rendering and styling

Data and behavior arrive as props (`items`, `item`, `open`, `activeIndex`, callbacks); **visuals arrive as render props**:

| Component | Render prop(s) |
|---|---|
| `MediaGrid` | `renderItem(item, index)` — required, no default |
| `MediaLightbox` | `renderContent(item)` — optional, has a default (see [`lightbox.md`](lightbox.md)) |
| `ReelSwiper` | `renderItem(item, index, isActive)` — required, no default |

Nothing is rendered by these components that the app didn't ask for, except `MediaLightbox`'s default photo/video content (used only when `renderContent` is omitted) and the small amount of structural markup listed below.

## Pass-through styling where supported

| Component | Web styling props | Native styling props |
|---|---|---|
| `MediaGrid` | `className`, `as` (wrapper tag) | `style`, `contentContainerStyle` |
| `MediaLightbox` | `className`, `backdropClassName` | `containerStyle`, `backdropStyle` |
| `ReelSwiper` | `className`, `itemClassName` | **None** — see [`reel-swiper.md`](reel-swiper.md) for this specific, real limitation |

Web components also expose stable `data-*` attribute hooks on their internal wrapper elements for CSS targeting without needing a `className` prop for every nested element: `data-media-grid`, `data-media-grid-item`, `data-media-grid-sentinel`, `data-media-lightbox`, `data-media-lightbox-backdrop`, `data-reel-swiper`, `data-reel-swiper-item`, and `data-active` (`"true"`/`"false"`) on each reel item.

## Functional layout behavior that IS required (not a styling choice)

A small amount of CSS/native-layout is load-bearing for the component's one stated behavior, not a visual decision — documented as such directly in the source:

- **Web `ReelSwiper`**: `overflow-y: auto` and `scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start` on each item. Without these, "vertical snap paging" simply wouldn't happen. The container additionally needs the *app* to give it a bounded height (see [`reel-swiper.md`](reel-swiper.md)) — the component supplies the snap mechanics, the app supplies the space for them to operate in.
- **Native `ReelSwiper`**: `flex: 1` on its root `View` (so `onLayout` has something to measure) and a per-item `height` computed from that measurement (so `pagingEnabled` pages correctly). Not a style choice — a direct mechanical requirement of RN's native paging.
- **Native `MediaLightbox`**: `flex: 1` on the backdrop/content `Pressable`s, purely so they fill the `Modal`.

None of this sets a single color, font, or spacing value.

## What these components intentionally do NOT provide

Verified as *absent*, not merely undocumented — do not assume any of the following exist:

- **No default card/thumbnail styling, borders, hover states, or animations** in `MediaGrid`.
- **No built-in "close" button, header, caption, or chrome** in `MediaLightbox` beyond what `renderContent`/the default renderer produces.
- **No built-in pagination UI** (page numbers, "load more" button) — `MediaGrid` only exposes the `onLoadMore` callback; any visible control is the app's.
- **No swipe-gesture library or gesture handling** — `ReelSwiper`'s paging comes from the platform's native scroll/paging primitive, not a custom gesture recognizer, and no gesture library is a dependency of either package.
- **No built-in image/video loading states, placeholders, or error fallbacks** for individual media items — that belongs in `renderItem`/`renderContent`.
- **A `height` prop on `ReelSwiper`** does not exist on either platform — sizing is achieved through CSS (web) or the parent's layout (native), never a component prop.
- **`onNext`/`onPrevious` on native `MediaLightbox`** do not exist — see [`lightbox.md`](lightbox.md).

## Why this matters for consumers

If a task seems to require "making `MediaGrid` look like X" or "adding a button to `MediaLightbox`," the correct place for that change is always the consuming app's `renderItem`/`renderContent` + CSS/`StyleSheet` — never a modification to `packages/media-ui-react` or `packages/media-ui-native` themselves. Reimplementing infinite-scroll detection, focus trapping, or scroll-snap logic inside an app instead of using the props these components already expose is a mistake to avoid, not a valid workaround.

## Related docs

[`media-ui-react.md`](media-ui-react.md) · [`media-ui-native.md`](media-ui-native.md) · [`grid.md`](grid.md) · [`lightbox.md`](lightbox.md) · [`reel-swiper.md`](reel-swiper.md) · [`../../skills/media-ui-components/SKILL.md`](../../skills/media-ui-components/SKILL.md)
