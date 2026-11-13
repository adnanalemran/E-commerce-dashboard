import { REVIEW_STATUSES, reviewsApi, type AdminReview, type ReviewStatus } from "@/api/content";
import { queryKeys } from "@/api/query-client";
import { ConfirmDeleteDialog, ListCard, ListState } from "@/components/shared/crud";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import TablePagination from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/i18n";
import { StarIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import { getApiErrorMessage } from "@/utils/form-errors";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

const PAGE_SIZE = 20;
const STATUS_COLOR = { PENDING: "warning", APPROVED: "success", REJECTED: "gray" } as const;

export default function ReviewsPage() {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const params = { status, page, limit: PAGE_SIZE };
  const query = useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: ({ signal }) => reviewsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const items = query.data?.items ?? [];

  const moderate = async (review: AdminReview, next: ReviewStatus) => {
    setBusyId(review.id);
    setActionError(null);
    try {
      await reviewsApi.moderate(review.id, next);
      refresh();
    } catch (error) {
      setActionError(getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      <ListCard title={t("listTitle")} description={t("description")}>
        <div role="group" aria-label={t("filter")} className="flex gap-1 overflow-x-auto px-5 pb-4 sm:px-6">
          {REVIEW_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                status === value ? "bg-accent-soft text-accent" : "text-label-secondary hover:bg-fill hover:text-label",
              )}
            >
              {t(`statuses.${value}`)}
              <span className="tabular-nums text-xs opacity-70">{query.data?.counts[value] ?? 0}</span>
            </button>
          ))}
        </div>
        {actionError && <p className="px-6 pb-3 text-sm text-danger">{actionError}</p>}
        <ListState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={items.length === 0}
          emptyTitle={t(`empty.${status}`)}
          onRetry={() => void query.refetch()}
        >
          <ul className="divide-y divide-separator border-t border-separator">
            {items.map((r) => (
              <li key={r.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex text-warning" aria-label={t("stars", { count: r.rating })}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} className={cn("size-4", i < r.rating ? "opacity-100" : "opacity-25")} aria-hidden="true" />
                    ))}
                  </span>
                  <Link to={`/products/${r.product.id}/edit`} className="font-medium text-label hover:text-accent">
                    {r.product.name}
                  </Link>
                  <Badge variant="light" color={STATUS_COLOR[r.status]} size="sm">
                    {t(`statuses.${r.status}`)}
                  </Badge>
                  {r.verifiedPurchase && (
                    <Badge variant="light" color="primary" size="sm">
                      {t("verified")}
                    </Badge>
                  )}
                </div>
                {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-label">{r.comment}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-label-secondary">
                    {r.author.name}
                    {r.author.phone && ` · ${r.author.phone}`} · {date.format(new Date(r.createdAt))}
                  </p>
                  <div className="flex gap-2">
                    {r.status !== "APPROVED" && (
                      <Button size="sm" disabled={busyId === r.id} onClick={() => void moderate(r, "APPROVED")}>
                        {t("approve")}
                      </Button>
                    )}
                    {r.status !== "REJECTED" && (
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void moderate(r, "REJECTED")}>
                        {t("reject")}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" aria-label={t("delete")} onClick={() => setDeleting(r)}>
                      <TrashBinIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ListState>
        {query.data && items.length > 0 && (
          <TablePagination
            page={query.data.pagination.page}
            totalPages={query.data.pagination.totalPages}
            total={query.data.pagination.total}
            pageSize={query.data.pagination.limit}
            onPageChange={setPage}
          />
        )}
      </ListCard>
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={async () => {
          await reviewsApi.remove(deleting!.id);
          refresh();
        }}
      />
    </>
  );
}
