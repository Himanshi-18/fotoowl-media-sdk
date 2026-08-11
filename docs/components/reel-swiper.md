# `ReelSwiper`

Available from both `@fotoowl/media-ui-react` and `@fotoowl/media-ui-native`. Same purpose — a vertical, snap-paging, "reel"/story-style feed with active-item detection — built on each platform's native scroll/paging mechanism.

## Rendering — `renderItem` signature (both platforms, identical)

```ts
renderItem: (item: T, index: number, isActive: boolean) => ReactNode  // web
renderItem: (item: T, index: number, isActive: boolean) => ReactElement | null // native
```

Both pass **three** arguments — `isActive` reflects whether this item is the currently active/most-visible one (e.g. to decide whether a video should autoplay).

## Props

### Web (`@fotoowl/media-ui-react`)

```ts
interface ReelSwiperProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode;
  getKey?: (item: T) => string | number;      // default: `${item.type}-${item.id}`
  activeIndex?: number;                        // controlled
  defaultActiveIndex?: number;                  // uncontrolled initial index, default 0
  onActiveIndexChange?: (index: number, item: T) => void;
  activeThreshold?: number;                      // 0-1 visibility ratio, default 0.6
  className?: string;
  itemClassName?: string;
}
```

### Native (`@fotoowl/media-ui-native`)

```ts
interface ReelSwiperProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;  // default: `${item.type}-${item.id}`
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number, item: T) => void;
  activeThreshold?: number;                              // default 0.6
  testID?: string;
}
```

**The native version has no `className`/`itemClassName`/`style` prop at all.** Its root `View` always uses an internal `flex: 1` style with no way to override or extend it from outside. This is a real, current limitation — not an oversight to route around with an undocumented prop; if the native `ReelSwiper` doesn't size itself the way your screen needs, you must wrap it in your own sized container `View`.

## `activeIndex` / `defaultActiveIndex` (identical semantics on both platforms)

- `defaultActiveIndex` (uncontrolled): sets the initial active item. Scrolled to **once**, on mount only — web via `scrollIntoView`, native via `FlatList`'s `initialScrollIndex`. Changing it after mount has no further effect on either platform.
- `activeIndex` (controlled): when provided, the component both *reflects* the active item **and** *drives* scroll position — setting it triggers a scroll to that item (web: `scrollIntoView({ block: "start" })`; native: `FlatList.scrollToIndex`). User-driven scrolling is still detected independently and reported via `onActiveIndexChange`.

## Paging / snap behavior

| | Web | Native |
|---|---|---|
| Mechanism | CSS `scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start` on each item | `FlatList`'s native `pagingEnabled` |
| Container height requirement | **Required.** `overflow-y: auto` + `scroll-snap-type` do nothing on a `div` with default `height: auto` — `className` must resolve to a bounded height (e.g. `height: 70vh`). No height prop exists; this is CSS-only by design. | **Self-measuring.** The component measures its own height via `onLayout` (not `Dimensions.get('window')`, so it stays correct under split-screen/rotation) and sizes each item to match. The *parent* must still give it bounded space to measure (e.g. `flex: 1` inside a sized container) — the component itself sets no fixed dimensions. |
| Item height requirement | `itemClassName` must resolve to `height: 100%` so each slide occupies exactly one page | Handled automatically — each item is wrapped in a `View` sized to the measured container height |

## Active-item detection

| | Web | Native |
|---|---|---|
| Mechanism | `IntersectionObserver` across all item wrappers, comparing visibility ratios | `FlatList`'s `onViewableItemsChanged` + `viewabilityConfig.itemVisiblePercentThreshold` (native-bridge-backed, RN's equivalent of `IntersectionObserver`) |
| Threshold prop | `activeThreshold` (0-1 ratio, default `0.6`) | `activeThreshold` (0-1 ratio, default `0.6`; converted internally to a 0-100 `itemVisiblePercentThreshold`) |

## Callbacks

```ts
onActiveIndexChange?: (index: number, item: T) => void
```
Identical signature on both platforms. Fires whenever the active item changes, whether from user interaction or from a controlled `activeIndex` change.

## Key behavior

Both default to `` `${item.type}-${item.id}` `` (web: `getKey`, native: `keyExtractor`) — same collision-avoidance rationale as `MediaGrid`.

## Example (web, from `apps/web/src/components/ReelView.tsx`)

```tsx
<ReelSwiper
  items={videos}
  className="reel-viewport"   // height: 70vh
  itemClassName="reel-item"    // height: 100%
  onActiveIndexChange={(index) => setActiveIndex(index)}
  renderItem={(item, _index, isActive) => (
    <video src={item.videoFiles[0]?.link} muted playsInline controls autoPlay={isActive} />
  )}
/>
```

## Related docs

[`media-ui-react.md`](media-ui-react.md) · [`media-ui-native.md`](media-ui-native.md) · [`headless-contract.md`](headless-contract.md)
