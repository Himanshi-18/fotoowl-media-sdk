import { useCallback } from "react";
import type { MediaListParams, Pagination, PhotoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaQuery } from "./internal";

export interface UseCuratedPhotosResult {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/** Auto-fetches curated (trending) photos on mount and whenever `page`/`perPage` change. */
export function useCuratedPhotos(params: MediaListParams = {}): UseCuratedPhotosResult {
  const core = useMediaCore();
  const { page, perPage } = params;
  const fetcher = useCallback(() => core.curatedPhotos({ page, perPage }), [core, page, perPage]);
  const { data, loading, error, refetch } = useMediaQuery(fetcher, [core, page, perPage]);

  return { photos: data?.items ?? [], pagination: data?.pagination, loading, error, refetch };
}
