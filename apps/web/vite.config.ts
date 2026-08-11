import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Reuse the single repo-root .env (already gitignored) instead of
  // requiring a second .env file inside apps/web. Resolved relative to
  // this config file's directory.
  envDir: "../../",
});
