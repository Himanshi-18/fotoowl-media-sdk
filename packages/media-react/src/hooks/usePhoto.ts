import { useCallback } from "react";
import type { PhotoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaQuery } from "./internal";

export interface UsePhotoResult {
  photo: PhotoMedia | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/** Fetches a single photo by id. Pass `undefined` to skip fetching (e.g. before an id is known). */
export function usePhoto(id: number | undefined): UsePhotoResult {
  const core = useMediaCore();
  const enabled = id !== undefined;
  const fetcher = useCallback(() => core.getPhoto(id as number), [core, id]);
  const { data, loading, error, refetch } = useMediaQuery(fetcher, [core, id], enabled);

  return { photo: data, loading, error, refetch };
}
