export type MediaType = "photo" | "video";

export interface MediaItem {
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

export interface PhotoMedia extends MediaItem {
  type: "photo";
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

export interface VideoMedia extends MediaItem {
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

export type Media = PhotoMedia | VideoMedia;