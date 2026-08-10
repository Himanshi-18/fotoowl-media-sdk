import { createContext, createElement, useMemo, type ReactNode } from "react";
import { createMediaCore, MediaCore, type MediaCoreConfig } from "@fotoowl/media-core";

export const MediaCoreContext = createContext<MediaCore | null>(null);

export type MediaProviderProps =
  | { children: ReactNode; client: MediaCore; config?: never }
  | { children: ReactNode; client?: never; config: MediaCoreConfig };

/**
 * Provides a single `MediaCore` instance to the React Native tree. Pass a
 * pre-built `client` (e.g. shared with a media-react app), or a `config`
 * and let the provider construct + memoize the instance.
 *
 * All actual API calls, caching, and event emission happen inside the
 * `MediaCore` instance itself — this component only manages its lifecycle
 * within React.
 */
export function MediaProvider(props: MediaProviderProps): ReturnType<typeof createElement> {
  const { children } = props;
  const client = props.client;
  const config = props.config;

  const instance = useMemo(() => {
    if (client) return client;
    if (config) return createMediaCore(config);
    throw new Error("MediaProvider requires either a `client` instance or a `config` object.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    client,
    config?.apiKey,
    config?.baseUrl,
    config?.cacheTtlMs,
    config?.timeoutMs,
    config?.enableDefaultLogging,
  ]);

  return createElement(MediaCoreContext.Provider, { value: instance }, children);
}
