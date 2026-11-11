import {
  categoriesApi,
  type Category,
  type ListCategoriesParams,
  type Paginated,
} from "@/api/categories";
import { queryKeys } from "@/api/query-client";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A page of categories. Previous results stay visible while the next page or
 * filter loads (`isLoading` is true until the current params have data).
 */
export function useCategoryList(params: ListCategoriesParams) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.categories.list(params);

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => categoriesApi.list(params, signal),
    placeholderData: keepPreviousData,
  });

  /** Swap one row for its updated version without refetching. */
  const replaceItem = (updated: Category) =>
    queryClient.setQueryData<Paginated<Category>>(queryKey, (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );

  return {
    data: query.data,
    error: query.isPlaceholderData ? undefined : (query.error ?? undefined),
    isLoading: query.isPending || query.isPlaceholderData,
    replaceItem,
  };
}

/** All top-level categories (max 100), for parent pickers and filters. */
export function useRootCategories(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.categories.roots,
    queryFn: ({ signal }) => categoriesApi.list({ type: "root", limit: 100 }, signal),
    enabled,
  });

  return {
    items: query.data?.items ?? [],
    isLoading: enabled && query.isPending,
  };
}

/** Refetch everything that shows categories (lists, pickers, product rows). */
export function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };
}
