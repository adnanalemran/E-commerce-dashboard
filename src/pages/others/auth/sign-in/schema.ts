import type { Translator } from "@/i18n";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** E.164, same as the backend `phoneRegex`. */
const phoneRegex = /^\+[1-9]\d{1,14}$/;

export function createSignInSchema(t: Translator) {
  return z.object({
    identifier: z
      .string()
      .trim()
      .min(1, t("validation.identifierRequired"))
      .refine(
        (value) =>
          value.includes("@") ? emailRegex.test(value) : phoneRegex.test(value),
        t("validation.identifierInvalid"),
      ),
    password: z.string().min(1, t("validation.passwordRequired")),
    keepLoggedIn: z.boolean().optional(),
  });
}

export type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>;
