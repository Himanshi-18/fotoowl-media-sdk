import { useEffect, useRef } from "react";
import type { MediaSDKEvents } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";

/**
 * Subscribes to a `MediaCore` event (`"download"` | `"view"`) for the
 * lifetime of the component. The listener is always the latest closure
 * passed in, but re-subscribing only happens if `event` or the client change.
 */
export function useMediaEvent<K extends keyof MediaSDKEvents>(
  event: K,
  listener: (payload: MediaSDKEvents[K]) => void
): void {
  const core = useMediaCore();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    return core.events.on(event, (payload) => listenerRef.current(payload));
  }, [core, event]);
}
