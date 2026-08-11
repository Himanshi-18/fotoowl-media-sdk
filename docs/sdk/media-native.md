# `@fotoowl/media-native`

React Native bindings around `@fotoowl/media-core` — functionally the same hooks and provider as `@fotoowl/media-react`, published as a separate package so a React Native app doesn't need to depend on any web-specific code.

## Purpose

Give a React Native app the exact same `MediaProvider` + hooks API as the web wrapper, without importing anything DOM-specific. The hook implementations are plain React (`useContext`, `useState`, `useEffect`, `useRef`, `useCallback`) — no React Native APIs are actually used inside the hooks themselves, since none of the data-layer logic is platform-specific.

## Public API (`src/index.ts`)

```ts
export { MediaProvider, MediaCoreContext } from "./MediaProvider";
export type { MediaProviderProps } from "./MediaProvider";

export * from "./hooks"; // identical hook set to media-react

export type { MediaCore, MediaCoreConfig } from "@fotoowl/media-core";
```

## Provider and hooks

`MediaProvider`, `useMediaCore`, `useSearchPhotos`, `useSearchVideos`, `useCuratedPhotos`, `usePopularVideos`, `usePhoto`, `useVideo`, `useMediaEvent`, and `useMediaEvents` all have the **same signatures and return shapes** as their `@fotoowl/media-react` counterparts — see [`media-react.md`](media-react.md) for the full reference; it applies here verbatim. The only source difference found between the two packages' hook implementations is a documentation comment on `useMediaEvent` noting it "unsubscribes automatically on unmount."

```tsx
import { MediaProvider, useSearchPhotos } from "@fotoowl/media-native";

function App() {
  return (
    <MediaProvider config={{ apiKey: PEXELS_API_KEY }}>
      <PhotoSearchScreen />
    </MediaProvider>
  );
}

function PhotoSearchScreen() {
  const { photos, loading, error, search } = useSearchPhotos();
  // same shape as media-react — see media-react.md
}
```

## Dependency model

```json
"dependencies": { "@fotoowl/media-core": "*" },
"peerDependencies": { "react": ">=18.0.0", "react-native": ">=0.70.0" },
"peerDependenciesMeta": { "react-native": { "optional": true } }
```

- `media-core` is a real dependency (not a peer) — this package always bundles the data-layer contract it wraps.
- `react` is a peer dependency, consistent with `media-react`.
- **`react-native` is a peer dependency, and explicitly marked `optional`.** This is deliberate: declaring it as a required peer causes `npm install` to try to auto-resolve an actual `react-native` package, and current `react-native` releases require React 19 — a hard conflict with the React 18 pinned across this workspace. Marking it optional documents the intended host/version range without forcing npm to install the real (large) package into a workspace that has no React Native app.

## Usage example

```tsx
import { MediaProvider, useCuratedPhotos, useMediaEvent } from "@fotoowl/media-native";

function TrendingPhotos() {
  const { photos, loading, error } = useCuratedPhotos({ perPage: 20 });

  useMediaEvent("view", (payload) => {
    console.log("viewed", payload.mediaId);
  });

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{error.message}</Text>;
  return (
    <FlatList data={photos} keyExtractor={(p) => String(p.id)} renderItem={({ item }) => <Image source={{ uri: item.src.medium }} />} />
  );
}
```

This example composes `media-native`'s hooks with plain React Native primitives (`FlatList`, `Image`, `ActivityIndicator`, `Text`) directly, to illustrate the hook contract. For the pre-built headless RN components, use `@fotoowl/media-ui-native` instead — see [`../components/media-ui-native.md`](../components/media-ui-native.md).

## Limitations caused by the absence of a real RN app in this repository

- **No React Native application exists anywhere in this repository** (`apps/` currently only contains `apps/web`). `media-native` has never been mounted, rendered, or exercised inside an actual RN runtime as part of this project.
- Verification for this package has been limited to `tsc --noEmit` against `@types/react-native` (a types-only devDependency, not the real `react-native` runtime) — see [`../components/media-ui-native.md`](../components/media-ui-native.md) for the identical caveat on the component side, which explains this in more detail since it's more consequential there (JSX against RN primitives) than here (plain React hooks with no RN imports at all).
- Because the hooks in this package contain **no React Native imports whatsoever**, the type-checking risk here is low — this file's hook contracts are, in practice, exercised by `media-react`'s equivalents (used daily in `apps/web`). The provider/hook *logic* is proven; what is not proven is end-to-end behavior inside a real RN app (bundler resolution, Metro, native module interplay, etc.).

## Related docs

[`architecture.md`](architecture.md) · [`media-react.md`](media-react.md) (full hook reference) · [`../components/media-ui-native.md`](../components/media-ui-native.md)
