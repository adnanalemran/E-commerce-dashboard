import type { Translator } from "@/i18n";
import { z } from "zod";
import { createEmailSchema, createPasswordSchema } from "../utils";

export function createSignUpSchema(t: Translator) {
  return z
    .object({
      fname: z.string().trim().min(1, t("validation.firstNameRequired")),
      lname: z.string().trim().min(1, t("validation.lastNameRequired")),
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
      terms: z.boolean().refine((val) => val === true, {
        message: t("validation.termsRequired"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    })
    .refine((data) => `${data.fname} ${data.lname}`.trim().length >= 2, {
      message: t("validation.nameMin"),
      path: ["fname"],
    });
}

export type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;
