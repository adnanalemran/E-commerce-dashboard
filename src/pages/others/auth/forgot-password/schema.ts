import type { Translator } from "@/i18n";
import { z } from "zod";
import { createEmailSchema } from "../utils";

export function createForgotPasswordSchema(t: Translator) {
  return z.object({ email: createEmailSchema(t) });
}

export type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
