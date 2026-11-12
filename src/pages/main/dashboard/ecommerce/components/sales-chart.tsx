import type { OrderStats } from "@/api/orders";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts";
import { useLocale, useTranslations } from "@/i18n";
import { formatTaka } from "@/utils/currency";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

/** Revenue (bars) and order count (line) for each of the last 30 days. */
export default function SalesChart({ days }: { days?: OrderStats["last30Days"] }) {
  const t = useTranslations("ecommerce.sales");
  const locale = useLocale();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const axis = dark ? "#A1A1A6" : "#6E6E73";
  const dayLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const total = days?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const orders = days?.reduce((sum, d) => sum + d.orders, 0) ?? 0;

  const options: ApexOptions = {
    chart: { fontFamily: "inherit", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#007AFF", dark ? "#FF9F0A" : "#C93400"],
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
    stroke: { width: [0, 2], curve: "smooth" },
    dataLabels: { enabled: false },
    legend: { show: true, position: "top", horizontalAlign: "right", labels: { colors: axis } },
    xaxis: {
      categories: (days ?? []).map((d) => dayLabel.format(new Date(`${d.date}T00:00:00`))),
      tickAmount: 10,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axis } },
    },
    yaxis: [
      { labels: { style: { colors: axis }, formatter: (v: number) => formatTaka(Math.round(v), locale) } },
      { opposite: true, labels: { style: { colors: axis }, formatter: (v: number) => String(Math.round(v)) } },
    ],
    grid: { borderColor: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)", strokeDashArray: 3 },
    tooltip: { theme: dark ? "dark" : "light", shared: true, intersect: false },
  };

  const series = [
    { name: t("revenue"), type: "column", data: (days ?? []).map((d) => d.revenue) },
    { name: t("orders"), type: "line", data: (days ?? []).map((d) => d.orders) },
  ];

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-label">{t("title")}</h3>
          <p className="text-sm text-label-secondary">{t("subtitle")}</p>
        </div>
        {days && (
          <p className="text-sm text-label-secondary">
            <span className="font-semibold tabular-nums text-label">{formatTaka(total, locale)}</span> · {t("orderCount", { count: orders })}
          </p>
        )}
      </div>
      {days ? (
        <ScrollArea className="mt-2 max-w-full">
          <div className="min-w-150 xl:min-w-full">
            <ReactApexChart options={options} series={series} type="line" height={280} />
          </div>
        </ScrollArea>
      ) : (
        <Skeleton className="mt-4 h-70 w-full" />
      )}
    </div>
  );
}
