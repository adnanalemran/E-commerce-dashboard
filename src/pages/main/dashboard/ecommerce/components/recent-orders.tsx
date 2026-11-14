import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslations } from "@/i18n";
import { formatTaka } from "@/utils/currency";
import { Link } from "react-router";
import { OrderStatusBadge } from "../../../orders/order-badges";
import { useOrderList } from "../../../orders/use-orders";

export default function RecentOrders() {
  const t = useTranslations("ecommerce.recentOrders");
  const locale = useLocale();
  const { data, isLoading } = useOrderList({ page: 1, limit: 6 });
  const time = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const items = data?.items;

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-label">{t("title")}</h3>
          <p className="text-sm text-label-secondary">{t("subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/orders" />}>
          {t("viewAll")}
        </Button>
      </div>

      {isLoading && !items ? (
        <div className="space-y-2 px-5 pb-5 sm:px-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="px-6 pt-6 pb-10 text-center text-sm text-label-secondary">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-separator border-t border-separator">
          {items.map((order) => (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-fill sm:px-6">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-medium text-label">{order.orderNumber}</span>
                  <span className="block truncate text-xs text-label-secondary">
                    {order.customerName} · {time.format(new Date(order.createdAt))}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-label">{formatTaka(order.total, locale)}</span>
                <span className="w-24 shrink-0 text-end">
                  <OrderStatusBadge status={order.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
