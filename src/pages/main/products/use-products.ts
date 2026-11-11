import { categoriesApi } from "@/api/categories";
import { productsApi, type AdminListProductsParams, type Product } from "@/api/products";
import { queryKeys } from "@/api/query-client";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

export { formatTaka as formatPrice } from "@/utils/currency";

export interface CategoryOption {
  value: string;
  label: string;
}

/** Categories and subcategories as "Honey › Sundarban Honey" options. */
export function useCategoryOptions() {
  const query = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: ({ signal }) => categoriesApi.tree(signal),
    select: (tree): CategoryOption[] =>
      tree.flatMap((root) => [
        { value: root.id, label: root.name },
        ...root.subcategories.map((sub) => ({
          value: sub.id,
          label: `${root.name} › ${sub.name}`,
        })),
      ]),
  });

  return { options: query.data ?? [], isLoading: query.isPending };
}

/**
 * A page of products (+ status/stock counts). Previous results stay visible
 * while the next page or filter loads.
 */
export function useProductList(params: AdminListProductsParams) {
  const query = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    error: query.isPlaceholderData ? undefined : (query.error ?? undefined),
    isLoading: query.isPending || query.isPlaceholderData,
  };
}

/** One product for the editor. */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: ({ signal }) => productsApi.get(id!, signal),
    enabled: Boolean(id),
  });
}

/**
 * After a product changes: store the fresh copy for the editor and refetch
 * lists (prices, stock and counts may all have changed).
 */
export function useProductCache() {
  const queryClient = useQueryClient();
  return {
    store: (product: Product) => {
      queryClient.setQueryData(queryKeys.products.detail(product.id), product);
      void queryClient.invalidateQueries({ queryKey: ["products", "list"] });
    },
    invalidateAll: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Category product counts change with products.
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  };
}
