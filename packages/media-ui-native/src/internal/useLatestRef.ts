import { useRef } from "react";

/**
 * Keeps a ref updated with the latest value on every render, so a stable
 * callback (e.g. one passed to FlatList's `onViewableItemsChanged`, which
 * RN forbids changing identity across renders) can still read fresh state.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
