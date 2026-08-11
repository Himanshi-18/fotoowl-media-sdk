# Usage examples

All examples below are drawn from (or directly mirror) the real implementation in `apps/web/src`. They compile conceptually against the actual public APIs documented in [`media-core.md`](media-core.md), [`media-react.md`](media-react.md), and the component docs under [`../components/`](../components/).

## Create a `MediaCore` instance directly

```ts
import { MediaCore } from "@fotoowl/media-core";

const core = new MediaCore({ apiKey: PEXELS_API_KEY });

const { items, pagination } = await core.searchPhotos({ query: "mountains", page: 1, perPage: 20 });
```

You'd do this outside of React (e.g. in a script, a test, or to share one instance across `media-react` and `media-native`). Inside a React app, prefer `MediaProvider` below.

## `MediaProvider`

```tsx
import { MediaProvider } from "@fotoowl/media-react";

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

function App() {
  if (!API_KEY) return <MissingApiKeyNotice />;
  return (
    <MediaProvider config={{ apiKey: API_KEY }}>
      <Demo />
    </MediaProvider>
  );
}
```

See [`authentication.md`](authentication.md) for why the key check happens before `MediaProvider` is rendered at all.

## Photo search (imperative + `MediaGrid` + pagination)

```tsx
import { useCallback, useEffect, useState } from "react";
import { useSearchPhotos } from "@fotoowl/media-react";
import type { PhotoMedia } from "@fotoowl/media-core";
import { MediaGrid } from "@fotoowl/media-ui-react";

function PhotoSearch() {
  const { photos, pagination, loading, error, search } = useSearchPhotos();
  const [query, setQuery] = useState("");
  const [allPhotos, setAllPhotos] = useState<PhotoMedia[]>([]);

  // useSearchPhotos returns one page per call — accumulate pages ourselves.
  useEffect(() => {
    if (photos.length === 0) return;
    setAllPhotos((prev) => (pagination?.page === 1 ? photos : [...prev, ...photos]));
  }, [photos, pagination?.page]);

  const runSearch = useCallback(
    (q: string, page: number) => search({ query: q, page, perPage: 20 }),
    [search]
  );

  const hasMore = Boolean(pagination?.nextPage);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={() => void runSearch(query, 1)}>Search</button>

      {error && <p>{error.message}</p>}

      <MediaGrid
        items={allPhotos}
        renderItem={(item) => <img src={item.src.medium} alt={item.alt ?? ""} />}
        onLoadMore={() => void runSearch(query, (pagination?.page ?? 1) + 1)}
        hasMore={hasMore}
        loading={loading}
      />
    </>
  );
}
```

Full version with search-bar submission, empty/hint states: `apps/web/src/components/PhotoSearch.tsx`.

## Video search

Identical shape, using `useSearchVideos` and `VideoMedia`:

```tsx
import { useSearchVideos } from "@fotoowl/media-react";
import { MediaGrid } from "@fotoowl/media-ui-react";

const { videos, pagination, loading, error, search } = useSearchVideos();

<MediaGrid
  items={videos}
  renderItem={(item) => <video src={item.videoFiles[0]?.link} muted playsInline preload="metadata" />}
  onLoadMore={() => void search({ query, page: (pagination?.page ?? 1) + 1, perPage: 20 })}
  hasMore={Boolean(pagination?.nextPage)}
  loading={loading}
/>
```

Full version: `apps/web/src/components/VideoSearch.tsx`.

## Curated photos / popular videos (automatic hooks)

```tsx
import { useCuratedPhotos, usePopularVideos } from "@fotoowl/media-react";

const { photos, loading, error } = useCuratedPhotos({ perPage: 20 }); // fetches on mount
const { videos } = usePopularVideos({ perPage: 10 });                  // fetches on mount
```

No `search()`/`refetch()` call needed for the initial load — these two hooks fetch automatically.

## `MediaLightbox`

```tsx
import { useState } from "react";
import { MediaLightbox } from "@fotoowl/media-ui-react";
import type { PhotoMedia, VideoMedia } from "@fotoowl/media-core";

function Gallery() {
  const [selected, setSelected] = useState<PhotoMedia | VideoMedia | null>(null);

  return (
    <>
      {/* ...grid that calls setSelected(item) on click... */}
      <MediaLightbox item={selected} open={selected !== null} onClose={() => setSelected(null)} />
    </>
  );
}
```

The default renderer already handles both photo (`<img>`) and video (`<video controls autoPlay muted>`) — no `renderContent` needed for basic display. Full reference: [`../components/lightbox.md`](../components/lightbox.md).

## `ReelSwiper`

```tsx
import { useState } from "react";
import { usePopularVideos } from "@fotoowl/media-react";
import { ReelSwiper } from "@fotoowl/media-ui-react";

function Reel() {
  const { videos } = usePopularVideos({ perPage: 10 });
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ReelSwiper
      items={videos}
      className="reel-viewport" // must resolve to a bounded height, e.g. `height: 70vh`
      itemClassName="reel-item"  // must resolve to `height: 100%`
      onActiveIndexChange={(index) => setActiveIndex(index)}
      renderItem={(item, _index, isActive) => (
        <video src={item.videoFiles[0]?.link} muted playsInline controls autoPlay={isActive} />
      )}
    />
  );
}
```

Full reference including the required-bounded-height rule: [`../components/reel-swiper.md`](../components/reel-swiper.md).

## Related docs

[`media-core.md`](media-core.md) · [`media-react.md`](media-react.md) · [`authentication.md`](authentication.md) · [`../components/grid.md`](../components/grid.md) · [`../components/lightbox.md`](../components/lightbox.md) · [`../components/reel-swiper.md`](../components/reel-swiper.md)
