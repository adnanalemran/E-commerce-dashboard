import { ApiError } from "@/api/client";
import type { Translator } from "@/i18n";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { z } from "zod";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/** Google sign-in is only offered when a Web client ID is configured. */
export const isGoogleAuthEnabled = GOOGLE_CLIENT_ID !== "";

/** Human-readable message for a failed auth request. `t` must be scoped to `auth`. */
export function getAuthErrorMessage(error: unknown, t: Translator): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return t("errors.network");
    if (error.message) return error.message;
  }
  return t("errors.unexpected");
}

/**
 * Copies backend validation errors (`[{ field, message }]`) onto form fields.
 * Returns `true` when at least one error was mapped to a field.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>>,
): boolean {
  if (!(error instanceof ApiError)) return false;

  let applied = false;
  for (const { field, message } of error.fieldErrors) {
    const target = fieldMap[field];
    if (target) {
      setError(target, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
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
