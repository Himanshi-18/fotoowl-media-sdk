# `MediaGrid`

Available from both `@fotoowl/media-ui-react` and `@fotoowl/media-ui-native`. Same purpose — render a list of media items with load-more/infinite-scroll — different underlying primitives and slightly different prop names.

## Props

### Web (`@fotoowl/media-ui-react`)

```ts
interface MediaGridProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;   // required
  getKey?: (item: T) => string | number;                // default: `${item.type}-${item.id}`
  onLoadMore?: () => void;
  hasMore?: boolean;                                    // default: false
  loading?: boolean;                                     // default: false
  loadMoreRootMargin?: string;                            // IntersectionObserver rootMargin, default "200px"
  as?: keyof JSX.IntrinsicElements;                        // wrapper tag, default "div"
  className?: string;
  renderLoadingIndicator?: () => ReactNode;
}
```

### Native (`@fotoowl/media-ui-native`)

```ts
interface MediaGridProps<T extends MediaItem = MediaItem> {
  items: T[];
  renderItem: (item: T, index: number) => ReactElement | null;  // required
  keyExtractor?: (item: T, index: number) => string;             // default: `${item.type}-${item.id}`
  onLoadMore?: () => void;
  hasMore?: boolean;                                             // default: false
  loading?: boolean;                                              // default: false
  onEndReachedThreshold?: number;                                  // FlatList concept, default 0.5
  numColumns?: number;
  ListFooterComponent?: ReactElement | null;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
```

The prop naming difference (`getKey` vs. `keyExtractor`, `loadMoreRootMargin` vs. `onEndReachedThreshold`) is deliberate — each matches its own platform's existing vocabulary (`FlatList.keyExtractor`/`onEndReachedThreshold` are RN's own prop names) rather than forcing an artificial shared API.

## `renderItem` contract

**Required on both platforms** — neither component has default visual output. `renderItem(item, index)` (web) / `renderItem(item, index)` (native, returning `ReactElement | null` specifically, since `FlatList.renderItem` requires that return type) is the only place visuals come from.

## Generic typing

Both are generic: `<MediaGrid<PhotoMedia> items={photos} renderItem={(item) => ...} />` types `item` inside `renderItem` as `PhotoMedia`, not the broader `MediaItem` union.

## `onLoadMore` / `hasMore` / `loading`

Same contract on both platforms:
- `onLoadMore` fires when the user approaches the end of the list.
- It only fires while `hasMore` is `true` **and** `loading` is `false` **and** `onLoadMore` is actually provided.
- Setting `loading: true` while a request is in flight is what prevents duplicate `onLoadMore` calls — the app is responsible for setting it correctly (from the data-layer hook's own `loading` value).

**Web mechanism**: an invisible sentinel `<div>` (rendered only while `hasMore` is `true`) observed by `IntersectionObserver`; calls `onLoadMore()` once when it scrolls into view (per `rootMargin`).

**Native mechanism**: `FlatList`'s built-in `onEndReached`, debounced by an internal ref flag that re-arms on `onMomentumScrollBegin` (guards against `FlatList` occasionally firing `onEndReached` more than once for the same scroll position).

## Key behavior

Both default to `` `${item.type}-${item.id}` ``, not raw `id` — Pexels photo and video ids are independent numeric sequences and can collide when a grid mixes both media types. Override via `getKey` (web) / `keyExtractor` (native) if you have your own guaranteed-unique key.

## Platform differences

| | Web | Native |
|---|---|---|
| Underlying primitive | Plain `<div>`s | `FlatList` |
| Styling hooks | `className` + `data-media-grid`/`data-media-grid-item` attributes | `style`/`contentContainerStyle` (`StyleProp<ViewStyle>`) |
| Loading indicator | `renderLoadingIndicator` render prop | `ListFooterComponent` element |
| Grid columns | Not built in — caller controls via CSS (`grid-template-columns`, etc.) | `numColumns` — `FlatList`'s own native grid support |
| Wrapper tag | `as` prop (default `"div"`) | N/A — always `FlatList` |
| Load-more distance | `loadMoreRootMargin` (CSS-margin-like string, default `"200px"`) | `onEndReachedThreshold` (fraction of visible list length, default `0.5`) |

## Web-only DOM structure

The web version renders `<Container role="list" data-media-grid>` wrapping `<div role="listitem" data-media-grid-item>{renderItem(...)}</div>` per item — style via `className` + the `data-media-grid-item` attribute selector, as `apps/web/src/app.css` does:

```css
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.media-grid [data-media-grid-item] { aspect-ratio: 1; overflow: hidden; }
```

## Example (web, from `apps/web/src/components/PhotoSearch.tsx`)

```tsx
<MediaGrid
  items={allPhotos}
  className="media-grid"
  renderItem={(item) => (
    <button onClick={() => onSelect(item)}>
      <img src={item.src.medium} alt={item.alt || ""} loading="lazy" />
    </button>
  )}
  onLoadMore={handleLoadMore}
  hasMore={Boolean(pagination?.nextPage)}
  loading={loading}
  renderLoadingIndicator={() => <p>Loading…</p>}
/>
```

## Related docs

[`media-ui-react.md`](media-ui-react.md) · [`media-ui-native.md`](media-ui-native.md) · [`headless-contract.md`](headless-contract.md) · [`../sdk/usage.md`](../sdk/usage.md)
