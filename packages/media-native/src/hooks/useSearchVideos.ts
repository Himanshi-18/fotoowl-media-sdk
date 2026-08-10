import { useCallback } from "react";
import type { MediaSearchParams, Pagination, VideoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaMutation } from "./internal";

export interface UseSearchVideosResult {
  videos: VideoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  search: (params: MediaSearchParams) => Promise<void>;
  reset: () => void;
}

/** Imperative video search — call `search(params)` (e.g. on submit) to trigger a request. */
export function useSearchVideos(): UseSearchVideosResult {
  const core = useMediaCore();
  const runSearch = useCallback((params: MediaSearchParams) => core.searchVideos(params), [core]);
  const { data, loading, error, run, reset } = useMediaMutation(runSearch);

  const search = useCallback(
    async (params: MediaSearchParams) => {
      await run(params);
    },
    [run]
  );

  return { videos: data?.items ?? [], pagination: data?.pagination, loading, error, search, reset };
}
