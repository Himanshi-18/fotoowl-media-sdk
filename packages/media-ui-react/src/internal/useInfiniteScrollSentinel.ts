import { useEffect, useRef } from "react";

export interface UseInfiniteScrollSentinelOptions {
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

/** Observes a sentinel element and invokes `onLoadMore` once when it enters the viewport. */
export function useInfiniteScrollSentinel({
  enabled,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollSentinelOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (!enabled) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
