import type { Translator } from "@/i18n";
import { z } from "zod";

/** `t` must be scoped to the `catalog` namespace. */
export function createCategoryFormSchema(t: Translator, requireParent: boolean) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("validation.nameMin"))
      .max(100, t("validation.nameMax")),
    parentId: requireParent
      ? z.string().min(1, t("validation.parentRequired"))
      : z.string(),
    // Kept as text so an empty field means "append at the end".
    orderNo: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d{1,7}$/.test(value),
        t("validation.orderNoInvalid"),
      ),
    isFeatured: z.boolean(),
  });
}

export type CategoryFormValues = z.infer<
  ReturnType<typeof createCategoryFormSchema>
>;
