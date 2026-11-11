import type { Product } from "@/api/products";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "@/i18n";
import { PencilIcon, TagIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { ProductFlags, ProductStatusBadge, StockBadge } from "./shared";
import { formatPrice } from "./use-products";

const headCell =
  "h-11 px-4 py-3 text-start text-sm font-normal whitespace-nowrap text-gray-500 dark:text-gray-400";
const bodyCell = "px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300";
const COLUMN_COUNT = 6;

export interface ProductTableProps {
  items: Product[];
  isLoading: boolean;
  pageSize: number;
  onDelete: (product: Product) => void;
  emptyState: ReactNode;
}

export default function ProductTable({
  items,
  isLoading,
  pageSize,
  onDelete,
  emptyState,
}: ProductTableProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
          <TableRow>
            <TableCell isHeader className={cn(headCell, "min-w-80 ps-5 sm:ps-6")}>
              {t("columns.product")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-40")}>
              {t("columns.category")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-36")}>
              {t("columns.price")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-28")}>
              {t("columns.stock")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-24")}>
              {t("columns.status")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-24 pe-5 text-end sm:pe-6")}>
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
                    <Skeleton className="size-14 rounded-lg bg-gray-100 dark:bg-white/5" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-40 bg-gray-100 dark:bg-white/5" />
                      <Skeleton className="h-3 w-24 bg-gray-100 dark:bg-white/5" />
                    </div>
                  </div>
                </TableCell>
                {Array.from({ length: COLUMN_COUNT - 1 }, (_, cell) => (
                  <TableCell key={cell} className={bodyCell}>
                    <Skeleton className="h-3.5 w-16 bg-gray-100 dark:bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="px-5 py-12 sm:px-6">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            items.map((product) => {
              const editPath = `/products/${product.id}/edit`;
              const hasRange = product.priceRange.min !== product.priceRange.max;

              return (
                <TableRow key={product.id}>
                  <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-white/3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <TagIcon className="size-5" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={editPath}
                          className="block truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400"
                        >
                          {product.name}
                        </Link>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {t("variantCount", { count: product.variants.length })}
                          {product.variants[0]?.sku ? ` · ${product.variants[0].sku}` : ""}
                        </p>
                        <ProductFlags product={product} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className={bodyCell}>
                    {product.category ? (
                      <span>
                        {product.category.parent && (
                          <span className="text-gray-400 dark:text-gray-500">
                            {product.category.parent.name} ›{" "}
                          </span>
                        )}
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t("uncategorized")}</span>
                    )}
                  </TableCell>

                  <TableCell className={cn(bodyCell, "whitespace-nowrap tabular-nums")}>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {hasRange
                        ? `${formatPrice(product.priceRange.min, locale)} – ${formatPrice(product.priceRange.max, locale)}`
                        : formatPrice(product.price, locale)}
                    </div>
                    {product.compareAtPrice !== null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 line-through">
                          {formatPrice(product.compareAtPrice, locale)}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-500">
                          {t("save", { percent: product.discountPercent })}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className={cn(bodyCell, "whitespace-nowrap")}>
                    <div className="flex flex-col items-start gap-1">
                      <span className="tabular-nums">{product.totalStock}</span>
                      <StockBadge stock={product.totalStock} />
                    </div>
                  </TableCell>

                  <TableCell className={bodyCell}>
                    <ProductStatusBadge status={product.status} />
                  </TableCell>

                  <TableCell className={cn(bodyCell, "pe-5 sm:pe-6")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link to={editPath} />}
                        nativeButton={false}
                        aria-label={t("actions.edit", { name: product.name })}
                        className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(product)}
                        aria-label={t("actions.delete", { name: product.name })}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <TrashBinIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
