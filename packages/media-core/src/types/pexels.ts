/**
 * Raw wire-format types returned by the Pexels REST API.
 * These intentionally mirror Pexels' JSON casing (snake_case) and are
 * normalized into the domain types in `media.ts` before being handed
 * to consumers.
 */

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhotoRaw {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PexelsPhotoSrc;
  liked: boolean;
  alt: string;
}

export interface PexelsPhotosPageRaw {
  page: number;
  per_page: number;
  photos: PexelsPhotoRaw[];
  total_results?: number;
  next_page?: string;
  prev_page?: string;
}

export interface PexelsVideoFileRaw {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
}

export interface PexelsVideoUserRaw {
  id: number;
  name: string;
  url: string;
}

export interface PexelsVideoRaw {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: PexelsVideoUserRaw;
  video_files: PexelsVideoFileRaw[];
}

export interface PexelsVideosPageRaw {
  page: number;
  per_page: number;
  videos: PexelsVideoRaw[];
  total_results?: number;
  next_page?: string;
  prev_page?: string;
}
