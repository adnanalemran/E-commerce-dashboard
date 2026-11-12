import { couponsApi, type Coupon } from "@/api/coupons";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import TablePagination from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocale, useTranslations } from "@/i18n";
import { PencilIcon, PlusIcon, SearchIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState } from "react";
import CouponFormDialog from "./coupon-form-dialog";
import { useCouponList, useInvalidateCoupons } from "./use-coupons";

const PAGE_SIZE = 15;
const headCell = "h-11 px-4 py-3 text-start text-sm font-normal whitespace-nowrap text-label-secondary";
const bodyCell = "px-4 py-3.5 text-sm text-label";

type CouponState = "active" | "scheduled" | "expired" | "usedUp" | "inactive";

function stateOf(coupon: Coupon, now: number): CouponState {
  if (!coupon.isActive) return "inactive";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "usedUp";
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) return "expired";
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return "scheduled";
  return "active";
}

const STATE_COLOR = { active: "success", scheduled: "info", expired: "gray", usedUp: "warning", inactive: "gray" } as const;

export default function CouponsPage() {
  const t = useTranslations("coupons");
  const locale = useLocale();
  const money = (n: number) => formatTaka(n, locale);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const invalidate = useInvalidateCoupons();

  const { data, error, isLoading, refetch } = useCouponList({ search: debounced || undefined, page, limit: PAGE_SIZE });
  const items = data?.items ?? [];
  // Status is judged against when this page of data arrived.
  const [now] = useState(() => Date.now());

  const valueText = (c: Coupon) =>
    c.type === "PERCENT"
      ? t("valuePercent", { value: c.value }) + (c.maxDiscount !== null ? ` · ${t("upTo", { amount: money(c.maxDiscount) })}` : "")
      : c.type === "FIXED"
        ? t("valueFixed", { amount: money(c.value) })
        : t("types.FREE_DELIVERY");

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-label">{t("listTitle")}</h3>
            <p className="text-sm text-label-secondary">{t("description")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="h-10 sm:w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-5 text-label-tertiary" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
              />
            </InputGroup>
            <Button onClick={openCreate}>
              <PlusIcon className="size-5" aria-hidden="true" />
              {t("create")}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="border-t border-separator px-6 py-12 text-center">
            <p className="text-sm text-label">{getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
              {t("errors.retry")}
            </Button>
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className="border-t border-separator px-6 py-14 text-center">
            <p className="font-medium text-label">{debounced ? t("noResults") : t("empty")}</p>
            <p className="mt-1 text-sm text-label-secondary">{debounced ? t("noResultsHint") : t("emptyHint")}</p>
            {!debounced && (
              <Button className="mt-4" onClick={openCreate}>
                {t("create")}
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <Table>
              <TableHeader className="border-y border-separator">
                <TableRow>
                  <TableCell isHeader className={cn(headCell, "min-w-48 ps-5 sm:ps-6")}>{t("columns.code")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-40")}>{t("columns.discount")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-32")}>{t("columns.conditions")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-28")}>{t("columns.used")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-40")}>{t("columns.validity")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-24")}>{t("columns.status")}</TableCell>
                  <TableCell isHeader className={cn(headCell, "min-w-24 pe-5 text-end sm:pe-6")}>{t("columns.actions")}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-separator">
                {isLoading && items.length === 0
                  ? Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="px-5 py-3.5 sm:px-6">
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : items.map((c) => {
                      const state = stateOf(c, now);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                            <span className="font-mono font-semibold">{c.code}</span>
                            {c.description && <span className="block max-w-56 truncate text-xs text-label-secondary">{c.description}</span>}
                          </TableCell>
                          <TableCell className={bodyCell}>{valueText(c)}</TableCell>
                          <TableCell className={cn(bodyCell, "text-label-secondary")}>
                            {c.minSubtotal !== null ? t("minOrder", { amount: money(c.minSubtotal) }) : "—"}
                            {c.perPhoneLimit !== null && <span className="block text-xs">{t("perPhone", { count: c.perPhoneLimit })}</span>}
                          </TableCell>
                          <TableCell className={cn(bodyCell, "tabular-nums")}>
                            {c.usageLimit !== null ? `${c.usedCount} / ${c.usageLimit}` : c.usedCount}
                          </TableCell>
                          <TableCell className={cn(bodyCell, "text-label-secondary")}>
                            {c.startsAt || c.endsAt
                              ? `${c.startsAt ? dateFmt.format(new Date(c.startsAt)) : "…"} – ${c.endsAt ? dateFmt.format(new Date(c.endsAt)) : "…"}`
                              : t("always")}
                          </TableCell>
                          <TableCell className={bodyCell}>
                            <Badge variant="light" color={STATE_COLOR[state]} size="sm">
                              {t(`states.${state}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(bodyCell, "pe-5 text-end sm:pe-6")}>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("edit", { code: c.code })}
                                onClick={() => {
                                  setEditing(c);
                                  setFormOpen(true);
                                }}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" aria-label={t("delete.label", { code: c.code })} onClick={() => setDeleting(c)}>
                                <TrashBinIcon className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {data && !error && items.length > 0 && (
          <TablePagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            pageSize={data.pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      <CouponFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editing}
        onSaved={() => {
          setFormOpen(false);
          invalidate();
        }}
      />
      <DeleteCouponDialog
        coupon={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          invalidate();
        }}
      />
    </>
  );
}

function DeleteCouponDialog({
  coupon,
  onOpenChange,
  onDeleted,
}: {
  coupon: Coupon | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("coupons");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!coupon) return;
    setBusy(true);
    setError(null);
    try {
      await couponsApi.remove(coupon.id);
      onDeleted();
    } catch (err) {
      setError(getApiErrorMessage(err, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={coupon !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-md sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-label">{t("delete.title", { code: coupon?.code ?? "" })}</DialogTitle>
          <DialogDescription className="text-sm text-label-secondary">
            {coupon && coupon.usedCount > 0 ? t("delete.usedDescription") : t("delete.description")}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
          <DialogClose
            render={
              <Button variant="outline" type="button" disabled={busy}>
                {t("form.cancel")}
              </Button>
            }
          />
          <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
            {busy ? t("delete.deleting") : t("delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
