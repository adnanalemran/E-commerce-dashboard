import { apiRequest } from "./client";
import type { DeliveryZone } from "./orders";

/** Mirrors `storeSettingsSchema` in the backend (`modules/settings`). */
export interface StoreSettings {
  contact: {
    phone: string;
    hotline: string;
    whatsapp: string;
    messengerUrl: string;
    email: string;
    address: string;
    hours: string;
  };
  socials: { facebook: string; instagram: string; youtube: string; tiktok: string };
  announcements: string[];
  /** Marketing tag IDs (empty = off). */
  tracking: { facebookPixelId: string; gtmId: string; ga4Id: string };
  delivery: {
    charges: Record<DeliveryZone, number>;
    /** 0 turns free delivery off. */
    freeInsideDhakaFrom: number;
    estimatedDays: Record<DeliveryZone, string>;
  };
}

/** Mirrors `CacheService.stats()` in the backend. */
export interface CacheStatus {
  enabled: boolean;
  /** All Redis keys (cache plus logins, codes, rate limits). */
  keys: number;
  /** Cached API responses. */
  entries: number;
  usedMemory: string | null;
  maxMemory: string | null;
  evictionPolicy: string | null;
}

export interface CacheClearResult {
  removed: number;
  tags: string[];
}

/** Redis API cache (`/admin/cache`, admins only). Clearing keeps logins, codes and rate limits. */
export const cacheApi = {
  status: (signal?: AbortSignal) => apiRequest<CacheStatus>("/admin/cache", { signal }),
  clear: () => apiRequest<CacheClearResult>("/admin/cache/clear", { method: "POST" }),
};

/** Store settings (`/admin/settings`, admins only). */
export const settingsApi = {
  get: (signal?: AbortSignal) => apiRequest<StoreSettings>("/admin/settings", { signal }),
  save: (settings: StoreSettings) => apiRequest<StoreSettings>("/admin/settings", { method: "PUT", body: settings }),
};
