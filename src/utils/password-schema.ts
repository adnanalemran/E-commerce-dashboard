import type { Translator } from "@/i18n";
import { z } from "zod";

/**
 * Same rules as the backend password validation.
 * `t` must be scoped to the `auth` namespace (uses `validation.password*`).
 */
export function createPasswordSchema(t: Translator) {
  return z
    .string()
    .min(8, t("validation.passwordMin"))
    .regex(/[A-Z]/, t("validation.passwordUppercase"))
    .regex(/[a-z]/, t("validation.passwordLowercase"))
    .regex(/[0-9]/, t("validation.passwordNumber"))
    .regex(/[\W_]/, t("validation.passwordSpecial"));
}
