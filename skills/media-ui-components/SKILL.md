---
name: media-ui-components
description: How to correctly use the headless @fotoowl/media-ui-react components — MediaGrid, MediaLightbox, ReelSwiper — including their exact prop contracts, the renderItem/renderContent render-prop pattern, styling responsibilities, and accessibility behavior already built in. Use whenever building or modifying UI that displays photo/video media in apps/web or any other consumer app.
---

# Media UI Components

## When to use this skill

Use this skill when you are:
- Rendering a list/grid of `PhotoMedia`/`VideoMedia` (or any structurally-compatible media item) in the browser.
- Building a "click to view full size" lightbox/modal experience.
- Building a vertical, snap-paging "reel"/story-style feed.
- Deciding what CSS belongs in the app vs. what the component already handles.
- Debugging why a component looks unstyled by default (it's supposed to).

Do **not** use this skill for how to fetch the data these components render — that's `media-data-wiring`.

## Architecture / dependency direction

```
app (e.g. apps/web)
   ↓ imports              ↓ imports (separate, independent track)
@fotoowl/media-ui-react     @fotoowl/media-react → @fotoowl/media-core → Pexels
   (pure rendering,
    no data of its own)
```

`@fotoowl/media-ui-react` is a **genuinely headless, standalone package**. Verified from its own source (`package.json` has no `dependencies`, only a `react` peer dependency):

- It **must never import** `@fotoowl/media-core`, `@fotoowl/media-react`, or `@fotoowl/media-native`.
- It **must never** make network/API calls, know what "Pexels" is, or contain any fetch/auth/caching logic.
- It defines its **own** structural `MediaItem`/`PhotoMediaItem`/`VideoMediaItem` types in `src/types.ts` — deliberately *not* imported from `media-core`. `media-core`'s `PhotoMedia`/`VideoMedia` satisfy this shape naturally (same fields), so values flow between the packages with zero adapter code, but there is no import edge between them.
- All data (`items`, `item`) and behavior hooks (`onLoadMore`, `onClose`, `onActiveIndexChange`, etc.) arrive purely through props. The app is responsible for connecting these to `media-react` hooks — the components themselves have no idea `media-react` exists.

If you ever need to add an import from `media-core`/`media-react`/`media-native` inside `packages/media-ui-react/src`, stop — that violates this package's entire reason for existing.

## `MediaGrid`

```ts
interface MediaGridProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;       // required
  getKey?: (item: T) => string | number;                    // default: `${item.type}-${item.id}`
  onLoadMore?: () => void;
  hasMore?: boolean;                                        // default: false
  loading?: boolean;                                        // default: false
  loadMoreRootMargin?: string;                               // IntersectionObserver rootMargin, default "200px"
  as?: keyof JSX.IntrinsicElements;                          // wrapper tag, default "div"
  className?: string;
  renderLoadingIndicator?: () => ReactNode;
}
```

- **`renderItem` is required** — `MediaGrid` has no default visual output. It owns *no* styling; everything you see is what `renderItem` returns.
- **Generic typing**: pass a concrete item type for full inference, e.g. `<MediaGrid<PhotoMedia> items={photos} renderItem={(item) => ...} />` — `item` inside `renderItem` is typed as `PhotoMedia`, not the generic union.
- **`onLoadMore`/`hasMore`/`loading` are the entire pagination contract.** `MediaGrid` renders an invisible sentinel `<div>` *only while `hasMore` is true*, and observes it with `IntersectionObserver`. It calls `onLoadMore()` when the sentinel scrolls into view, but only while `Boolean(onLoadMore) && hasMore && !loading` — so setting `loading: true` while a fetch is in flight is what prevents duplicate calls. There is nothing else to configure; **do not write your own `IntersectionObserver`** in the app for this.
- **`getKey` default is `${item.type}-${item.id}`, not raw `id`.** Photo and video ids are independent Pexels sequences and can collide — only override `getKey` if you have your own guaranteed-unique key.
- **Styling contract:** the rendered DOM is `<Container role="list" className={className} data-media-grid>` wrapping `<div role="listitem" data-media-grid-item>{renderItem(...)}</div>` per item. Style via `className` on the grid and the `[data-media-grid-item]` attribute selector for cells — this is exactly how `apps/web/src/app.css` does it (`.media-grid [data-media-grid-item] { aspect-ratio: 1; ... }`). There is no other styling hook, and none is needed.

## `MediaLightbox`

```ts
interface MediaLightboxProps<T extends MediaItem = MediaItem> {
  item: T | null | undefined;
  open: boolean;                                    // required — fully controlled
  onClose: () => void;                               // required
  onNext?: () => void;
  onPrevious?: () => void;
  renderContent?: (item: T) => ReactNode;             // optional — see default below
  closeOnBackdropClick?: boolean;                     // default: true
  closeOnEscape?: boolean;                            // default: true
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  backdropClassName?: string;
}
```

- **Fully controlled, no internal visibility state.** The component renders `null` whenever `!open || !item` — the app owns `open` and `item` (typically two pieces of `useState`, e.g. `const [selected, setSelected] = useState<PhotoMedia | VideoMedia | null>(null)`, with `open={selected !== null}`).
- **Default `renderContent` already supports both photo and video** — you do **not** need to supply a custom one just to display media:
  - photo: `<img src={item.src.large} alt={item.alt ?? ""} />`
  - video: `<video src={item.videoFiles[0].link} controls autoPlay muted />` (renders `null` if `videoFiles` is empty)
  Only pass `renderContent` if you need custom layout (captions, credits, controls beyond the defaults).
- **Escape key** closes the lightbox when `closeOnEscape` is true (default).
- **Keyboard navigation**: `ArrowRight`/`ArrowLeft` call `onNext`/`onPrevious` — but are suppressed when focus is inside an interactive/text-entry element from your `renderContent` (`input`, `textarea`, `select`, or `contentEditable`), so custom form controls inside the lightbox keep working normally.
- **Focus trap + restoration**: Tab is trapped within the dialog; the first focusable descendant (or the dialog container itself) receives focus once it mounts, and focus returns to whatever was focused before opening once it closes — this correctly re-engages even if `item` arrives asynchronously *after* `open` was already `true` (a callback-ref-based implementation, not a naive `useRef`).
- **Backdrop behavior**: clicking the backdrop closes only when the click originates on the backdrop itself, not a bubbled click from inside the dialog content (checked via `event.target === event.currentTarget`) — so `closeOnBackdropClick` won't accidentally close on clicks inside your rendered media.
- Rendered markup: `role="dialog" aria-modal="true" tabIndex={-1}`, plus `aria-labelledby`/`aria-describedby` pass-through if you supply `labelledBy`/`describedBy` (don't pass an id that doesn't exist in your markup — it becomes a dangling ARIA reference).
- `onNext`/`onPrevious` are **not supported** unless you pass them — the component never invents "next/previous" navigation on its own; you must supply both the callbacks and (if desired) any visible prev/next buttons via `renderContent`.

## `ReelSwiper`

```ts
interface ReelSwiperProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode; // required, 3 args
  getKey?: (item: T) => string | number;             // default: `${item.type}-${item.id}`
  activeIndex?: number;                              // controlled
  defaultActiveIndex?: number;                       // uncontrolled initial index, default 0
  onActiveIndexChange?: (index: number, item: T) => void;
  activeThreshold?: number;                          // 0-1 visibility ratio, default 0.6
  className?: string;
  itemClassName?: string;
}
```

- **`renderItem` receives three args**: `(item, index, isActive)` — `isActive` tells you whether this is the currently-active/most-visible item, e.g. to decide whether a `<video>` should autoplay.
- **Vertical snap behavior** is implemented with plain CSS on the component's own root: `overflow-y: auto; scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start` on each item wrapper. This is the *only* CSS the package ships, and it's documented in the source as strictly functional (no color/spacing/typography).
- **A bounded container height is required.** `overflow`/`scroll-snap` do nothing if the container's height is `auto` (a plain `div`'s default). You must give `className` a rule that resolves to a real height (e.g. `height: 70vh` or `height: 100%` inside an already-sized flex parent) — this is exactly what `apps/web/src/app.css`'s `.reel-viewport { height: 70vh; }` does. There is **no prop** for this (no `height` prop exists) — it's CSS-only, by design, so the package stays unopinionated about layout.
- **Active-item detection** uses `IntersectionObserver` across all item wrappers; whichever item's visibility ratio is both the highest among items and `>= activeThreshold` becomes active, firing `onActiveIndexChange(index, item)`.
- **`activeIndex` (controlled) also drives scroll position** — setting it calls `scrollIntoView({ block: "start" })` on that item, so it's bidirectional: user scrolling updates it via `onActiveIndexChange`, and setting it programmatically scrolls the view.
- **`defaultActiveIndex` (uncontrolled) only scrolls once, on mount.** Changing it after mount has no further effect — if you need ongoing programmatic control, use `activeIndex` instead.
- **`itemClassName` needs `height: 100%`** in your CSS alongside the container's bounded height, so each slide occupies exactly one full "page" of the scroll-snap container (again, see `apps/web/src/app.css`'s `.reel-item { height: 100%; }`).

