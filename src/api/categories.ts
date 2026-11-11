import { apiRequest } from "./client";

/** Mirrors `CategoryResponse` in the backend (`modules/categories/category.types.ts`). */
export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isFeatured: boolean;
  orderNo: number;
  parentId: string | null;
  parent: { id: string; name: string; slug: string } | null;
  subcategoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  subcategories: Category[];
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListCategoriesParams {
  /** `root` = top-level categories, `sub` = subcategories. */
  type?: "root" | "sub" | "all";
  parentId?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  /** Max 100. */
  limit?: number;
}

export interface CategoryInput {
  name: string;
  /** `null` = top-level category. */
  parentId: string | null;
  isFeatured: boolean;
  /** Omit to append at the end. */
  orderNo?: number;
  image?: File | null;
  /** Update only: clear the current image. */
  removeImage?: boolean;
}

function toQueryString(params: ListCategoriesParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function toFormData(input: Partial<CategoryInput>): FormData {
  const form = new FormData();
  if (input.name !== undefined) form.append("name", input.name);
  if (input.parentId !== undefined) form.append("parentId", input.parentId ?? "");
  if (input.isFeatured !== undefined) {
    form.append("isFeatured", String(input.isFeatured));
  }
  if (input.orderNo !== undefined) form.append("orderNo", String(input.orderNo));
  if (input.removeImage) form.append("removeImage", "true");
  if (input.image) form.append("image", input.image);
  return form;
}

/** Public reads under `/categories`, admin writes under `/admin/categories`. */
export const categoriesApi = {
  list: (params: ListCategoriesParams = {}, signal?: AbortSignal) =>
    apiRequest<Paginated<Category>>(`/categories${toQueryString(params)}`, {
      signal,
    }),

  tree: (signal?: AbortSignal) =>
    apiRequest<CategoryTreeNode[]>("/categories/tree", { signal }),

  get: (idOrSlug: string, signal?: AbortSignal) =>
    apiRequest<CategoryTreeNode>(
      `/categories/${encodeURIComponent(idOrSlug)}`,
      { signal },
    ),

  create: (input: CategoryInput) =>
    apiRequest<Category>("/admin/categories", {
      method: "POST",
      body: toFormData(input),
    }),

  update: (id: string, input: Partial<CategoryInput>) =>
    apiRequest<Category>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: toFormData(input),
    }),

  remove: (id: string) =>
    apiRequest<null>(`/admin/categories/${id}`, { method: "DELETE" }),
};
