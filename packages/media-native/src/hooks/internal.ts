import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

export interface QueryResult<T> extends AsyncState<T> {
  refetch: () => void;
}

/**
 * Auto-fetches `fetcher` whenever `deps` change, tracking loading/error/data.
 * Stale responses (from a superseded call) are dropped instead of overwriting
 * fresher state. Pass `enabled: false` to skip fetching entirely.
 */
export function useMediaQuery<T>(fetcher: () => Promise<T>, deps: unknown[], enabled = true): QueryResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: enabled, error: undefined });
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(() => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    fetcherRef
      .current()
      .then((data) => {
        if (id === requestId.current) setState({ data, loading: false, error: undefined });
      })
      .catch((cause: unknown) => {
        if (id === requestId.current) setState({ data: undefined, loading: false, error: toError(cause) });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1;
      setState({ data: undefined, loading: false, error: undefined });
      return;
    }
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { ...state, refetch: execute };
}

export interface MutationResult<Args extends unknown[], T> extends AsyncState<T> {
  run: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
}

/** Wraps an imperative async call (e.g. triggered by a search box) with loading/error/data tracking. */
export function useMediaMutation<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>): MutationResult<Args, T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: false, error: undefined });
  const requestId = useRef(0);

  const run = useCallback(
    async (...args: Args) => {
      const id = ++requestId.current;
      setState({ data: undefined, loading: true, error: undefined });
      try {
        const data = await fn(...args);
        if (id === requestId.current) setState({ data, loading: false, error: undefined });
        return data;
      } catch (cause) {
        if (id === requestId.current) setState({ data: undefined, loading: false, error: toError(cause) });
        return undefined;
      }
    },
    [fn]
  );

  const reset = useCallback(() => {
    requestId.current += 1;
    setState({ data: undefined, loading: false, error: undefined });
  }, []);

  return { ...state, run, reset };
}
