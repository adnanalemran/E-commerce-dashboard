/**
 * Which backend the dashboard talks to.
 *
 * Set `VITE_IS_PROD=true` to use the deployed API; anything else (or unset)
 * uses the local backend. Vite inlines the value at build time, so changing it
 * needs a restart of `npm run dev` or a new build.
 */

/** Backend origins. Every API path lives under `/api/v1`. */
export const API_ORIGINS = {
  local: "http://localhost:5000",
  production: "https://e-commerce-backend-theta-dusky.vercel.app",
} as const;

const API_PREFIX = "/api/v1";

/** Exactly "true" enables it. A plain comparison lets the build drop the unused URL. */
export const IS_PROD = import.meta.env.VITE_IS_PROD === "true";

export const API_ORIGIN = IS_PROD ? API_ORIGINS.production : API_ORIGINS.local;

/** Root for every request, e.g. `http://localhost:5000/api/v1`. */
export const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;
