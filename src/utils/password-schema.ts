import type { Translator } from "@/i18n";
import { z } from "zod";

/**
 * 6-digit password with no spaces, matching backend.
 */
export function createPasswordSchema(t: Translator) {
  return z
    .string()
    .refine((v) => !/\s/.test(v), t("validation.passwordSpecial") || "Password must not contain spaces")
    .refine((v) => /^\d{6}$/.test(v), t("validation.passwordMin") || "Password must be exactly 6 digits");
}
