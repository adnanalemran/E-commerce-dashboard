export const routing = {
  locales: ["en"] as const,
  defaultLocale: "en",
} as const;

export type Locale = (typeof routing.locales)[number];

export const isLocale = (v: unknown): v is Locale => v === "en";

/** English only — always LTR. */
export const isRtl = (_locale?: Locale): boolean => false;
