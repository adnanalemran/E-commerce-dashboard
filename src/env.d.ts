/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" → deployed backend, otherwise the local one (see `src/config/api.ts`). */
  readonly VITE_IS_PROD?: string;
  /** Google OAuth Web client ID. Google sign-in is hidden when unset. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
