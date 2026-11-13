import { reportsApi, type SalesReport } from "@/api/content";
import { queryKeys } from "@/api/query-client";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts";
import { useLocale, useTranslations } from "@/i18n";
import { DownloadIcon } from "@/icons";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApexOptions } from "apexcharts";
import { useState, type ReactNode } from "react";
import ReactApexChart from "react-apexcharts";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** CSV with quoted cells; Excel opens it directly. */
function downloadCsv(report: SalesReport) {
  const lines: (string | number)[][] = [
    ["Date", "Orders", "Revenue (BDT)"],
    ...report.daily.map((d) => [d.date, d.orders, d.revenue]),
    [],
    ["Product", "Units", "Revenue (BDT)"],
    ...report.topProducts.map((p) => [p.name, p.quantity, p.revenue]),
  ];
  const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-${report.range.from}-to-${report.range.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const locale = useLocale();
  const { theme } = useTheme();
  const money = (n: number) => formatTaka(n, locale);
  const [range, setRange] = useState(() => {
    const to = new Date();
    return { from: iso(new Date(to.getTime() - 29 * 86_400_000)), to: iso(to) };
  });
  const [draft, setDraft] = useState(range);
  const query = useQuery({
    queryKey: queryKeys.reports.sales(range.from, range.to),
    queryFn: ({ signal }) => reportsApi.sales(range.from, range.to, signal),
    placeholderData: keepPreviousData,
  });
  const r = query.data;
  const dark = theme === "dark";
  const axis = dark ? "#A1A1A6" : "#6E6E73";
  const dayLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const options: ApexOptions = {
    chart: { fontFamily: "inherit", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#007AFF"],
    plotOptions: { bar: { columnWidth: "60%", borderRadius: 3 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: (r?.daily ?? []).map((d) => dayLabel.format(new Date(`${d.date}T00:00:00`))),
      tickAmount: 12,
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axis } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: axis }, formatter: (v: number) => money(Math.round(v)) } },
    grid: { borderColor: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)", strokeDashArray: 3 },
    tooltip: { theme: dark ? "dark" : "light" },
  };

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />

      <form
        className="surface-card mb-6 flex flex-wrap items-end gap-4 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.from && draft.to && draft.to >= draft.from) setRange(draft);
        }}
      >
        <Field className="gap-1.5">
          <FieldLabel>{t("from")}</FieldLabel>
          <Input type="date" value={draft.from} max={draft.to} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>{t("to")}</FieldLabel>
          <Input type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
        </Field>
        <Button type="submit">{t("apply")}</Button>
        {r && (
          <Button type="button" variant="outline" className="ms-auto" onClick={() => downloadCsv(r)}>
            <DownloadIcon className="size-4" aria-hidden="true" />
            {t("export")}
          </Button>
        )}
      </form>

      {query.error ? (
        <Alert variant="destructive">
          <AlertTitle>{getApiErrorMessage(query.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}</AlertTitle>
        </Alert>
      ) : !r ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label={t("totals.revenue")} value={money(r.totals.revenue)} sub={t("totals.orders", { count: r.totals.orders })} />
            <Stat label={t("totals.average")} value={money(r.totals.averageOrder)} />
            <Stat label={t("totals.paid")} value={money(r.totals.paid)} sub={t("totals.discounts", { amount: money(r.totals.discounts) })} />
            <Stat label={t("totals.cancelled")} value={String(r.totals.cancelledOrReturned)} sub={t("totals.delivery", { amount: money(r.totals.deliveryCharges) })} />
          </div>

          <section className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-label">{t("daily")}</h3>
            <ScrollArea className="max-w-full">
              <div className="min-w-150 xl:min-w-full">
                <ReactApexChart options={options} series={[{ name: t("revenue"), data: r.daily.map((d) => d.revenue) }]} type="bar" height={260} />
              </div>
            </ScrollArea>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Breakdown title={t("topProducts")} rows={r.topProducts.map((p) => [p.name, t("units", { count: p.quantity }), money(p.revenue)])} empty={t("empty")} />
            <Breakdown
              title={t("byPayment")}
              rows={r.byPaymentMethod.map((p) => [t(`methods.${p.method}`), t("ordersShort", { count: p.orders }), money(p.revenue)])}
              empty={t("empty")}
            />
            <Breakdown title={t("byDistrict")} rows={r.byDistrict.map((d) => [d.district, t("ordersShort", { count: d.orders }), money(d.revenue)])} empty={t("empty")} />
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-label-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-label">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-label-secondary">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, rows, empty }: { title: string; rows: [string, string, string][]; empty: ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h3 className="mb-3 text-base font-semibold text-label">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-label-secondary">{empty}</p>
      ) : (
        <ul className="divide-y divide-separator text-sm">
          {rows.map(([name, count, amount]) => (
            <li key={name} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-label">{name}</span>
              <span className="shrink-0 tabular-nums text-label-secondary">
                {count} · <span className="font-medium text-label">{amount}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
