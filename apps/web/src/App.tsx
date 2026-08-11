import { useState } from "react";
import { MediaProvider } from "@fotoowl/media-react";
import type { PhotoMedia, VideoMedia } from "@fotoowl/media-core";
import { PhotoSearch } from "./components/PhotoSearch";
import { VideoSearch } from "./components/VideoSearch";
import { ReelView } from "./components/ReelView";
import { MediaViewer } from "./components/MediaViewer";

type Tab = "photos" | "videos" | "explore";
type SelectedItem = PhotoMedia | VideoMedia | null;

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

function MissingApiKeyNotice() {
  return (
    <div className="config-error">
      <h1>FotoOwl Media SDK Demo</h1>
      <p>
        Missing <code>VITE_PEXELS_API_KEY</code>. Copy <code>apps/web/.env.example</code> into the repo-root{" "}
        <code>.env</code> file, set your Pexels API key, then restart the dev server.
      </p>
    </div>
  );
}

function DemoApp() {
  const [tab, setTab] = useState<Tab>("photos");
  const [selected, setSelected] = useState<SelectedItem>(null);

  return (
    <MediaProvider config={{ apiKey: API_KEY }}>
      <div className="app">
        <header className="app-header">
          <h1>FotoOwl Media SDK Demo</h1>
          <nav className="tabs">
            <button type="button" className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}>
              Photos
            </button>
            <button type="button" className={tab === "videos" ? "active" : ""} onClick={() => setTab("videos")}>
              Videos
            </button>
            <button type="button" className={tab === "explore" ? "active" : ""} onClick={() => setTab("explore")}>
              Explore
            </button>
          </nav>
        </header>

        <main className="app-main">
          {tab === "photos" && <PhotoSearch onSelect={setSelected} />}
          {tab === "videos" && <VideoSearch onSelect={setSelected} />}
          {tab === "explore" && <ReelView />}
        </main>

        <MediaViewer item={selected} open={selected !== null} onClose={() => setSelected(null)} />
      </div>
    </MediaProvider>
  );
}

export default function App() {
  // Guard before ever constructing MediaCore — an empty/missing key would
  // otherwise only surface once a request is attempted.
  if (!API_KEY) return <MissingApiKeyNotice />;
  return <DemoApp />;
}
