import { apiRequest } from "./client";
import type { AuthUser } from "./types";

/** The signed-in user's own account (`/users/me`). */
export const profileApi = {
  get: (signal?: AbortSignal) => apiRequest<AuthUser>("/users/me", { signal }),

  update: (input: { name: string }) =>
    apiRequest<AuthUser>("/users/me", { method: "PATCH", body: input }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiRequest<AuthUser>("/users/me/avatar", { method: "POST", body: form });
  },

  /** Sends a confirmation link to the new address; the email changes once it's clicked. */
  requestEmailChange: (email: string) =>
    apiRequest<null>("/users/me/email", { method: "PATCH", body: { email } }),

  /** Signs out every session, including this one. */
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => apiRequest<null>("/users/me/password", { method: "PATCH", body: input }),

  /** Sets the account to INACTIVE and signs out everywhere. */
  deactivate: () => apiRequest<null>("/users/me", { method: "DELETE" }),
};
