import type { Translator } from "@/i18n";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** E.164, same as the backend `phoneRegex`. */
const phoneRegex = /^\+[1-9]\d{1,14}$/;

/** `t` must be scoped to the `users` namespace. */
export function createUserFormSchema(t: Translator, isCreate: boolean) {
  const password = z
    .string()
    .min(8, t("validation.passwordMin"))
    .regex(/[A-Z]/, t("validation.passwordUppercase"))
    .regex(/[a-z]/, t("validation.passwordLowercase"))
    .regex(/[0-9]/, t("validation.passwordNumber"))
    .regex(/[\W_]/, t("validation.passwordSpecial"));

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(2, t("validation.nameMin"))
        .max(100, t("validation.nameMax")),
      email: z
        .string()
        .trim()
        .refine((v) => v === "" || emailRegex.test(v), t("validation.emailInvalid")),
      phone: z
        .string()
        .trim()
        .refine((v) => v === "" || phoneRegex.test(v), t("validation.phoneInvalid")),
      // Only required (and sent) when creating a user.
      password: isCreate ? password : z.string(),
      role: z.string().min(1, t("validation.roleRequired")),
      status: z.string(),
    })
    .refine((data) => data.email !== "" || data.phone !== "", {
      message: t("validation.contactRequired"),
      path: ["email"],
    });
}

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;
