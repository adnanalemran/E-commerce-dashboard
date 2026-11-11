import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";
import type { AdminListProductsParams } from "./products";
import type { ListCategoriesParams } from "./categories";
import type { ListUsersParams } from "./users";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Client errors (validation, 401/403/404) won't fix themselves on retry.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

/**
 * Every query key in the app. Invalidate a whole resource with its `all`
 * key (e.g. `queryKeys.products.all`) after a mutation.
 */
export const queryKeys = {
  profile: ["profile"] as const,
  categories: {
    all: ["categories"] as const,
    list: (params: ListCategoriesParams) => ["categories", "list", params] as const,
    roots: ["categories", "roots"] as const,
    tree: ["categories", "tree"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params: AdminListProductsParams) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: ListUsersParams) => ["users", "list", params] as const,
  },
};
