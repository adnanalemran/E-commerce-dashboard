import { categoriesApi } from "@/api/categories";
import { productsApi, type AdminListProductsParams } from "@/api/products";
import { useEffect, useState } from "react";

/** Bangladeshi Taka, e.g. "৳1,890" or "৳950.50". */
export function formatPrice(amount: number, locale: string): string {
  return `৳${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)}`;
}

export interface CategoryOption {
  value: string;
  label: string;
}

/** Categories and subcategories as "Honey › Sundarban Honey" options. */
export function useCategoryOptions() {
  const [options, setOptions] = useState<CategoryOption[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    categoriesApi
      .tree(controller.signal)
      .then((tree) =>
        setOptions(
          tree.flatMap((root) => [
            { value: root.id, label: root.name },
            ...root.subcategories.map((sub) => ({
              value: sub.id,
              label: `${root.name} › ${sub.name}`,
            })),
          ]),
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setOptions([]);
      });
    return () => controller.abort();
  }, []);

  return { options: options ?? [], isLoading: options === null };
}

interface ListResult {
  key: string;
  data?: Awaited<ReturnType<typeof productsApi.list>>;
  error?: unknown;
}

/** Fetches a page of products; previous results stay visible while loading. */
export function useProductList(
  { status, categoryId, stock, search, sort, page, limit }: AdminListProductsParams,
  reloadKey: number,
) {
  const key = JSON.stringify([status, categoryId, stock, search, sort, page, limit, reloadKey]);
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    productsApi
      .list({ status, categoryId, stock, search, sort, page, limit }, controller.signal)
      .then((data) => setResult({ key, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      });
    return () => controller.abort();
  }, [key, status, categoryId, stock, search, sort, page, limit]);

  const isCurrent = result?.key === key;
  return {
    data: result?.data,
    error: isCurrent ? result.error : undefined,
    isLoading: !isCurrent,
  };
}
