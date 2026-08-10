import type { PhotoMedia, VideoMedia } from "./media";

export interface Pagination {
  page: number;
  perPage: number;
  totalResults?: number;
  nextPage?: string;
  prevPage?: string;
}

export interface MediaSearchParams {
  query: string;
  page?: number;
  perPage?: number;
}

export interface MediaListParams {
  page?: number;
  perPage?: number;
}

export interface PhotosResult {
  items: PhotoMedia[];
  pagination: Pagination;
}

export interface VideosResult {
  items: VideoMedia[];
  pagination: Pagination;
}