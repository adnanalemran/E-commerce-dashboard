import type { OrderStats } from "@/api/orders";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslations } from "@/i18n";
import { CartIcon, DollarIcon, HourglassIcon, UsersIcon } from "@/icons";
import { formatTaka } from "@/utils/currency";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface Kpi {
  key: string;
  icon: ReactNode;
  label: string;
  value?: string;
  sub?: string;
  to?: string;
}

export default function KpiCards({ stats }: { stats?: OrderStats }) {
  const t = useTranslations("ecommerce.kpis");
  const locale = useLocale();
  const money = (n: number) => formatTaka(n, locale);
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);

  const kpis: Kpi[] = [
    {
      key: "today",
      icon: <CartIcon />,
      label: t("todayRevenue"),
      value: stats && money(stats.today.revenue),
      sub: stats && t("orders", { count: stats.today.orders }),
    },
    {
      key: "month",
      icon: <DollarIcon />,
      label: t("monthRevenue"),
      value: stats && money(stats.month.revenue),
      sub: stats && t("orders", { count: stats.month.orders }),
    },
    {
      key: "pending",
      icon: <HourglassIcon />,
      label: t("pending"),
      value: stats && num(stats.pending),
      sub: t("pendingHint"),
      to: "/orders?status=PENDING",
    },
    {
      key: "customers",
      icon: <UsersIcon />,
      label: t("customers"),
      value: stats && num(stats.customers),
      sub: t("customersHint"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const body = (
          <>
            <div className="flex size-10 items-center justify-center rounded-xl bg-fill text-label [&>svg]:size-5" aria-hidden="true">
              {kpi.icon}
            </div>
            <p className="mt-4 text-sm text-label-secondary">{kpi.label}</p>
            {kpi.value === undefined ? (
              <Skeleton className="mt-2 h-7 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums text-label">{kpi.value}</p>
            )}
            <p className="mt-0.5 text-xs text-label-secondary">{kpi.sub ?? " "}</p>
          </>
        );
        return kpi.to ? (
          <Link key={kpi.key} to={kpi.to} className="surface-card p-5 transition-colors hover:bg-fill">
            {body}
          </Link>
        ) : (
          <div key={kpi.key} className="surface-card p-5">
            {body}
          </div>
        );
      })}
    </div>
  );
}
