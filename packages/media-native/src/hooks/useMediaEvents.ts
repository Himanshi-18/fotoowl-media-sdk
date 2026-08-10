import type { EventEmitter, MediaSDKEvents } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";

/** Escape hatch: returns the raw `EventEmitter` for manual `on`/`off` subscription management. */
export function useMediaEvents(): EventEmitter<MediaSDKEvents> {
  return useMediaCore().events;
}
