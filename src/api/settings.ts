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
  delivery: {
    charges: Record<DeliveryZone, number>;
    /** 0 turns free delivery off. */
    freeInsideDhakaFrom: number;
    estimatedDays: Record<DeliveryZone, string>;
  };
}

/** Store settings (`/admin/settings`, admins only). */
export const settingsApi = {
  get: (signal?: AbortSignal) => apiRequest<StoreSettings>("/admin/settings", { signal }),
  save: (settings: StoreSettings) => apiRequest<StoreSettings>("/admin/settings", { method: "PUT", body: settings }),
};
