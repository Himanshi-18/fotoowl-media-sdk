import type { DownloadEventPayload, ViewEventPayload } from "../types/events";

export function logDownloadEvent(payload: DownloadEventPayload): void {
  console.log(`[media-core] download: ${payload.type} #${payload.mediaId}`, payload);
}

export function logViewEvent(payload: ViewEventPayload): void {
  console.log(`[media-core] view: ${payload.type} #${payload.mediaId}`, payload);
}
