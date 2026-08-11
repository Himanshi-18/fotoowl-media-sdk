/**
 * Media shape this package renders. Deliberately structural (not imported
 * from @fotoowl/media-core) so this package has zero dependency on the SDK —
 * values coming from media-core/media-native satisfy this shape naturally.
 * Intentionally an independent declaration from @fotoowl/media-ui-react's
 * identical-looking type, so neither RN nor web UI package depends on the
 * other.
 */
export type MediaType = "photo" | "video";

export interface MediaItemBase {
  id: number;
  type: MediaType;
  url: string;
  width: number;
  height: number;
  alt?: string;
  photographer?: string;
  photographerUrl?: string;
  avgColor?: string;
}

export interface PhotoMediaItem extends MediaItemBase {
  type: "photo";
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

export interface VideoMediaItem extends MediaItemBase {
  type: "video";
  videoFiles: Array<{
    id: number;
    quality: string;
    fileType: string;
    width?: number;
    height?: number;
    link: string;
  }>;
  duration?: number;
}

export type MediaItem = PhotoMediaItem | VideoMediaItem;
