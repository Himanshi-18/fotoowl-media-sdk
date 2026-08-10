import type { PhotoMedia, VideoMedia } from "../types/media";
import type { Pagination } from "../types/api";
import type { PexelsPhotoRaw, PexelsPhotosPageRaw, PexelsVideoRaw, PexelsVideosPageRaw } from "../types/pexels";

export function mapPexelsPhoto(raw: PexelsPhotoRaw): PhotoMedia {
  return {
    id: raw.id,
    type: "photo",
    url: raw.url,
    width: raw.width,
    height: raw.height,
    alt: raw.alt || undefined,
    photographer: raw.photographer,
    photographerUrl: raw.photographer_url,
    avgColor: raw.avg_color,
    src: {
      original: raw.src.original,
      large: raw.src.large,
      medium: raw.src.medium,
      small: raw.src.small,
      tiny: raw.src.tiny,
    },
  };
}

export function mapPexelsVideo(raw: PexelsVideoRaw): VideoMedia {
  return {
    id: raw.id,
    type: "video",
    url: raw.url,
    width: raw.width,
    height: raw.height,
    photographer: raw.user?.name,
    photographerUrl: raw.user?.url,
    duration: raw.duration,
    videoFiles: raw.video_files.map((file) => ({
      id: file.id,
      quality: file.quality,
      fileType: file.file_type,
      width: file.width ?? undefined,
      height: file.height ?? undefined,
      link: file.link,
    })),
  };
}

export function mapPagination(raw: PexelsPhotosPageRaw | PexelsVideosPageRaw): Pagination {
  return {
    page: raw.page,
    perPage: raw.per_page,
    totalResults: raw.total_results,
    nextPage: raw.next_page,
    prevPage: raw.prev_page,
  };
}
