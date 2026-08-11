import { MediaLightbox } from "@fotoowl/media-ui-react";
import type { PhotoMedia, VideoMedia } from "@fotoowl/media-core";

export interface MediaViewerProps {
  item: PhotoMedia | VideoMedia | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Thin wrapper around the headless `MediaLightbox`. Its default rendering
 * already handles both photos (`<img>`) and videos (`<video controls>`), so
 * no custom `renderContent` is needed here.
 */
export function MediaViewer({ item, open, onClose }: MediaViewerProps) {
  return (
    <MediaLightbox item={item} open={open} onClose={onClose} className="lightbox" backdropClassName="lightbox-backdrop" />
  );
}
