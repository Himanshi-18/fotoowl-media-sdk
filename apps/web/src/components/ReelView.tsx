import { useState } from "react";
import { usePopularVideos } from "@fotoowl/media-react";
import { ReelSwiper } from "@fotoowl/media-ui-react";

/**
 * Demonstrates ReelSwiper: vertical paging, active-item detection via
 * onActiveIndexChange, and caller-controlled renderItem — fed by
 * usePopularVideos (auto-fetched trending videos), no API logic here.
 */
export function ReelView() {
  const { videos, loading, error } = usePopularVideos({ perPage: 10 });
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading && videos.length === 0) return <p className="loading-text">Loading reel…</p>;
  if (error) {
    return (
      <p role="alert" className="error-text">
        {error.message}
      </p>
    );
  }
  if (videos.length === 0) return <p>No videos available.</p>;

  return (
    <section>
      <p className="reel-status">
        Viewing {activeIndex + 1} of {videos.length}
      </p>
      <ReelSwiper
        items={videos}
        className="reel-viewport"
        itemClassName="reel-item"
        onActiveIndexChange={(index) => setActiveIndex(index)}
        renderItem={(item, _index, isActive) => (
          <div className="reel-item-content">
            <video
              src={item.videoFiles[0]?.link}
              className="reel-video"
              muted
              playsInline
              controls
              autoPlay={isActive}
            />
            {item.photographer && <p className="reel-caption">by {item.photographer}</p>}
          </div>
        )}
      />
    </section>
  );
}
