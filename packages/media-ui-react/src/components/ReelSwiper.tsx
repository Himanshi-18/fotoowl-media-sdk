import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { MediaItem } from "../types";
import { useActiveIntersection } from "../internal/useActiveIntersection";

// Minimal functional CSS required for vertical snap paging to work at all —
// not visual design (no color/spacing/typography). Callers can override via
// className; these inline styles only cover the scroll-snap mechanics.
//
// IMPORTANT: scroll-snap has no effect unless the container has a *bounded*
// height (e.g. `height: 100dvh`, `height: 100%` inside a sized parent, etc.).
// A plain `div` defaults to `height: auto`, which grows to fit its content
// and never scrolls. This component intentionally does not set a height
// itself — pass one via `className` (or a wrapping element) to make vertical
// scrolling/snapping actually happen.
const containerStyle: CSSProperties = { overflowY: "auto", scrollSnapType: "y mandatory" };
const itemStyle: CSSProperties = { scrollSnapAlign: "start" };

function scrollItemIntoView(node: HTMLElement | null | undefined): void {
  if (node && typeof node.scrollIntoView === "function") {
    node.scrollIntoView({ block: "start" });
  }
}

export interface ReelSwiperProps<T extends MediaItem = MediaItem> {
  items: T[];
  /** Renders a single item; `isActive` reflects the current active/most-visible item. */
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode;
  /** Defaults to `${item.type}-${item.id}` — photo and video ids are independent sequences and can collide on raw `id` alone. */
  getKey?: (item: T) => string | number;
  /**
   * Controlled active index. When provided, this component also scrolls the
   * corresponding item into view (`scrollIntoView`) whenever it changes —
   * so it both reflects and drives which item is active. Detection from the
   * user's own scrolling still happens independently via IntersectionObserver
   * and is reported through `onActiveIndexChange`.
   */
  activeIndex?: number;
  /** Uncontrolled initial active index. Scrolls to this item once on mount; has no effect after that. */
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number, item: T) => void;
  /** Visibility ratio (0-1) an item must reach to be considered active. */
  activeThreshold?: number;
  /** Must resolve to a bounded height (see module doc) for snap-scrolling to function. */
  className?: string;
  itemClassName?: string;
}

/**
 * Headless vertical snap-scrolling swiper (reel/story style). Detects the
 * active item via IntersectionObserver and reports changes through
 * `onActiveIndexChange`. Has no knowledge of any API.
 */
export function ReelSwiper<T extends MediaItem = MediaItem>({
  items,
  renderItem,
  getKey = (item) => `${item.type}-${item.id}`,
  activeIndex: controlledActiveIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  activeThreshold = 0.6,
  className,
  itemClassName,
}: ReelSwiperProps<T>) {
  const [uncontrolledActiveIndex, setUncontrolledActiveIndex] = useState(defaultActiveIndex);
  const isControlled = controlledActiveIndex !== undefined;
  const activeIndex = isControlled ? controlledActiveIndex : uncontrolledActiveIndex;
  const itemNodes = useRef<Array<HTMLElement | null>>([]);

  const { containerRef, setItemRef } = useActiveIntersection({
    itemCount: items.length,
    threshold: activeThreshold,
    onActiveChange: (index) => {
      if (!isControlled) setUncontrolledActiveIndex(index);
      const item = items[index];
      if (item) onActiveIndexChange?.(index, item);
    },
  });

  // Scroll to the controlled active index whenever it changes.
  useEffect(() => {
    if (isControlled) scrollItemIntoView(itemNodes.current[controlledActiveIndex]);
  }, [isControlled, controlledActiveIndex]);

  // Scroll to the initial (uncontrolled) active index once on mount only.
  useEffect(() => {
    if (!isControlled && defaultActiveIndex > 0) scrollItemIntoView(itemNodes.current[defaultActiveIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={className} data-reel-swiper="" style={containerStyle}>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          ref={(node) => {
            itemNodes.current[index] = node;
            setItemRef(index)(node);
          }}
          className={itemClassName}
          data-reel-swiper-item=""
          data-active={index === activeIndex ? "true" : "false"}
          style={itemStyle}
        >
          {renderItem(item, index, index === activeIndex)}
        </div>
      ))}
    </div>
  );
}
