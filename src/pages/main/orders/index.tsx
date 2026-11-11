import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/api/orders";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import TablePagination from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocale, useTranslations } from "@/i18n";
import { SearchIcon } from "@/icons";
import { cn } from "@/utils";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState } from "react";
import { Link } from "react-router";
import { OrderStatusBadge, PaymentBadge } from "./order-badges";
import { useOrderList, useOrderStats } from "./use-orders";

const PAGE_SIZE = 15;
const ALL = "all";
const STATUS_TABS: (OrderStatus | typeof ALL)[] = [ALL, ...ORDER_STATUSES];

const headCell =
  "h-11 px-4 py-3 text-start text-sm font-normal whitespace-nowrap text-label-secondary";
const bodyCell = "px-4 py-3.5 text-sm text-label";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const money = (n: number) => formatTaka(n, locale);
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const [status, setStatus] = useState<OrderStatus | typeof ALL>(ALL);
  const [payment, setPayment] = useState<PaymentStatus | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);

  const stats = useOrderStats();
  const { data, error, isLoading, refetch } = useOrderList({
    status: status === ALL ? undefined : status,
    paymentStatus: payment === ALL ? undefined : payment,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const counts = data?.counts;
  const isFiltered = status !== ALL || payment !== ALL || Boolean(debouncedSearch);

  const statCards = [
    { label: t("stats.today"), value: stats.data ? String(stats.data.today.orders) : "—", sub: stats.data ? money(stats.data.today.revenue) : "" },
    { label: t("stats.month"), value: stats.data ? money(stats.data.month.revenue) : "—", sub: stats.data ? t("stats.orderCount", { count: stats.data.month.orders }) : "" },
    { label: t("stats.pending"), value: stats.data ? String(stats.data.pending) : "—", sub: t("stats.pendingHint"), onClick: () => { setStatus("PENDING"); setPage(1); } },
  ];

  const paymentItems = [
    { value: ALL, label: t("filters.allPayments") },
    ...(["UNPAID", "PAID", "REFUNDED"] as const).map((value) => ({ value, label: t(`paymentStatuses.${value}`) })),
  ];

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const content = (
            <>
              <p className="text-sm text-label-secondary">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-label">{card.value}</p>
              <p className="mt-0.5 text-xs text-label-secondary">{card.sub}</p>
            </>
          );
          return card.onClick ? (
            <button key={card.label} type="button" onClick={card.onClick} className="surface-card p-5 text-start transition-colors hover:bg-fill">
              {content}
            </button>
          ) : (
            <div key={card.label} className="surface-card p-5">
              {content}
            </div>
          );
        })}
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-label">{t("listTitle")}</h3>
            <p className="text-sm text-label-secondary">{t("description")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="h-10 sm:w-72">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-5 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
              />
            </InputGroup>
            <Select
              items={paymentItems}
              value={payment}
              onValueChange={(value) => {
                setPayment((value as PaymentStatus | null) ?? ALL);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="h-10 sm:w-44" aria-label={t("filters.payment")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div role="group" aria-label={t("filters.status")} className="flex gap-1 overflow-x-auto px-5 pb-4 sm:px-6">
          {STATUS_TABS.map((value) => {
            const active = status === value;
            const count = value === ALL ? counts?.all : counts?.[value];
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-accent-soft text-accent" : "text-label-secondary hover:bg-fill hover:text-label",
                )}
              >
                {value === ALL ? t("filters.all") : t(`statuses.${value}`)}
                {count !== undefined && <span className="text-xs tabular-nums opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 border-t border-separator px-5 py-12 text-center">
            <p className="font-medium text-label">{t("errors.loadFailed")}</p>
            <p className="text-sm text-label-secondary">
              {getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t("errors.retry")}
            </Button>
          </div>
        ) : (
          <div className={cn("transition-opacity", isLoading && items.length > 0 && "pointer-events-none opacity-60")} aria-busy={isLoading}>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader className="border-y border-separator">
                  <TableRow>
                    <TableCell isHeader className={cn(headCell, "min-w-44 ps-5 sm:ps-6")}>{t("columns.order")}</TableCell>
                    <TableCell isHeader className={cn(headCell, "min-w-48")}>{t("columns.customer")}</TableCell>
                    <TableCell isHeader className={cn(headCell, "min-w-20")}>{t("columns.items")}</TableCell>
                    <TableCell isHeader className={cn(headCell, "min-w-28")}>{t("columns.total")}</TableCell>
                    <TableCell isHeader className={cn(headCell, "min-w-44")}>{t("columns.payment")}</TableCell>
                    <TableCell isHeader className={cn(headCell, "min-w-28 pe-5 sm:pe-6")}>{t("columns.status")}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-separator">
                  {isLoading && items.length === 0 ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={`s-${i}`}>
                        {Array.from({ length: 6 }, (_, c) => (
                          <TableCell key={c} className={cn(bodyCell, c === 0 && "ps-5 sm:ps-6")}>
                            <Skeleton className="h-3.5 w-20 bg-fill" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-5 py-12 text-center sm:px-6">
                        <p className="font-medium text-label">{isFiltered ? t("noResults") : t("empty")}</p>
                        <p className="mt-1 text-sm text-label-secondary">{isFiltered ? t("noResultsHint") : t("emptyDescription")}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((order) => (
                      <TableRow key={order.id} className="transition-colors hover:bg-fill/50">
                        <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                          <Link to={`/orders/${order.id}`} className="font-semibold text-accent hover:underline">
                            #{order.orderNumber}
                          </Link>
                          <p className="text-xs text-label-secondary">{dateTime.format(new Date(order.createdAt))}</p>
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-label-secondary tabular-nums">{order.phone}</p>
                        </TableCell>
                        <TableCell className={cn(bodyCell, "tabular-nums")}>{order.itemCount}</TableCell>
                        <TableCell className={cn(bodyCell, "font-semibold tabular-nums")}>{money(order.total)}</TableCell>
                        <TableCell className={bodyCell}>
                          <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className={cn(bodyCell, "pe-5 sm:pe-6")}>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
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
    </>
  );
}
