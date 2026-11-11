import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Compact page list: 1 … 4 5 6 … 10 */
function getPageNumbers(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1]! > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export default function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  const t = useTranslations("catalog.pagination");
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:px-6 dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("summary", { from, to, total })}
      </p>

      {totalPages > 1 && (
        <nav aria-label={t("label")} className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t("previous")}
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" />
          </Button>

          {getPageNumbers(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-sm text-gray-400 dark:text-gray-500"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="icon-sm"
                aria-current={item === page ? "page" : undefined}
                aria-label={t("page", { page: item })}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t("next")}
          >
            <ChevronRightIcon className="size-4 rtl:rotate-180" />
          </Button>
        </nav>
      )}
    </div>
  );
}
