import { useCallback, useEffect, useState } from "react";
import { useSearchPhotos } from "@fotoowl/media-react";
import type { PhotoMedia } from "@fotoowl/media-core";
import { MediaGrid } from "@fotoowl/media-ui-react";
import { SearchBar } from "./SearchBar";

const PER_PAGE = 20;

export interface PhotoSearchProps {
  onSelect: (item: PhotoMedia) => void;
}

/**
 * Demonstrates: useSearchPhotos (imperative search), MediaGrid's
 * onLoadMore/hasMore/loading pagination contract, and loading/error/empty
 * states — all driven by @fotoowl/media-react + @fotoowl/media-core, no
 * fetch/Pexels logic here.
 */
export function PhotoSearch({ onSelect }: PhotoSearchProps) {
  const { photos, pagination, loading, error, search } = useSearchPhotos();
  const [query, setQuery] = useState("");
  const [allPhotos, setAllPhotos] = useState<PhotoMedia[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // useSearchPhotos returns one page per call; the app accumulates pages
  // itself. A fresh (page 1) result replaces the list, a load-more (page >1)
  // result appends to it.
  useEffect(() => {
    if (photos.length === 0) return;
    setAllPhotos((prev) => (pagination?.page === 1 ? photos : [...prev, ...photos]));
  }, [photos, pagination?.page]);

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
      <SearchBar placeholder="Search photos…" onSubmit={handleSubmit} disabled={loading} />

      {!hasSearched && <p className="hint-text">Try searching for “mountains”, “coffee”, or “ocean”.</p>}
      {error && (
        <p role="alert" className="error-text">
          {error.message}
        </p>
      )}
      {!loading && hasSearched && allPhotos.length === 0 && !error && <p>No photos found for “{query}”.</p>}

      <MediaGrid
        items={allPhotos}
        className="media-grid"
        renderItem={(item) => (
          <button type="button" className="grid-item" onClick={() => onSelect(item)} aria-label={item.alt || "View photo"}>
            <img src={item.src.medium} alt={item.alt || ""} loading="lazy" />
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
