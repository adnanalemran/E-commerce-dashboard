import {
  categoriesApi,
  type Category,
  type ListCategoriesParams,
  type Paginated,
} from "@/api/categories";
import { useEffect, useState } from "react";

interface ListResult {
  key: string;
  data?: Paginated<Category>;
  error?: unknown;
}

/**
 * Fetches a page of categories. Previous results stay visible while the next
 * request is in flight; bump `reloadKey` to refetch the same page.
 */
export function useCategoryList(
  { type, parentId, search, page, limit }: ListCategoriesParams,
  reloadKey: number,
) {
  const key = JSON.stringify([type, parentId, search, page, limit, reloadKey]);
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    categoriesApi
      .list({ type, parentId, search, page, limit }, controller.signal)
      .then((data) => setResult({ key, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      });

    return () => controller.abort();
  }, [key, type, parentId, search, page, limit]);

  const isCurrent = result?.key === key;

  /** Swap one row for its updated version without refetching. */
  const replaceItem = (updated: Category) =>
    setResult((prev) =>
      prev?.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              items: prev.data.items.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            },
          }
        : prev,
    );

  return {
    data: result?.data,
    error: isCurrent ? result.error : undefined,
    isLoading: !isCurrent,
    replaceItem,
  };
}

/** All top-level categories (max 100), for parent pickers and filters. */
export function useRootCategories(enabled: boolean, reloadKey: number) {
  const [state, setState] = useState<{ key: number; items: Category[] }>({
    key: -1,
    items: [],
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    categoriesApi
      .list({ type: "root", limit: 100 }, controller.signal)
      .then((data) => setState({ key: reloadKey, items: data.items }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ key: reloadKey, items: [] });
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  return { items: state.items, isLoading: enabled && state.key !== reloadKey };
}
