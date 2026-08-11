# `MediaLightbox`

Available from both `@fotoowl/media-ui-react` and `@fotoowl/media-ui-native`. Same purpose — a controlled, single-item full-view overlay — built on each platform's native modal primitive.

## Props

### Web (`@fotoowl/media-ui-react`)

```ts
interface MediaLightboxProps<T extends MediaItem = MediaItem> {
  item: T | null | undefined;
  open: boolean;                        // required — fully controlled
  onClose: () => void;                   // required
  onNext?: () => void;
  onPrevious?: () => void;
  renderContent?: (item: T) => ReactNode;
  closeOnBackdropClick?: boolean;         // default: true
  closeOnEscape?: boolean;                 // default: true
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  backdropClassName?: string;
}
```

### Native (`@fotoowl/media-ui-native`)

```ts
interface MediaLightboxProps<T extends MediaItem = MediaItem> {
  item: T | null | undefined;
  open: boolean;                        // required — fully controlled
  onClose: () => void;                   // required
  renderContent?: (item: T) => ReactElement | null;
  closeOnBackdropPress?: boolean;         // default: true
  animationType?: "none" | "slide" | "fade"; // default: "fade"
  statusBarTranslucent?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
```

**`onNext`/`onPrevious` exist only on the web version.** They were deliberately not added to the native version: RN has no keyboard to trigger them from, and since `renderContent` only receives `item` (not these callbacks), keeping them would have been dead, unreachable API surface. If you need prev/next navigation in a React Native app, wire it entirely in your own app code (e.g. your own gesture handling calling your own state setters) — this is not supported by `MediaLightbox` itself on native.

## Controlled `open`/`item` usage (both platforms)

Neither version holds its own visibility state. Both render nothing (`null`) whenever `!open || !item`:

```tsx
const [selected, setSelected] = useState<PhotoMedia | VideoMedia | null>(null);

<MediaLightbox item={selected} open={selected !== null} onClose={() => setSelected(null)} />
```

## `onClose`

Required on both. Called when the user dismisses the lightbox — via backdrop press/click, Escape (web), or the platform back mechanism (native, see below). It is the app's job to actually clear `open`/`item` in response; the component does not manage that state itself.

## `renderContent` / default content

Both accept an optional `renderContent(item)` to fully customize what's displayed. Both have a **default renderer** used when `renderContent` is omitted:

| | Web default | Native default |
|---|---|---|
| Photo | `<img src={item.src.large} alt={item.alt ?? ""} />` | `<Image source={{ uri: item.src.large }} accessibilityLabel={item.alt} resizeMode="contain" />` |
| Video | `<video src={item.videoFiles[0].link} controls autoPlay muted />` | **Not rendered — returns `null`.** RN has no built-in video element; supply `renderContent` with whichever video library your app depends on (e.g. `react-native-video`, `expo-av`) to render video items on native. This package intentionally does not bundle one. |

**This is the single most important web/native difference for this component**: on web, video "just works" without any extra setup. On native, video display requires the app to supply `renderContent`.

## Close behavior

- **Web**: backdrop click closes only when the click originates exactly on the backdrop element (`event.target === event.currentTarget`), not a bubbled click from inside the rendered content — so clicking inside the displayed media never accidentally closes it. Controlled by `closeOnBackdropClick` (default `true`).
- **Native**: backdrop `Pressable`'s `onPress` calls `onClose`; the content is wrapped in its own inner `Pressable` with a no-op `onPress` that "swallows" the touch (RN has no `stopPropagation`, so an inner `Pressable` claiming the touch is the idiomatic equivalent). Controlled by `closeOnBackdropPress` (default `true`).

## Keyboard / back-button differences

| | Web | Native |
|---|---|---|
| Dismiss gesture | `Escape` key (when `closeOnEscape` is true, default) | RN `Modal`'s `onRequestClose` — fires on Android hardware back button (and Apple TV menu button); this is RN's own documented mechanism, not custom code |
| Item navigation | `ArrowRight`/`ArrowLeft` call `onNext`/`onPrevious`, **suppressed** when focus is inside an interactive/text-entry element (`input`, `textarea`, `select`, `contentEditable`) from your `renderContent` | Not supported (no `onNext`/`onPrevious` props exist on native — see above) |

## Accessibility behavior

See [`accessibility.md`](accessibility.md) for the full, verified breakdown. Summary:
- **Web**: `role="dialog"`, `aria-modal="true"`, a genuine Tab focus trap (first focusable element or the dialog container receives focus on open, focus restores to whatever was focused before on close — implemented via a callback ref so it correctly engages even if `item` arrives asynchronously after `open` was already `true`), optional `aria-labelledby`/`aria-describedby` pass-through via `labelledBy`/`describedBy`.
- **Native**: `accessibilityViewIsModal` on the content `Pressable` — the RN/VoiceOver equivalent of restricting screen-reader navigation to the modal (there is no Tab order on mobile, so there is no literal "focus trap"). `accessibilityRole="button"` + `accessibilityLabel` (default `"Close"`, overridable) on the backdrop.

## Example (web, from `apps/web/src/components/MediaViewer.tsx`)

```tsx
<MediaLightbox
  item={item}
  open={open}
  onClose={onClose}
  className="lightbox"
  backdropClassName="lightbox-backdrop"
/>
```
No `renderContent` supplied — the default already handles both photo and video for this app.

## Related docs

[`media-ui-react.md`](media-ui-react.md) · [`media-ui-native.md`](media-ui-native.md) · [`accessibility.md`](accessibility.md) · [`headless-contract.md`](headless-contract.md)
