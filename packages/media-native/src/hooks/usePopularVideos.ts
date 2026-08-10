import { useCallback } from "react";
import type { MediaListParams, Pagination, VideoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaQuery } from "./internal";

export interface UsePopularVideosResult {
  videos: VideoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/** Auto-fetches popular (trending) videos on mount and whenever `page`/`perPage` change. */
export function usePopularVideos(params: MediaListParams = {}): UsePopularVideosResult {
  const core = useMediaCore();
  const { page, perPage } = params;
  const fetcher = useCallback(() => core.popularVideos({ page, perPage }), [core, page, perPage]);
  const { data, loading, error, refetch } = useMediaQuery(fetcher, [core, page, perPage]);

  return { videos: data?.items ?? [], pagination: data?.pagination, loading, error, refetch };
}
