/** Mirrors `UserSummary` in the backend (`modules/auth/auth.types.ts`). */
export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

/** Mirrors `AuthResponseData` in the backend. The refresh token travels as an httpOnly cookie. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

/** Envelope produced by the backend `ApiResponse` helper. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

/** Shape of the backend `validateRequest` (Zod) error items. */
export interface ApiFieldError {
  field: string;
  message: string;
}
