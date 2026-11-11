import type { Paginated } from "./categories";
import { apiRequest } from "./client";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  position: number;
}

export interface ProductImage {
  id: string;
  url: string;
  position: number;
}

/** Mirrors `ProductService.format` in the backend. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; name: string; slug: string } | null;
  } | null;
  isFeatured: boolean;
  isBestSelling: boolean;
  isNewArrival: boolean;
  tags: string[];
  orderNo: number;
  /** Price of the first variant (what product cards show). */
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  priceRange: { min: number; max: number };
  totalStock: number;
  inStock: boolean;
  image: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCounts {
  all: number;
  active: number;
  draft: number;
  archived: number;
  outOfStock: number;
  lowStock: number;
}

export interface AdminListProductsParams {
  status?: ProductStatus;
  categoryId?: string;
  stock?: "in" | "low" | "out";
  search?: string;
  sort?: "newest" | "updated" | "name" | "price_asc" | "price_desc" | "stock_asc";
  page?: number;
  limit?: number;
}

export interface VariantInput {
  id?: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export interface ProductInput {
  name: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  categoryId: string | null;
  isFeatured: boolean;
  isBestSelling: boolean;
  isNewArrival: boolean;
  tags: string[];
  orderNo?: number;
  variants: VariantInput[];
}

/** Stock at or below this counts as low (matches the backend). */
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_PRODUCT_IMAGES = 10;

function toQueryString(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Dashboard product management (`/admin/products`, admins & managers). */
export const productsApi = {
  list: (params: AdminListProductsParams = {}, signal?: AbortSignal) =>
    apiRequest<Paginated<Product> & { counts: ProductCounts }>(
      `/admin/products${toQueryString(params)}`,
      { signal },
    ),

  get: (id: string, signal?: AbortSignal) =>
    apiRequest<Product>(`/admin/products/${id}`, { signal }),

  create: (input: ProductInput) =>
    apiRequest<Product>("/admin/products", { method: "POST", body: input }),

  update: (id: string, input: Partial<ProductInput>) =>
    apiRequest<Product>(`/admin/products/${id}`, { method: "PATCH", body: input }),

  remove: (id: string) =>
    apiRequest<null>(`/admin/products/${id}`, { method: "DELETE" }),

  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return apiRequest<Product>(`/admin/products/${id}/images`, {
      method: "POST",
      body: form,
    });
  },

  removeImage: (id: string, imageId: string) =>
    apiRequest<Product>(`/admin/products/${id}/images/${imageId}`, {
      method: "DELETE",
    }),

  reorderImages: (id: string, imageIds: string[]) =>
    apiRequest<Product>(`/admin/products/${id}/images/order`, {
      method: "PUT",
      body: { imageIds },
    }),
};
