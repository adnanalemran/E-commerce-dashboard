import type { Category } from "@/api/categories";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import type { ReactNode } from "react";
import CategoryThumb from "./category-thumb";
import type { CategoryLevel } from "./types";

export interface CategoryTableProps {
  level: CategoryLevel;
  items: Category[];
  /** Show skeleton rows (first load only). */
  isLoading: boolean;
  pageSize: number;
  /** IDs whose featured flag is being saved. */
  pendingFeaturedIds: ReadonlySet<string>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleFeatured: (category: Category, isFeatured: boolean) => void;
  emptyState: ReactNode;
}

const headCell =
  "h-11 px-4 py-3 text-start text-sm font-normal whitespace-nowrap text-gray-500 dark:text-gray-400";
const bodyCell = "px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300";

export default function CategoryTable({
  level,
  items,
  isLoading,
  pageSize,
  pendingFeaturedIds,
  onEdit,
  onDelete,
  onToggleFeatured,
  emptyState,
}: CategoryTableProps) {
  const t = useTranslations("catalog");
  const isSub = level === "sub";
  const columnCount = 5;

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
          <TableRow>
            <TableCell isHeader className={cn(headCell, "min-w-64 ps-5 sm:ps-6")}>
              {t("columns.name")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-40")}>
              {isSub ? t("columns.parent") : t("columns.subcategories")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-20")}>
              {t("columns.orderNo")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-24")}>
              {t("columns.featured")}
            </TableCell>
            <TableCell
              isHeader
              className={cn(headCell, "min-w-24 pe-5 text-end sm:pe-6")}
            >
              {t("columns.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && items.length === 0 ? (
            Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-lg bg-gray-100 dark:bg-white/5" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-32 bg-gray-100 dark:bg-white/5" />
                      <Skeleton className="h-3 w-20 bg-gray-100 dark:bg-white/5" />
                    </div>
                  </div>
                </TableCell>
                {Array.from({ length: columnCount - 1 }, (_, cell) => (
                  <TableCell key={cell} className={bodyCell}>
                    <Skeleton className="h-3.5 w-12 bg-gray-100 dark:bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="px-5 py-12 sm:px-6">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            items.map((category) => (
              <TableRow key={category.id}>
                <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                  <div className="flex items-center gap-3">
                    <CategoryThumb src={category.image} alt={category.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800 dark:text-white/90">
                        {category.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        /{category.slug}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className={bodyCell}>
                  {isSub
                    ? (category.parent?.name ?? "—")
                    : t("subcategoryCount", { count: category.subcategoryCount })}
                </TableCell>

                <TableCell className={cn(bodyCell, "tabular-nums")}>
                  {category.orderNo}
                </TableCell>

                <TableCell className={bodyCell}>
                  <Switch
                    size="sm"
                    checked={category.isFeatured}
                    disabled={pendingFeaturedIds.has(category.id)}
                    onCheckedChange={(checked) =>
                      onToggleFeatured(category, checked)
                    }
                    aria-label={t("actions.featured", { name: category.name })}
                  />
                </TableCell>

                <TableCell className={cn(bodyCell, "pe-5 sm:pe-6")}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(category)}
                      aria-label={t("actions.edit", { name: category.name })}
                      className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(category)}
                      aria-label={t("actions.delete", { name: category.name })}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <TrashBinIcon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
