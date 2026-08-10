import { useCallback } from "react";
import type { VideoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaQuery } from "./internal";

export interface UseVideoResult {
  video: VideoMedia | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/** Fetches a single video by id. Pass `undefined` to skip fetching (e.g. before an id is known). */
export function useVideo(id: number | undefined): UseVideoResult {
  const core = useMediaCore();
  const enabled = id !== undefined;
  const fetcher = useCallback(() => core.getVideo(id as number), [core, id]);
  const { data, loading, error, refetch } = useMediaQuery(fetcher, [core, id], enabled);

  return { video: data, loading, error, refetch };
}
