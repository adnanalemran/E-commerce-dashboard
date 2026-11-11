import type {
  ApiEnvelope,
  ApiFieldError,
  AuthSession,
  AuthUser,
} from "./types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

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
// httpOnly cookie managed by the backend).
// ---------------------------------------------------------------------------

type SessionListener = (user: AuthUser | null) => void;

let accessToken: string | null = null;
const listeners = new Set<SessionListener>();

const channel =
  typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("auth-session");

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
  notify(session.user);
}

export function clearSession({ broadcast = false } = {}) {
  accessToken = null;
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
  body?: unknown;
  /** Attach the access token and transparently refresh it on 401. Default `true`. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function send<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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
