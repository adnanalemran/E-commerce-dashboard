import { COUPON_TYPES, type Coupon, type CouponInput } from "@/api/coupons";
import type { Translator } from "@/i18n";
import { z } from "zod";

const optionalNumber = (t: Translator, integer: boolean) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (integer ? /^\d{1,7}$/.test(value) && Number(value) >= 1 : /^\d{1,8}(\.\d{1,2})?$/.test(value)),
      integer ? t("validation.wholeNumber") : t("validation.amount"),
    );

/** `t` must be scoped to the `coupons` namespace. Numbers stay strings in the form. */
export function createCouponFormSchema(t: Translator) {
  return z
    .object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9_-]{3,40}$/, t("validation.code")),
      description: z.string().trim().max(200, t("validation.descriptionMax")),
      type: z.enum(COUPON_TYPES),
      value: z.string().trim(),
      minSubtotal: optionalNumber(t, false),
      maxDiscount: optionalNumber(t, false),
      startsAt: z.string(),
      endsAt: z.string(),
      usageLimit: optionalNumber(t, true),
      perPhoneLimit: optionalNumber(t, true),
      isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const value = Number(data.value);
      if (data.type === "PERCENT" && !(value > 0 && value <= 100)) {
        ctx.addIssue({ code: "custom", path: ["value"], message: t("validation.percent") });
      }
      if (data.type === "FIXED" && !(value > 0)) {
        ctx.addIssue({ code: "custom", path: ["value"], message: t("validation.amount") });
      }
      if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
        ctx.addIssue({ code: "custom", path: ["endsAt"], message: t("validation.endAfterStart") });
      }
    });
}

export type CouponFormValues = z.infer<ReturnType<typeof createCouponFormSchema>>;

/** "2026-11-12T00:00:00Z" → "2026-11-12T06:00" for <input type="datetime-local"> (local time). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function toFormValues(coupon: Coupon | null): CouponFormValues {
  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? "PERCENT",
    value: coupon ? String(coupon.value) : "",
    minSubtotal: coupon?.minSubtotal != null ? String(coupon.minSubtotal) : "",
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "",
    startsAt: toLocalInput(coupon?.startsAt ?? null),
    endsAt: toLocalInput(coupon?.endsAt ?? null),
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : "",
    perPhoneLimit: coupon?.perPhoneLimit != null ? String(coupon.perPhoneLimit) : "",
    isActive: coupon?.isActive ?? true,
  };
}

const num = (value: string) => (value === "" ? null : Number(value));
const date = (value: string) => (value ? new Date(value).toISOString() : null);

export function toCouponInput(values: CouponFormValues): CouponInput {
  return {
    code: values.code,
    description: values.description || null,
    type: values.type,
    value: values.type === "FREE_DELIVERY" ? 0 : Number(values.value),
    minSubtotal: num(values.minSubtotal),
    maxDiscount: values.type === "PERCENT" ? num(values.maxDiscount) : null,
    startsAt: date(values.startsAt),
    endsAt: date(values.endsAt),
    usageLimit: num(values.usageLimit),
    perPhoneLimit: num(values.perPhoneLimit),
    isActive: values.isActive,
  };
}
