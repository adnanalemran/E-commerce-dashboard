import type { StoreSettings } from "@/api/settings";
import type { Translator } from "@/i18n";
import { z } from "zod";

const ZONES = ["INSIDE_DHAKA", "DHAKA_SUBURB", "OUTSIDE_DHAKA"] as const;

/** `t` must be scoped to the `settings` namespace. Numbers stay strings in the form. */
export function createSettingsSchema(t: Translator) {
  const url = z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), t("validation.url"));
  const phone = z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[\d\s-]{6,20}$/.test(v), t("validation.phone"));
  const money = z
    .string()
    .trim()
    .refine((v) => /^\d{1,7}$/.test(v), t("validation.amount"));
  const days = z.string().trim().min(1, t("validation.days")).max(10, t("validation.days"));

  return z.object({
    contact: z.object({
      phone,
      hotline: phone,
      whatsapp: phone,
      messengerUrl: url,
      email: z
        .string()
        .trim()
        .refine((v) => v === "" || z.string().email().safeParse(v).success, t("validation.email")),
      address: z.string().trim().max(300),
      hours: z.string().trim().max(100),
    }),
    socials: z.object({ facebook: url, instagram: url, youtube: url, tiktok: url }),
    tracking: z.object({
      facebookPixelId: z.string().trim().refine((v) => v === "" || /^\d{8,20}$/.test(v), t("validation.pixel")),
      gtmId: z.string().trim().toUpperCase().refine((v) => v === "" || /^GTM-[A-Z0-9]{4,12}$/.test(v), t("validation.gtm")),
      ga4Id: z.string().trim().toUpperCase().refine((v) => v === "" || /^G-[A-Z0-9]{4,15}$/.test(v), t("validation.ga4")),
    }),
    /** One announcement per line. */
    announcements: z
      .string()
      .refine((v) => v.split("\n").filter((l) => l.trim()).length <= 8, t("validation.announcementsCount"))
      .refine((v) => v.split("\n").every((l) => l.trim().length <= 160), t("validation.announcementLength")),
    delivery: z.object({
      charges: z.object({ INSIDE_DHAKA: money, DHAKA_SUBURB: money, OUTSIDE_DHAKA: money }),
      freeInsideDhakaFrom: money,
      estimatedDays: z.object({ INSIDE_DHAKA: days, DHAKA_SUBURB: days, OUTSIDE_DHAKA: days }),
    }),
  });
}

export type SettingsFormValues = z.infer<ReturnType<typeof createSettingsSchema>>;

export function toFormValues(s: StoreSettings): SettingsFormValues {
  const charges = Object.fromEntries(ZONES.map((z) => [z, String(s.delivery.charges[z])])) as SettingsFormValues["delivery"]["charges"];
  return {
    contact: { ...s.contact },
    socials: { ...s.socials },
    tracking: { ...s.tracking },
    announcements: s.announcements.join("\n"),
    delivery: {
      charges,
      freeInsideDhakaFrom: String(s.delivery.freeInsideDhakaFrom),
      estimatedDays: { ...s.delivery.estimatedDays },
    },
  };
}

export function toSettings(v: SettingsFormValues): StoreSettings {
  const charges = Object.fromEntries(ZONES.map((z) => [z, Number(v.delivery.charges[z])])) as StoreSettings["delivery"]["charges"];
  return {
    contact: { ...v.contact, email: v.contact.email.toLowerCase() },
    socials: { ...v.socials },
    tracking: { ...v.tracking },
    announcements: v.announcements
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    delivery: {
      charges,
      freeInsideDhakaFrom: Number(v.delivery.freeInsideDhakaFrom),
      estimatedDays: { ...v.delivery.estimatedDays },
    },
  };
}
