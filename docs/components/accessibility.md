# Accessibility

This page documents only what is actually implemented, verified against source. Where a component provides no specific accessibility behavior beyond ordinary semantic markup, that is stated explicitly rather than left implied.

## `MediaLightbox` (web) — dialog semantics and focus behavior

Rendered markup (`packages/media-ui-react/src/components/MediaLightbox.tsx`):
```html
<div data-media-lightbox-backdrop>
  <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} tabIndex={-1} data-media-lightbox>
    ...
  </div>
</div>
```

- `role="dialog"` and `aria-modal="true"` are always present.
- `aria-labelledby`/`aria-describedby` are only set if you pass `labelledBy`/`describedBy` — the component does not generate or assume any heading/description id. Passing an id that doesn't correspond to a real element in your markup produces a dangling ARIA reference; that's on the caller, not the component.
- **Focus trap**: implemented via `useFocusTrap`, an internal (unexported) hook. When open, Tab is trapped within the dialog's focusable descendants (or the dialog container itself, via `tabIndex={-1}`, if there are none). The first focusable element receives focus once the dialog actually mounts — via a callback ref, specifically so this still works if `item` arrives asynchronously after `open` was already `true` (a plain `useRef` + effect-on-`open` would miss that case).
- **Focus restoration**: whatever element had focus immediately before the dialog opened receives focus back once it closes.

## Escape behavior (web)

`closeOnEscape` (default `true`): a `keydown` listener on `document`, active only while `open`, calls `onClose()` on `Escape`. Checked in `MediaLightbox.tsx`; not configurable per-key, only togglable as a whole via `closeOnEscape`.

## Keyboard navigation (web)

`ArrowRight`/`ArrowLeft` call `onNext`/`onPrevious` (if provided) — **but only when focus is not inside a text-entry element**. The component checks `event.target` against `<input>`, `<textarea>`, `<select>`, and `element.isContentEditable` before acting, so arrow keys inside custom form controls in your `renderContent` behave normally (caret movement, `<select>` option changes) instead of being hijacked for navigation.

## `MediaGrid` (web) — list semantics

`role="list"` on the container, `role="listitem"` on each item wrapper. No other ARIA is added — any interactive element inside `renderItem` (e.g. a button that opens the lightbox) needs its own accessible label; the grid supplies none for you.

## `ReelSwiper` (web/native) — no built-in ARIA/accessibility roles

Neither platform's `ReelSwiper` adds any accessibility role or label of its own beyond the plain wrapper elements it renders. Every item's accessible markup (labels, `alt` text, captions) is entirely the responsibility of whatever `renderItem` returns — this is stated explicitly here because it would otherwise be easy to assume parity with `MediaLightbox`'s more built-in behavior.

## Native `MediaLightbox` — `accessibilityViewIsModal` and native back handling

```tsx
<Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? "Close"} ...>  {/* backdrop */}
  <Pressable accessibilityViewIsModal ...>  {/* content */}
```

- **`accessibilityViewIsModal`** is set on the content `Pressable`. This is React Native's/VoiceOver's mechanism for restricting screen-reader (VoiceOver on iOS) navigation to within the modal's subtree — the closest RN equivalent to a web focus trap. There is no Tab key / focus order on mobile touch interfaces, so there is no literal focus-trap implementation on native, and this documentation does not claim one.
- **Backdrop** gets `accessibilityRole="button"` and an `accessibilityLabel` (defaults to `"Close"`, overridable via the `accessibilityLabel` prop — note this same prop is used for both the backdrop's label and, implicitly, is the only accessibility-label prop exposed on the component; there is no separate label prop for the content itself).
- **Native back handling**: RN's `Modal` component's own `onRequestClose` prop is wired to `onClose`. Per RN's documentation, this fires on the Android hardware back button (and the Apple TV menu button) while the modal is visible. This is RN's built-in, standard mechanism — nothing custom was written for it.

## ARIA attributes actually supported — summary table

| Attribute/prop | Component | Platform | Notes |
|---|---|---|---|
| `role="dialog"` | `MediaLightbox` | Web only | Always present when rendering |
| `aria-modal="true"` | `MediaLightbox` | Web only | Always present when rendering |
| `aria-labelledby` | `MediaLightbox` | Web only | Only if `labelledBy` prop is passed |
| `aria-describedby` | `MediaLightbox` | Web only | Only if `describedBy` prop is passed |
| `role="list"` / `role="listitem"` | `MediaGrid` | Web only | Always present |
| `aria-hidden="true"` | `MediaGrid`'s load-more sentinel | Web only | Sentinel is a non-visual implementation detail |
| `accessibilityViewIsModal` | `MediaLightbox` | Native only | Always present when rendering |
| `accessibilityRole="button"` | `MediaLightbox` backdrop | Native only | Always present when rendering |
| `accessibilityLabel` | `MediaLightbox` backdrop, default photo `Image` | Native only | Backdrop defaults to `"Close"`; photo default uses `item.alt` |

## What is explicitly NOT implemented (do not claim otherwise)

- No focus trap on native (mobile has no keyboard-driven focus order to trap).
- No `MediaGrid`/`ReelSwiper` ARIA beyond `role="list"`/`role="listitem"` on web `MediaGrid`; `ReelSwiper` has none on either platform.
- No keyboard navigation support on native (no keyboard).
- No screen-reader announcement of load-more/loading state changes (e.g. no `aria-live` region) in any component.
- No high-contrast, reduced-motion, or other user-preference media-query handling built into any component — these packages ship no CSS/styles to apply such preferences to in the first place (see [`headless-contract.md`](headless-contract.md)); any such handling belongs in the app's own styles.

## Related docs

[`lightbox.md`](lightbox.md) · [`grid.md`](grid.md) · [`headless-contract.md`](headless-contract.md) · [`media-ui-native.md`](media-ui-native.md)
