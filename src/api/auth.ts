import { apiRequest } from "./client";
import type { AuthSession } from "./types";

export interface LoginInput {
  /** Email address or E.164 phone number. */
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

/** Endpoints under `/api/v1/auth` (see backend `modules/auth/auth.routes.ts`). */
export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    }),

  register: (input: RegisterInput) =>
    apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    }),

  google: (idToken: string, rememberMe = false) =>
    apiRequest<AuthSession>("/auth/google", {
      method: "POST",
      body: { idToken, rememberMe },
      auth: false,
    }),

  logout: () =>
    apiRequest<null>("/auth/logout", { method: "POST", body: {}, auth: false }),

  logoutAll: () =>
    apiRequest<null>("/auth/logout-all", { method: "POST", body: {} }),

  forgotPassword: (email: string) =>
    apiRequest<null>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<null>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
      auth: false,
    }),

  verifyEmail: (token: string) =>
    apiRequest<null>("/auth/verify-email", {
      method: "POST",
      body: { token },
      auth: false,
    }),

  resendVerification: (email: string) =>
    apiRequest<null>("/auth/resend-verification", {
      method: "POST",
      body: { email },
      auth: false,
    }),
};
