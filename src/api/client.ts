import type {
  ApiEnvelope,
  ApiFieldError,
  AuthSession,
  AuthUser,
} from "./types";
import { API_BASE_URL } from "@/config/api";

export { API_BASE_URL };

export class ApiError extends Error {
  /** HTTP status; `0` means the server could not be reached. */
  readonly status: number;
  readonly errors: unknown;

  constructor(message: string, status: number, errors: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  /** Per-field validation errors returned by the backend (400 "Validation failed"). */
  get fieldErrors(): ApiFieldError[] {
    if (!Array.isArray(this.errors)) return [];
    return this.errors.filter(
      (item): item is ApiFieldError =>
        typeof item === "object" &&
        item !== null &&
        typeof item.field === "string" &&
        typeof item.message === "string",
    );
  }
}

// ---------------------------------------------------------------------------
// Session state (access token is kept in memory only; the refresh token is an
// httpOnly cookie managed by the backend). A token-free snapshot of the signed-in
// user is kept in localStorage so a reload while the API is unreachable stays
// signed in (see AuthProvider) instead of bouncing to the sign-in page.
// ---------------------------------------------------------------------------

type SessionListener = (user: AuthUser | null) => void;

let accessToken: string | null = null;
const listeners = new Set<SessionListener>();

const channel =
  typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("auth-session");

const USER_STORAGE_KEY = "edukan.dashboard.user";

/** Never holds tokens: only the profile shown in the UI (name, email, roles…). */
function storeUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, quota): the session still works for this page.
  }
}

/** The last signed-in user saved in this browser, if any. */
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    return user && typeof user.id === "string" && Array.isArray(user.roles) ? user : null;
  } catch {
    return null;
  }
}

/** True once a refresh or sign-in has produced an access token in this tab. */
export function hasAccessToken() {
  return accessToken !== null;
}

function notify(user: AuthUser | null) {
  listeners.forEach((listener) => listener(user));
}

export function onSessionChange(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSession(session: AuthSession) {
  accessToken = session.accessToken;
  storeUser(session.user);
  notify(session.user);
}

/** Replaces the signed-in user's data (e.g. after a profile update) without touching tokens. */
export function updateSessionUser(user: AuthUser) {
  if (!accessToken) return;
  storeUser(user);
  notify(user);
}

export function clearSession({ broadcast = false } = {}) {
  accessToken = null;
  storeUser(null);
  notify(null);
  if (broadcast) channel?.postMessage("logout");
}

// Sign out every open tab when one of them signs out.
channel?.addEventListener("message", (event) => {
  if (event.data === "logout") clearSession();
});

// ---------------------------------------------------------------------------
// Low-level request
// ---------------------------------------------------------------------------

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serialisable value, or `FormData` for multipart uploads. */
  body?: unknown;
  /** Attach the access token and transparently refresh it on 401. Default `true`. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function send<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: RequestOptions,
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  // FormData sets its own multipart boundary header.
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      credentials: "include", // send/receive the refreshToken cookie
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Unable to reach the server", 0);
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.errors ?? null,
    );
  }

  return payload.data as T;
}

// ---------------------------------------------------------------------------
// Refresh — the backend rotates refresh tokens and treats reuse of an old one
// as theft (revoking every session), so refreshes must never run in parallel:
// calls inside a tab share one in-flight promise, and tabs take turns through
// the Web Locks API.
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<AuthSession | null> | null = null;

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("auth-refresh", task);
  }
  return task();
}

async function performRefresh(): Promise<AuthSession | null> {
  try {
    const session = await send<AuthSession>("/auth/refresh", {
      method: "POST",
      body: {},
      auth: false,
    });
    setSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && !error.isNetworkError) {
      // Missing, expired, revoked or rejected refresh token → signed out.
      clearSession();
      return null;
    }
    throw error;
  }
}

/** Exchange the refresh cookie for a new access token. Resolves `null` when signed out. */
export function refreshSession(): Promise<AuthSession | null> {
  refreshInFlight ??= withRefreshLock(performRefresh).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Public request helper
// ---------------------------------------------------------------------------

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true } = options;
  try {
    return await send<T>(path, options);
  } catch (error) {
    if (!auth || !(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    const session = await refreshSession();
    if (!session) throw error;
    return send<T>(path, options);
  }
}
