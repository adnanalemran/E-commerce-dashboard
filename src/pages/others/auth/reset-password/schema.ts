import type { Translator } from "@/i18n";
import { z } from "zod";
import { createPasswordSchema } from "../utils";

export function createResetPasswordSchema(t: Translator) {
  return z
    .object({
      newPassword: createPasswordSchema(t),
      confirmPassword: z
        .string()
        .min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
