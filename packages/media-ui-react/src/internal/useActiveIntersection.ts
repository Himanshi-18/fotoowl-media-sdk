import { useEffect, useRef } from "react";

export interface UseActiveIntersectionOptions {
  itemCount: number;
  onActiveChange: (index: number) => void;
  threshold?: number;
}

/**
 * Tracks which child of a scroll container is most visible and reports its
 * index. Used to detect the "active" item in a snap-scrolling list.
 */
export function useActiveIntersection({ itemCount, onActiveChange, threshold = 0.6 }: UseActiveIntersectionOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const setItemRef = (index: number) => (node: HTMLElement | null) => {
    itemRefs.current[index] = node;
  };

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = -1;
        let bestRatio = 0;
        itemRefs.current.forEach((node, index) => {
          if (!node) return;
          const ratio = ratios.get(node) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        if (bestIndex !== -1 && bestRatio >= threshold) {
          onActiveChangeRef.current(bestIndex);
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    );

    itemRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [itemCount, threshold]);

  return { containerRef, setItemRef };
}
