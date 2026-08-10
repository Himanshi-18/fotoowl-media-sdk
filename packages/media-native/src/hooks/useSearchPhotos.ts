import { useCallback } from "react";
import type { MediaSearchParams, Pagination, PhotoMedia } from "@fotoowl/media-core";
import { useMediaCore } from "./useMediaCore";
import { useMediaMutation } from "./internal";

export interface UseSearchPhotosResult {
  photos: PhotoMedia[];
  pagination: Pagination | undefined;
  loading: boolean;
  error: Error | undefined;
  search: (params: MediaSearchParams) => Promise<void>;
  reset: () => void;
}

/** Imperative photo search — call `search(params)` (e.g. on submit) to trigger a request. */
export function useSearchPhotos(): UseSearchPhotosResult {
  const core = useMediaCore();
  const runSearch = useCallback((params: MediaSearchParams) => core.searchPhotos(params), [core]);
  const { data, loading, error, run, reset } = useMediaMutation(runSearch);

  const search = useCallback(
    async (params: MediaSearchParams) => {
      await run(params);
    },
    [run]
  );

  return { photos: data?.items ?? [], pagination: data?.pagination, loading, error, search, reset };
}
