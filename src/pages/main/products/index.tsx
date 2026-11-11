import type { AdminListProductsParams, Product, ProductStatus } from "@/api/products";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import TablePagination from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTranslations } from "@/i18n";
import { PlusIcon, SearchIcon } from "@/icons";
import { cn } from "@/utils";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState } from "react";
import { Link } from "react-router";
import DeleteProductDialog from "./delete-product-dialog";
import ProductTable from "./product-table";
import { useCategoryOptions, useProductList } from "./use-products";

const PAGE_SIZE = 10;
const ALL = "all";

type StatusTab = ProductStatus | typeof ALL;
type StockFilter = NonNullable<AdminListProductsParams["stock"]> | typeof ALL;
type SortOption = NonNullable<AdminListProductsParams["sort"]>;

const SORTS: SortOption[] = ["newest", "updated", "name", "price_asc", "price_desc", "stock_asc"];

export default function ProductsPage() {
  const t = useTranslations("products");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<StatusTab>(ALL);
  const [stock, setStock] = useState<StockFilter>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const categories = useCategoryOptions();
  const { data, error, isLoading } = useProductList(
    {
      status: status === ALL ? undefined : status,
      stock: stock === ALL ? undefined : stock,
      categoryId: categoryId === ALL ? undefined : categoryId,
      search: debouncedSearch || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    },
    reloadKey,
  );

  const items = data?.items ?? [];
  const counts = data?.counts;
  const isFiltered =
    Boolean(debouncedSearch) || status !== ALL || stock !== ALL || categoryId !== ALL;

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const statusTabs: { value: StatusTab; count?: number }[] = [
    { value: ALL, count: counts?.all },
    { value: "ACTIVE", count: counts?.active },
    { value: "DRAFT", count: counts?.draft },
    { value: "ARCHIVED", count: counts?.archived },
  ];

  const stockItems = (["all", "in", "low", "out"] as StockFilter[]).map((value) => ({
    value,
    label: t(`filters.stock.${value}`),
  }));
  const categoryItems = [
    { value: ALL, label: t("filters.allCategories") },
    ...categories.options,
  ];
  const sortItems = SORTS.map((value) => ({ value, label: t(`sort.${value}`) }));

  const handleDeleted = () => {
    setDeleteTarget(null);
    if (items.length === 1 && page > 1) setPage(page - 1);
    else setReloadKey((key) => key + 1);
  };

  const emptyState = (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
      <p className="font-medium text-gray-800 dark:text-white/90">
        {isFiltered ? t("noResults") : t("empty")}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isFiltered ? t("noResultsHint") : t("emptyDescription")}
      </p>
      {!isFiltered && (
        <Button size="sm" className="mt-2" render={<Link to="/products/new" />} nativeButton={false}>
          <PlusIcon className="size-4" />
          {t("add")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />

      {counts && (counts.outOfStock > 0 || counts.lowStock > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <button
            type="button"
            onClick={() => withPageReset(setStock)("out")}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-start transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/15"
          >
            <span className="block text-xl font-semibold text-red-600 tabular-nums dark:text-red-400">
              {counts.outOfStock}
            </span>
            <span className="text-xs text-red-600/80 dark:text-red-400/80">
              {t("filters.stock.out")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => withPageReset(setStock)("low")}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-start transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
          >
            <span className="block text-xl font-semibold text-amber-600 tabular-nums dark:text-amber-400">
              {counts.lowStock}
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
              {t("filters.stock.low")}
            </span>
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("listTitle")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
          </div>
          <Button className="h-10 shrink-0" render={<Link to="/products/new" />} nativeButton={false}>
            <PlusIcon className="size-4" />
            {t("add")}
          </Button>
        </div>

        <div
          role="group"
          aria-label={t("filters.status")}
          className="flex gap-1 overflow-x-auto px-5 sm:px-6"
        >
          {statusTabs.map((tab) => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={active}
                onClick={() => withPageReset(setStatus)(tab.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300",
                )}
              >
                {tab.value === ALL ? t("filters.all") : t(`statuses.${tab.value}`)}
                {tab.count !== undefined && (
                  <span className="text-xs tabular-nums opacity-70">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
          <InputGroup className="h-10">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-5 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={(event) => withPageReset(setSearch)(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </InputGroup>

          <FilterSelect
            label={t("filters.category")}
            items={categoryItems}
            value={categoryId}
            onChange={withPageReset(setCategoryId)}
          />
          <FilterSelect
            label={t("filters.stockLabel")}
            items={stockItems}
            value={stock}
            onChange={(value) => withPageReset(setStock)(value as StockFilter)}
          />
          <FilterSelect
            label={t("sort.label")}
            items={sortItems}
            value={sort}
            onChange={(value) => withPageReset(setSort)(value as SortOption)}
          />
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-12 text-center dark:border-gray-800">
            <p className="font-medium text-gray-800 dark:text-white/90">{t("errors.loadFailed")}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getApiErrorMessage(error, {
                network: t("errors.network"),
                unexpected: t("errors.unexpected"),
              })}
            </p>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              {t("errors.retry")}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "transition-opacity",
              isLoading && items.length > 0 && "pointer-events-none opacity-60",
            )}
            aria-busy={isLoading}
          >
            <ProductTable
              items={items}
              isLoading={isLoading}
              pageSize={PAGE_SIZE}
              onDelete={setDeleteTarget}
              emptyState={emptyState}
            />
          </div>
        )}

        {data && !error && (
          <TablePagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            pageSize={data.pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      <DeleteProductDialog
        product={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={handleDeleted}
      />
    </>
  );
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger size="sm" className="h-10" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