## Headless styling rules (applies to all three components)

- These components ship **zero** visual design: no colors, fonts, borders, shadows, or spacing decisions anywhere in `packages/media-ui-react/src`.
- The **consumer app owns all CSS** — via `className`/`itemClassName`/`backdropClassName` props, and via the documented `data-media-grid`, `data-media-grid-item`, `data-reel-swiper`, `data-reel-swiper-item`, `data-active` attribute hooks.
- The **only** exception is functional-not-visual CSS the components need to actually work at all: `MediaGrid`'s sentinel positioning is invisible/`aria-hidden`, and `ReelSwiper`'s `overflow`/`scroll-snap-*` rules are load-bearing for its one stated behavior (vertical paging) — not a style choice.
- **Do not reimplement functional behavior these components already provide.** No custom `IntersectionObserver` for grid pagination or reel active-detection, no custom focus-trap/Escape-key handling for a lightbox, no custom scroll-snap math — the components already do all of this; wire their props instead.

## Accessibility expectations

- `MediaGrid`: `role="list"` / `role="listitem"` on the wrappers. Any interactive element you render inside `renderItem` (e.g. a `<button>` to open the lightbox) needs its own accessible label — the grid itself supplies none.
- `MediaLightbox`: `role="dialog"`, `aria-modal="true"`, full Tab focus trap, focus restoration on close, Escape-to-close. Pass `labelledBy`/`describedBy` when you have a real heading/description element to point at.
- `ReelSwiper`: ships no ARIA roles of its own beyond what `renderItem` provides — treat each item's accessible markup (labels, `alt` text, video captions) as the app's responsibility, same as any other `renderItem`-driven component.

