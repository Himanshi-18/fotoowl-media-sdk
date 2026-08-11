import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";
import type { MediaItem } from "../types";
import { useLatestRef } from "../internal/useLatestRef";

// Functional layout only — no color/typography/spacing decisions.
const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export interface ReelSwiperProps<T extends MediaItem = MediaItem> {
  items: T[];
  /** Renders a single item; `isActive` reflects the current active/most-visible item. */
  renderItem: (item: T, index: number, isActive: boolean) => ReactElement | null;
  /** Defaults to `${item.type}-${item.id}` — photo and video ids are independent sequences and can collide on raw `id` alone. */
  keyExtractor?: (item: T, index: number) => string;
  /**
   * Controlled active index. When provided, this component also scrolls the
   * corresponding item into view (`FlatList.scrollToIndex`) whenever it
   * changes. Detection from the user's own swiping still happens
   * independently via `onViewableItemsChanged` and is reported through
   * `onActiveIndexChange`.
   */
  activeIndex?: number;
  /** Uncontrolled initial active index. Scrolled to once via FlatList's `initialScrollIndex`; has no effect after that. */
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number, item: T) => void;
  /** Visibility ratio (0-1) an item must reach to be considered active. */
  activeThreshold?: number;
  testID?: string;
}

/**
 * Headless vertical paging swiper (reel/story style) built on RN's
 * `FlatList` with `pagingEnabled`. Each item is sized to exactly fill the
 * swiper's own measured height (via `onLayout` — no hardcoded `Dimensions`
 * lookup, so it works correctly regardless of parent layout, split-screen,
 * or orientation). The swiper's parent must give it bounded space to
 * measure (e.g. `flex: 1` inside a sized container) — this component itself
 * ships no dimensions.
 *
 * Active-item detection uses FlatList's `onViewableItemsChanged` +
 * `viewabilityConfig`, RN's native-bridge-backed equivalent of the web
 * IntersectionObserver approach. Has no knowledge of any API.
 */
export function ReelSwiper<T extends MediaItem = MediaItem>({
  items,
  renderItem,
  keyExtractor = (item) => `${item.type}-${item.id}`,
  activeIndex: controlledActiveIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  activeThreshold = 0.6,
  testID,
}: ReelSwiperProps<T>) {
  const [uncontrolledActiveIndex, setUncontrolledActiveIndex] = useState(defaultActiveIndex);
  const isControlled = controlledActiveIndex !== undefined;
  const activeIndex = isControlled ? controlledActiveIndex : uncontrolledActiveIndex;

  const [containerHeight, setContainerHeight] = useState(0);
  const flatListRef = useRef<FlatList<T>>(null);

  const isControlledRef = useLatestRef(isControlled);
  const itemsRef = useLatestRef(items);
  const onActiveIndexChangeRef = useLatestRef(onActiveIndexChange);

  // FlatList forbids changing onViewableItemsChanged/viewabilityConfig
  // identity across renders, so both are created once via refs; the
  // callback reads fresh state through the latest-value refs above.
  const handleViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (!first || first.index == null) return;
    const index = first.index;
    if (!isControlledRef.current) setUncontrolledActiveIndex(index);
    const item = itemsRef.current[index];
    if (item) onActiveIndexChangeRef.current?.(index, item);
  });
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: Math.round(activeThreshold * 100) });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const getItemLayout =
    containerHeight > 0
      ? (_data: ArrayLike<T> | null | undefined, index: number) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })
      : undefined;

  const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    // Documented RN workaround: retry once layout has settled instead of
    // letting FlatList throw for an index it can't yet measure.
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
    });
  }, []);

  useEffect(() => {
    if (!isControlled || containerHeight === 0) return;
    flatListRef.current?.scrollToIndex({ index: controlledActiveIndex, animated: true });
  }, [isControlled, controlledActiveIndex, containerHeight]);

  return (
    <View style={styles.fill} onLayout={handleLayout} testID={testID}>
      {containerHeight > 0 && (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={keyExtractor}
          renderItem={({ item, index }: ListRenderItemInfo<T>) => (
            <View style={{ height: containerHeight }}>{renderItem(item, index, index === activeIndex)}</View>
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChangedRef.current}
          viewabilityConfig={viewabilityConfigRef.current}
          getItemLayout={getItemLayout}
          initialScrollIndex={defaultActiveIndex > 0 ? defaultActiveIndex : undefined}
          onScrollToIndexFailed={handleScrollToIndexFailed}
        />
      )}
    </View>
  );
}
