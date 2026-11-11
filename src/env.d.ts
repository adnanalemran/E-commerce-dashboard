/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API root, e.g. `http://localhost:5000/api/v1`. */
  readonly VITE_API_BASE_URL?: string;
  /** Google OAuth Web client ID. Google sign-in is hidden when unset. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
