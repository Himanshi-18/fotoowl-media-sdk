import type { ReactNode } from "react";
import type { MediaItem } from "../types";
import { useInfiniteScrollSentinel } from "../internal/useInfiniteScrollSentinel";

export interface MediaGridProps<T extends MediaItem = MediaItem> {
  /** Media items to render. Photos and videos may be mixed freely. */
  items: T[];
  /** Renders a single item's visuals. Owns all styling — this package ships none. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Defaults to `${item.type}-${item.id}` — photo and video ids are independent sequences and can collide on raw `id` alone. */
  getKey?: (item: T) => string | number;
  /** Called (at most once per threshold crossing) when the load-more sentinel becomes visible. */
  onLoadMore?: () => void;
  /** Whether more items exist to load. The sentinel only renders/observes while true. */
  hasMore?: boolean;
  /** Suppresses new `onLoadMore` calls while a fetch is already in flight. */
  loading?: boolean;
  /** How far from the viewport edge the sentinel triggers `onLoadMore`. Passed to IntersectionObserver's rootMargin. */
  loadMoreRootMargin?: string;
  /** Wrapper element tag. Defaults to "div". */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  renderLoadingIndicator?: () => ReactNode;
}

/**
 * Headless grid: renders `items` via `renderItem` and drives load-more /
 * infinite-scroll purely through the `onLoadMore` callback. Has no knowledge
 * of any API — pagination state and fetching are entirely the caller's job.
 */
export function MediaGrid<T extends MediaItem = MediaItem>({
  items,
  renderItem,
  getKey = (item) => `${item.type}-${item.id}`,
  onLoadMore,
  hasMore = false,
  loading = false,
  loadMoreRootMargin,
  as = "div",
  className,
  renderLoadingIndicator,
}: MediaGridProps<T>) {
  const Container = as;
  const canLoadMore = Boolean(onLoadMore) && hasMore && !loading;

  const sentinelRef = useInfiniteScrollSentinel({
    enabled: canLoadMore,
    onLoadMore: () => onLoadMore?.(),
    rootMargin: loadMoreRootMargin,
  });

  return (
    <Container className={className} role="list" data-media-grid="">
      {items.map((item, index) => (
        <div role="listitem" key={getKey(item)} data-media-grid-item="">
          {renderItem(item, index)}
        </div>
      ))}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" data-media-grid-sentinel="" />}
      {loading ? renderLoadingIndicator?.() ?? null : null}
    </Container>
  );
}
