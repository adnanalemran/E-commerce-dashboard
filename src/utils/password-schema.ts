import type { Translator } from "@/i18n";
import { z } from "zod";

/**
 * New-password rule, same as the backend `passwordSchema`: at least 6 characters
 * (letters, numbers and symbols allowed), no spaces.
 * Used for sign-up, reset password, change password and admin-created users.
 * `t` must be scoped to a namespace with `validation.passwordMin` / `validation.passwordNoSpaces`
 * (`auth` or `users`).
 */
export function createPasswordSchema(t: Translator) {
  return z
    .string()
    .refine((v) => !/\s/.test(v), t("validation.passwordNoSpaces"))
    .refine((v) => v.length >= 6, t("validation.passwordMin"));
}