## Common mistakes an AI agent must avoid

1. **Adding an import from `media-core`/`media-react`/`media-native` inside `packages/media-ui-react/src`.** Never — this breaks the package's core guarantee of independence.
2. **Writing a custom `IntersectionObserver` in the app for grid pagination or reel active-detection.** Both components already do this internally — use `onLoadMore`/`hasMore`/`loading` and `onActiveIndexChange` instead.
3. **Supplying a custom `renderContent` for `MediaLightbox` "because video needs one."** It doesn't — the default handles both photo and video already. Only customize for layout/UX reasons.
4. **Forgetting `ReelSwiper` needs a bounded-height `className`.** Without it, nothing scrolls or snaps — and there's no prop to set height directly, it's CSS-only.
5. **Using raw `item.id` as a list `key`.** The components' own default key is `${item.type}-${item.id}` specifically to avoid photo/video id collisions — don't downgrade to plain `id` when overriding `getKey`.
6. **Expecting these components to fetch, cache, or know about pagination state beyond what's passed in.** They are pure render/behavior — all state comes from props, always supplied by the app (via `media-react` hooks).
7. **Inventing props that don't exist** (e.g. a `height` prop on `ReelSwiper`, a `poster` prop on `MediaLightbox`'s default video, built-in "next/previous" buttons). If it's not in the prop interface above, it isn't supported — say so rather than guessing.

