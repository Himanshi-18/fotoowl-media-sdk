import type { MediaType } from "./media";

export interface DownloadEventPayload {
  mediaId: number;
  type: MediaType;
  url: string;
  timestamp: number;
}

export interface ViewEventPayload {
  mediaId: number;
  type: MediaType;
  timestamp: number;
}

export interface MediaSDKEvents {
  download: DownloadEventPayload;
  view: ViewEventPayload;
  [key: string]: unknown;
}
