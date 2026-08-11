import { useCallback, useRef, type ReactElement } from "react";
import { FlatList, type ListRenderItemInfo, type StyleProp, type ViewStyle } from "react-native";
import type { MediaItem } from "../types";

export interface MediaGridProps<T extends MediaItem = MediaItem> {
  /** Media items to render. Photos and videos may be mixed freely. */
  items: T[];
  /** Renders a single item's visuals. Owns all styling — this package ships none. */
  renderItem: (item: T, index: number) => ReactElement | null;
  /** Defaults to `${item.type}-${item.id}` — photo and video ids are independent sequences and can collide on raw `id` alone. */
  keyExtractor?: (item: T, index: number) => string;
  /** Called when the list is scrolled within `onEndReachedThreshold` of the end. */
  onLoadMore?: () => void;
  /** Whether more items exist to load. `onLoadMore` is only wired up while true. */
  hasMore?: boolean;
  /** Suppresses further `onLoadMore` calls while a fetch is already in flight. */
  loading?: boolean;
  /** Distance from the end (as a fraction of visible list length) that triggers `onEndReached`. FlatList's own concept, passed straight through. */
  onEndReachedThreshold?: number;
  /** Number of columns — pass-through to FlatList's own grid support. */
  numColumns?: number;
  /** Rendered below the list, e.g. a loading spinner while `loading` is true. Fully caller-controlled. */
  ListFooterComponent?: ReactElement | null;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Headless grid: renders `items` via `renderItem` using React Native's
 * `FlatList`, and drives load-more / infinite-scroll purely through the
 * `onLoadMore` callback (backed by FlatList's native `onEndReached`). Has no
 * knowledge of any API — pagination state and fetching are entirely the
 * caller's job.
 */
export function MediaGrid<T extends MediaItem = MediaItem>({
  items,
  renderItem,
  keyExtractor = (item) => `${item.type}-${item.id}`,
  onLoadMore,
  hasMore = false,
  loading = false,
  onEndReachedThreshold = 0.5,
  numColumns,
  ListFooterComponent,
  style,
  contentContainerStyle,
  testID,
}: MediaGridProps<T>) {
  const canLoadMore = Boolean(onLoadMore) && hasMore && !loading;
  // FlatList can invoke onEndReached more than once for the same "end of
  // list" position (e.g. on re-render); this ref debounces it to one call
  // per approach, re-armed once the user scrolls away from the end.
  const hasTriggeredRef = useRef(false);

  const handleEndReached = useCallback(() => {
    if (!canLoadMore || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    onLoadMore?.();
  }, [canLoadMore, onLoadMore]);

  const handleMomentumScrollBegin = useCallback(() => {
    hasTriggeredRef.current = false;
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }: ListRenderItemInfo<T>) => renderItem(item, index)}
      numColumns={numColumns}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onMomentumScrollBegin={handleMomentumScrollBegin}
      ListFooterComponent={ListFooterComponent}
      style={style}
      contentContainerStyle={contentContainerStyle}
      testID={testID}
    />
  );
}
