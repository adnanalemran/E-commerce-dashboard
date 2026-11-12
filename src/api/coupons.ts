import type { Paginated } from "./categories";
import { apiRequest } from "./client";

export const COUPON_TYPES = ["PERCENT", "FIXED", "FREE_DELIVERY"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

/** Mirrors `CouponService.format` in the backend. */
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perPhoneLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perPhoneLimit: number | null;
  isActive: boolean;
}

export interface ListCouponsParams {
  search?: string;
  page?: number;
  limit?: number;
}

const qs = (params: ListCouponsParams) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : "";
};

/** Coupon management (`/admin/coupons`, admins & managers). */
export const couponsApi = {
  list: (params: ListCouponsParams = {}, signal?: AbortSignal) =>
    apiRequest<Paginated<Coupon>>(`/admin/coupons${qs(params)}`, { signal }),
  create: (input: CouponInput) => apiRequest<Coupon>("/admin/coupons", { method: "POST", body: input }),
  update: (id: string, input: Partial<CouponInput>) =>
    apiRequest<Coupon>(`/admin/coupons/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<null>(`/admin/coupons/${id}`, { method: "DELETE" }),
};
