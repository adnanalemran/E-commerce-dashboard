import type { Translator } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
import { z } from "zod";

export { applyFieldErrors } from "@/utils/form-errors";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/** Google sign-in is only offered when a Web client ID is configured. */
export const isGoogleAuthEnabled = GOOGLE_CLIENT_ID !== "";

/** Human-readable message for a failed auth request. `t` must be scoped to `auth`. */
export function getAuthErrorMessage(error: unknown, t: Translator): string {
  return getApiErrorMessage(error, {
    network: t("errors.network"),
    unexpected: t("errors.unexpected"),
  });
}

/** Same rules as the backend `registerSchema` / `resetPasswordSchema`. */
export function createPasswordSchema(t: Translator) {
  return z
    .string()
    .min(8, t("validation.passwordMin"))
    .regex(/[A-Z]/, t("validation.passwordUppercase"))
    .regex(/[a-z]/, t("validation.passwordLowercase"))
    .regex(/[0-9]/, t("validation.passwordNumber"))
    .regex(/[\W_]/, t("validation.passwordSpecial"));
}

export function createEmailSchema(t: Translator) {
  return z
    .string()
    .trim()
    .min(1, t("validation.emailRequired"))
    .email(t("validation.emailInvalid"));
}
