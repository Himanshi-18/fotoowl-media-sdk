import { PexelsHttpClient } from "./api/PexelsHttpClient";
import { mapPagination, mapPexelsPhoto, mapPexelsVideo } from "./api/mappers";
import { SimpleCache, RequestDeduplicator } from "./cache";
import { EventEmitter, logDownloadEvent, logViewEvent } from "./events";
import { ValidationError } from "./errors";
import type { MediaCoreConfig } from "./types/config";
import type { MediaListParams, MediaSearchParams, PhotosResult, VideosResult } from "./types/api";
import type { PhotoMedia, VideoMedia } from "./types/media";
import type { MediaSDKEvents } from "./types/events";
import type { PexelsPhotoRaw, PexelsPhotosPageRaw, PexelsVideoRaw, PexelsVideosPageRaw } from "./types/pexels";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Framework-agnostic Pexels media SDK. Wraps the raw HTTP client with
 * caching, request deduplication, and a typed event bus.
 */
export class MediaCore {
  private readonly http: PexelsHttpClient;
  private readonly cache: SimpleCache;
  private readonly dedup = new RequestDeduplicator();
  private readonly unsubscribeDefaultLogging?: () => void;

  readonly events = new EventEmitter<MediaSDKEvents>();

  constructor(config: MediaCoreConfig) {
    this.http = new PexelsHttpClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
    });
    this.cache = new SimpleCache(config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS);

    if (config.enableDefaultLogging ?? true) {
      const offDownload = this.events.on("download", logDownloadEvent);
      const offView = this.events.on("view", logViewEvent);
      this.unsubscribeDefaultLogging = () => {
        offDownload();
        offView();
      };
    }
  }

  /** Removes the built-in console logger without affecting other subscribers. */
  disableDefaultLogging(): void {
    this.unsubscribeDefaultLogging?.();
  }

  async searchPhotos(params: MediaSearchParams): Promise<PhotosResult> {
    if (!params.query || params.query.trim() === "") {
      throw new ValidationError("searchPhotos requires a non-empty `query`.");
    }
    const page = await this.cachedGet<PexelsPhotosPageRaw>("/v1/search", {
      query: params.query,
      page: params.page,
      per_page: params.perPage,
    });
    return this.toPhotosResult(page);
  }

  async curatedPhotos(params: MediaListParams = {}): Promise<PhotosResult> {
    const page = await this.cachedGet<PexelsPhotosPageRaw>("/v1/curated", {
      page: params.page,
      per_page: params.perPage,
    });
    return this.toPhotosResult(page);
  }

  async getPhoto(id: number): Promise<PhotoMedia> {
    const raw = await this.cachedGet<PexelsPhotoRaw>(`/v1/photos/${id}`);
    return mapPexelsPhoto(raw);
  }

  async searchVideos(params: MediaSearchParams): Promise<VideosResult> {
    if (!params.query || params.query.trim() === "") {
      throw new ValidationError("searchVideos requires a non-empty `query`.");
    }
    const page = await this.cachedGet<PexelsVideosPageRaw>("/videos/search", {
      query: params.query,
      page: params.page,
      per_page: params.perPage,
    });
    return this.toVideosResult(page);
  }

  async popularVideos(params: MediaListParams = {}): Promise<VideosResult> {
    const page = await this.cachedGet<PexelsVideosPageRaw>("/videos/popular", {
      page: params.page,
      per_page: params.perPage,
    });
    return this.toVideosResult(page);
  }

  async getVideo(id: number): Promise<VideoMedia> {
    const raw = await this.cachedGet<PexelsVideoRaw>(`/videos/videos/${id}`);
    return mapPexelsVideo(raw);
  }

  /** Emits the `download` event. Call this from a wrapper when a consumer downloads a media item. */
  trackDownload(media: PhotoMedia | VideoMedia, url: string): void {
    this.events.emit("download", { mediaId: media.id, type: media.type, url, timestamp: Date.now() });
  }

  /** Emits the `view` event. Call this from a wrapper when a consumer views a media item. */
  trackView(media: PhotoMedia | VideoMedia): void {
    this.events.emit("view", { mediaId: media.id, type: media.type, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async cachedGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const key = `${path}?${JSON.stringify(params)}`;
    const cached = this.cache.get(key) as T | undefined;
    if (cached !== undefined) return cached;

    return this.dedup.dedupe(key, async () => {
      const result = await this.http.get<T>(path, params);
      this.cache.set(key, result);
      return result;
    });
  }

  private toPhotosResult(page: PexelsPhotosPageRaw): PhotosResult {
    return { items: page.photos.map(mapPexelsPhoto), pagination: mapPagination(page) };
  }

  private toVideosResult(page: PexelsVideosPageRaw): VideosResult {
    return { items: page.videos.map(mapPexelsVideo), pagination: mapPagination(page) };
  }
}

export function createMediaCore(config: MediaCoreConfig): MediaCore {
  return new MediaCore(config);
}
