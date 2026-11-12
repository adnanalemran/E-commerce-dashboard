import { ordersApi } from "@/api/orders";
import { queryKeys } from "@/api/query-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts";
import { useLocale, useTranslations } from "@/i18n";
import { BellIcon, XIcon } from "@/icons";
import { formatTaka } from "@/utils/currency";
import { hasAnyRole, STAFF_ROLES } from "@/utils/roles";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

const PENDING_PARAMS = { status: "PENDING", page: 1, limit: 8 } as const;

/** Bell menu: orders waiting for confirmation (staff only). */
export default function NotificationDropdown() {
  const { user } = useAuth();
  if (!hasAnyRole(user?.roles, STAFF_ROLES)) return null;
  return <PendingOrdersMenu />;
}

function PendingOrdersMenu() {
  const t = useTranslations("header.notifications");
  const locale = useLocale();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.orders.list(PENDING_PARAMS),
    queryFn: ({ signal }) => ordersApi.list(PENDING_PARAMS, signal),
    refetchInterval: 60_000,
  });
  const pending = data?.pagination.total ?? 0;
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  // Measured from when the list was fetched (it refetches every minute).
  const ago = (iso: string) => {
    const minutes = Math.max(0, Math.round((dataUpdatedAt - new Date(iso).getTime()) / 60_000));
    if (minutes < 60) return relative.format(-minutes, "minute");
    if (minutes < 60 * 24) return relative.format(-Math.round(minutes / 60), "hour");
    return relative.format(-Math.round(minutes / 1440), "day");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-lg" className="relative" aria-label={t("toggle", { count: pending })}>
            {pending > 0 && (
              <span className="absolute -top-1 -inset-e-1 z-10 flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-semibold text-white tabular-nums">
                {pending > 99 ? "99+" : pending}
              </span>
            )}
            <BellIcon className="size-auto!" />
          </Button>
        }
      />

      <DropdownMenuContent align="end" sideOffset={12} className="w-87.5 overflow-hidden p-3 sm:w-90.25">
        <div className="flex items-center justify-between pb-3">
          <h5 className="text-base font-semibold text-label">{t("title")}</h5>
          <Button variant="ghost" size="icon-xs" onClick={() => setIsOpen(false)} aria-label={t("close")}>
            <XIcon className="size-5" />
          </Button>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {data && data.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-label-secondary">{t("empty")}</p>
        ) : (
          <ScrollArea scrollbars="vertical" className="max-h-96">
            <div className="flex flex-col pe-2">
              {(data?.items ?? []).map((order) => (
                <DropdownMenuItem
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex flex-col items-start gap-0.5 rounded-lg p-3"
                >
                  <span className="text-sm text-label">
                    {t("newOrder", { number: order.orderNumber, name: order.customerName })}
                  </span>
                  <span className="text-xs text-label-secondary">
                    {formatTaka(order.total, locale)} · {ago(order.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </ScrollArea>
        )}

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/orders?status=PENDING" />}
          className="mt-3 w-full"
          onClick={() => setIsOpen(false)}
        >
          {t("viewAll")}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
