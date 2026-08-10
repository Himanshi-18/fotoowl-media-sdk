import { useContext } from "react";
import type { MediaCore } from "@fotoowl/media-core";
import { MediaCoreContext } from "../MediaProvider";

/** Accesses the `MediaCore` instance provided by the nearest `MediaProvider`. */
export function useMediaCore(): MediaCore {
  const client = useContext(MediaCoreContext);
  if (!client) {
    throw new Error("useMediaCore must be used within a <MediaProvider>.");
  }
  return client;
}
