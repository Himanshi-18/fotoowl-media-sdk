import { useCallback, useEffect, useState } from "react";
import { useSearchVideos } from "@fotoowl/media-react";
import type { VideoMedia } from "@fotoowl/media-core";
import { MediaGrid } from "@fotoowl/media-ui-react";
import { SearchBar } from "./SearchBar";

const PER_PAGE = 20;

export interface VideoSearchProps {
  onSelect: (item: VideoMedia) => void;
}

/**
 * Same shape as PhotoSearch, using useSearchVideos + MediaGrid. Grid tiles
 * render a muted, inline video preview rather than a poster image — the
 * SDK's VideoMedia type doesn't include a thumbnail URL, and packages/* are
 * off-limits for this phase, so this works with the data actually returned.
 */
export function VideoSearch({ onSelect }: VideoSearchProps) {
  const { videos, pagination, loading, error, search } = useSearchVideos();
  const [query, setQuery] = useState("");
  const [allVideos, setAllVideos] = useState<VideoMedia[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (videos.length === 0) return;
    setAllVideos((prev) => (pagination?.page === 1 ? videos : [...prev, ...videos]));
  }, [videos, pagination?.page]);

  const runSearch = useCallback(
    (nextQuery: string, page: number) => search({ query: nextQuery, page, perPage: PER_PAGE }),
    [search]
  );

  function handleSubmit(submittedQuery: string) {
    setQuery(submittedQuery);
    setHasSearched(true);
    void runSearch(submittedQuery, 1);
  }

  function handleLoadMore() {
    void runSearch(query, (pagination?.page ?? 1) + 1);
  }

  const hasMore = Boolean(pagination?.nextPage);

  return (
    <section>
      <SearchBar placeholder="Search videos…" onSubmit={handleSubmit} disabled={loading} />

      {!hasSearched && <p className="hint-text">Try searching for “waves”, “city”, or “forest”.</p>}
      {error && (
        <p role="alert" className="error-text">
          {error.message}
        </p>
      )}
      {!loading && hasSearched && allVideos.length === 0 && !error && <p>No videos found for “{query}”.</p>}

      <MediaGrid
        items={allVideos}
        className="media-grid"
        renderItem={(item) => (
          <button type="button" className="grid-item" onClick={() => onSelect(item)} aria-label="View video">
            <video src={item.videoFiles[0]?.link} muted playsInline preload="metadata" className="grid-video" />
          </button>
        )}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        renderLoadingIndicator={() => <p className="loading-text">Loading…</p>}
      />
    </section>
  );
}
