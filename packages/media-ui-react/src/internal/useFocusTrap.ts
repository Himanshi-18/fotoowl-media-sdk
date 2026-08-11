import { useCallback, useEffect, useRef, useState } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `active`, traps Tab focus within the returned container, focuses its
 * first focusable descendant, and restores focus to the previously focused
 * element on deactivation/unmount.
 *
 * Returns a *callback ref* (not a RefObject) so the trap initializes as soon
 * as the container actually mounts — including when `active` was already
 * true but the container only appears later (e.g. `open` is set before the
 * item it renders has loaded). A plain `useRef` + effect-on-`active` would
 * miss that case, since the effect wouldn't re-run once the node shows up.
 */
export function useFocusTrap(active: boolean) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!active || !container) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (focusables[0] ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [active, container]);

  return containerRef;
}
