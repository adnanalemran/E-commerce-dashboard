import { categoriesApi, type Category } from "@/api/categories";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { InfoCircleIcon, OctagonAlertIcon, PlusIcon, SearchIcon } from "@/icons";
import { cn } from "@/utils";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState } from "react";
import { Link } from "react-router";
import CategoryFormDialog from "./category-form-dialog";
import CategoryTable from "./category-table";
import DeleteCategoryDialog from "./delete-category-dialog";
import TablePagination from "./table-pagination";
import { PAGE_SIZE, type CategoryLevel } from "./types";
import { useCategoryList, useRootCategories } from "./use-categories";

const ALL_PARENTS = "all";

/** Searchable, paginated CRUD table for categories (`root`) or subcategories (`sub`). */
export default function CategoryManager({ level }: { level: CategoryLevel }) {
  const t = useTranslations("catalog");
  const isSub = level === "sub";
  const section = isSub ? "subcategories" : "categories";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [parentFilter, setParentFilter] = useState(ALL_PARENTS);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const { data, error, isLoading, replaceItem } = useCategoryList(
    {
      type: level,
      parentId: parentFilter === ALL_PARENTS ? undefined : parentFilter,
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    },
    reloadKey,
  );
  const roots = useRootCategories(isSub, 0);

  const [formState, setFormState] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [featuredOverrides, setFeaturedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);

  const errorMessages = {
    network: t("errors.network"),
    unexpected: t("errors.unexpected"),
  };

  const items = (data?.items ?? []).map((category) =>
    category.id in featuredOverrides
      ? { ...category, isFeatured: featuredOverrides[category.id]! }
      : category,
  );
  const pagination = data?.pagination;
  const isFiltered = Boolean(debouncedSearch) || parentFilter !== ALL_PARENTS;
  const needsParent = isSub && !roots.isLoading && roots.items.length === 0;

  const reload = () => setReloadKey((key) => key + 1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleParentFilterChange = (value: string | null) => {
    setParentFilter(value ?? ALL_PARENTS);
    setPage(1);
  };

  const openCreate = () => setFormState({ open: true, category: null });
  const openEdit = (category: Category) =>
    setFormState({ open: true, category });

  const handleSaved = () => {
    setFormState((prev) => ({ ...prev, open: false }));
    setActionError(null);
    reload();
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    setActionError(null);
    // Step back when the last row of a page was removed.
    if (items.length === 1 && page > 1) setPage(page - 1);
    else reload();
  };

  const handleToggleFeatured = async (category: Category, isFeatured: boolean) => {
    setActionError(null);
    setFeaturedOverrides((prev) => ({ ...prev, [category.id]: isFeatured }));
    try {
      const updated = await categoriesApi.update(category.id, { isFeatured });
      replaceItem(updated);
    } catch (err) {
      setActionError(getApiErrorMessage(err, errorMessages));
    } finally {
      setFeaturedOverrides(({ [category.id]: _removed, ...rest }) => rest);
    }
  };

  const filterItems = [
    { value: ALL_PARENTS, label: t("subcategories.allParents") },
    ...roots.items.map((root) => ({ value: root.id, label: root.name })),
  ];

  const emptyState = (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
      <p className="font-medium text-gray-800 dark:text-white/90">
        {isFiltered ? t("noResults") : t(`${section}.empty`)}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isFiltered ? t("noResultsHint") : t(`${section}.emptyDescription`)}
      </p>
      {!isFiltered && !needsParent && (
        <Button size="sm" className="mt-2" onClick={openCreate}>
          <PlusIcon className="size-4" />
          {t(`${section}.add`)}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {needsParent && (
        <Alert variant="info" className="p-4">
          <InfoCircleIcon className="size-5" />
          <AlertTitle className="text-sm">
            {t("subcategories.noParentsTitle")}
          </AlertTitle>
          <AlertDescription>
            <Link
              to="/categories"
              className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              {t("subcategories.noParentsAction")}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t(`${section}.listTitle`)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(`${section}.description`)}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="h-10 sm:w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-5 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder={t(`${section}.searchPlaceholder`)}
                aria-label={t(`${section}.searchPlaceholder`)}
              />
            </InputGroup>

            {isSub && (
              <Select
                items={filterItems}
                value={parentFilter}
                onValueChange={handleParentFilterChange}
              >
                <SelectTrigger
                  size="sm"
                  className="h-10 sm:w-52"
                  aria-label={t("subcategories.filterLabel")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              className="h-10 shrink-0"
              onClick={openCreate}
              disabled={needsParent || (isSub && roots.isLoading)}
            >
              <PlusIcon className="size-4" />
              {t(`${section}.add`)}
            </Button>
          </div>
        </div>

        {actionError && (
          <div className="px-5 pb-4 sm:px-6">
            <Alert variant="destructive" className="p-3">
              <OctagonAlertIcon className="size-5" />
              <AlertTitle className="text-sm">{actionError}</AlertTitle>
            </Alert>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-12 text-center dark:border-gray-800">
            <p className="font-medium text-gray-800 dark:text-white/90">
              {t("errors.loadFailed")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getApiErrorMessage(error, errorMessages)}
            </p>
            <Button variant="outline" size="sm" onClick={reload}>
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
            <CategoryTable
              level={level}
              items={items}
              isLoading={isLoading}
              pageSize={PAGE_SIZE}
              pendingFeaturedIds={new Set(Object.keys(featuredOverrides))}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggleFeatured={handleToggleFeatured}
              emptyState={emptyState}
            />
          </div>
        )}

        {pagination && !error && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      <CategoryFormDialog
        open={formState.open}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
        level={level}
        category={formState.category}
        parents={roots.items}
        defaultParentId={parentFilter === ALL_PARENTS ? undefined : parentFilter}
        onSaved={handleSaved}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
