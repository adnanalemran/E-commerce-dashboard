import type { Paginated } from "./categories";
import { apiRequest } from "./client";

/** Brands, banners, CMS pages, reviews, gift rules and reports (`/admin/*`). */

type FormValue = string | number | boolean | null | undefined;

const toForm = (fields: Record<string, FormValue>, file?: { key: string; value: File | null }) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    form.append(key, value === null ? "" : String(value));
  }
  if (file?.value) form.append(file.key, file.value);
  return form;
};

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  isFeatured: boolean;
  orderNo: number;
  productCount: number;
}

export interface BrandInput {
  name: string;
  description: string | null;
  isFeatured: boolean;
  orderNo?: number;
  logo?: File | null;
  removeLogo?: boolean;
}

export const brandsApi = {
  list: (signal?: AbortSignal) => apiRequest<Brand[]>("/admin/brands", { signal }),
  create: ({ logo, ...fields }: BrandInput) =>
    apiRequest<Brand>("/admin/brands", { method: "POST", body: toForm(fields, { key: "logo", value: logo ?? null }) }),
  update: (id: string, { logo, ...fields }: BrandInput) =>
    apiRequest<Brand>(`/admin/brands/${id}`, { method: "PATCH", body: toForm(fields, { key: "logo", value: logo ?? null }) }),
  remove: (id: string) => apiRequest<null>(`/admin/brands/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export const BANNER_PLACEMENTS = ["HERO", "SIDE", "PROMO"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string | null;
  image: string | null;
  placement: BannerPlacement;
  orderNo: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface BannerInput {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string | null;
  placement: BannerPlacement;
  orderNo: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  image?: File | null;
  removeImage?: boolean;
}

export const bannersApi = {
  list: (signal?: AbortSignal) => apiRequest<Banner[]>("/admin/banners", { signal }),
  create: ({ image, ...fields }: BannerInput) =>
    apiRequest<Banner>("/admin/banners", { method: "POST", body: toForm(fields, { key: "image", value: image ?? null }) }),
  update: (id: string, { image, ...fields }: BannerInput) =>
    apiRequest<Banner>(`/admin/banners/${id}`, { method: "PATCH", body: toForm(fields, { key: "image", value: image ?? null }) }),
  remove: (id: string) => apiRequest<null>(`/admin/banners/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  showInFooter: boolean;
  orderNo: number;
  updatedAt: string;
}

export type PageInput = Pick<ContentPage, "slug" | "title" | "content" | "isPublished" | "showInFooter" | "orderNo">;

export const pagesApi = {
  list: (signal?: AbortSignal) => apiRequest<ContentPage[]>("/admin/pages", { signal }),
  create: (input: PageInput) => apiRequest<ContentPage>("/admin/pages", { method: "POST", body: input }),
  update: (id: string, input: Partial<PageInput>) =>
    apiRequest<ContentPage>(`/admin/pages/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<null>(`/admin/pages/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  author: { name: string; phone: string | null };
  product: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface ListReviewsParams {
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}

export const reviewsApi = {
  list: (params: ListReviewsParams, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v));
    return apiRequest<Paginated<AdminReview> & { counts: Partial<Record<ReviewStatus, number>> }>(`/admin/reviews?${q}`, { signal });
  },
  moderate: (id: string, status: ReviewStatus) =>
    apiRequest<null>(`/admin/reviews/${id}`, { method: "PATCH", body: { status } }),
  remove: (id: string) => apiRequest<null>(`/admin/reviews/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Gift rules
// ---------------------------------------------------------------------------

export interface GiftRule {
  id: string;
  name: string;
  giftVariantId: string;
  product: { id: string; name: string; image: string | null };
  variant: { id: string; name: string; stock: number } | null;
  minSubtotal: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface GiftRuleInput {
  name: string;
  giftVariantId: string;
  minSubtotal: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export const giftsApi = {
  list: (signal?: AbortSignal) => apiRequest<GiftRule[]>("/admin/gift-rules", { signal }),
  create: (input: GiftRuleInput) => apiRequest<GiftRule[]>("/admin/gift-rules", { method: "POST", body: input }),
  update: (id: string, input: Partial<GiftRuleInput>) =>
    apiRequest<GiftRule[]>(`/admin/gift-rules/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) => apiRequest<GiftRule[]>(`/admin/gift-rules/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface SalesReport {
  range: { from: string; to: string };
  totals: {
    orders: number;
    revenue: number;
    averageOrder: number;
    deliveryCharges: number;
    discounts: number;
    paid: number;
    cancelledOrReturned: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
  byPaymentMethod: { method: string; orders: number; revenue: number }[];
  byDistrict: { district: string; orders: number; revenue: number }[];
  topProducts: { slug: string; name: string; quantity: number; revenue: number }[];
}

export const reportsApi = {
  sales: (from: string, to: string, signal?: AbortSignal) =>
    apiRequest<SalesReport>(`/admin/reports/sales?from=${from}&to=${to}`, { signal }),
};

// ---------------------------------------------------------------------------
// Courier
// ---------------------------------------------------------------------------

export const courierApi = {
  status: (signal?: AbortSignal) => apiRequest<{ steadfast: boolean }>("/admin/courier/status", { signal }),
  book: (orderId: string) =>
    apiRequest<{ courier: string; consignmentId: string; trackingCode: string }>(`/admin/orders/${orderId}/courier`, {
      method: "POST",
    }),
  track: (orderId: string) => apiRequest<{ deliveryStatus: string }>(`/admin/orders/${orderId}/courier`),
};