## Concrete examples (actual patterns from `apps/web`)

**MediaGrid**, from `apps/web/src/components/PhotoSearch.tsx`:
```tsx
<MediaGrid
  items={allPhotos}
  className="media-grid"
  renderItem={(item) => (
    <button type="button" className="grid-item" onClick={() => onSelect(item)} aria-label={item.alt || "View photo"}>
      <img src={item.src.medium} alt={item.alt || ""} loading="lazy" />
    </button>
  )}
  onLoadMore={handleLoadMore}
  hasMore={Boolean(pagination?.nextPage)}
  loading={loading}
  renderLoadingIndicator={() => <p className="loading-text">Loading…</p>}
/>
```

**MediaLightbox**, from `apps/web/src/components/MediaViewer.tsx` (relying on the built-in default renderer):
```tsx
<MediaLightbox
  item={item}
  open={open}
  onClose={onClose}
  className="lightbox"
  backdropClassName="lightbox-backdrop"
/>
```

**ReelSwiper**, from `apps/web/src/components/ReelView.tsx`:
```tsx
<ReelSwiper
  items={videos}
  className="reel-viewport"
  itemClassName="reel-item"
  onActiveIndexChange={(index) => setActiveIndex(index)}
  renderItem={(item, _index, isActive) => (
    <div className="reel-item-content">
      <video src={item.videoFiles[0]?.link} className="reel-video" muted playsInline controls autoPlay={isActive} />
      {item.photographer && <p className="reel-caption">by {item.photographer}</p>}
    </div>
  )}
/>
```
```css
.reel-viewport { height: 70vh; }  /* required bounded height */
.reel-item { height: 100%; }      /* required for one item per "page" */
```

## Do / Don't

**Do**
- Treat `renderItem`/`renderContent` as the only place visuals are decided.
- Use the documented `data-*` attributes and `className` props for layout/styling.
- Give `ReelSwiper` a bounded-height `className` and matching `itemClassName` height.
- Rely on `MediaLightbox`'s default photo/video rendering unless you have a real customization need.
- Let `onLoadMore`/`hasMore`/`loading` and `onActiveIndexChange` be the entire integration surface for pagination/active-item logic.

**Don't**
- Don't import anything from `@fotoowl/media-core`, `@fotoowl/media-react`, or `@fotoowl/media-native` inside `packages/media-ui-react`.
- Don't add colors, fonts, spacing, or any visual design inside `packages/media-ui-react/src`.
- Don't write a second `IntersectionObserver`, focus trap, or scroll-snap implementation in the app — these components already do it.
- Don't invent props (`height`, `poster`, built-in next/previous buttons) that aren't in the interfaces above.

## Repository-specific rules

- **Allowed to consume:** only `@fotoowl/media-ui-react`'s package-root export (`MediaGrid`, `MediaLightbox`, `ReelSwiper`, and the `MediaItem`/`PhotoMediaItem`/`VideoMediaItem`/`MediaType` types). Nothing from `packages/media-ui-react/src/internal/*` is exported and none of it should be imported directly.
- **Must never import or modify:** `@fotoowl/media-core`, `@fotoowl/media-react`, `@fotoowl/media-native`, or any Pexels/network/API logic — from *within* `packages/media-ui-react`. (The consuming *app* is free to import `media-react` separately, as `apps/web` does — the independence rule applies to `media-ui-react` itself, not to apps that use both packages side by side.)
- **Where application-specific logic belongs:** all data-fetching, pagination accumulation, selected-item state, and event tracking belong in the app (see `media-data-wiring`) and are threaded into these components purely as props. `packages/media-ui-react` never changes based on which API or app is using it.
