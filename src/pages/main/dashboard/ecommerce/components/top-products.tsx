import type { OrderStats } from "@/api/orders";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslations } from "@/i18n";
import { formatTaka } from "@/utils/currency";

export default function TopProducts({ items }: { items?: OrderStats["topProducts"] }) {
  const t = useTranslations("ecommerce.topProducts");
  const locale = useLocale();
  const max = Math.max(1, ...(items ?? []).map((i) => i.quantity));

  return (
    <div className="surface-card h-full p-5 sm:p-6">
      <h3 className="text-base font-semibold text-label">{t("title")}</h3>
      <p className="text-sm text-label-secondary">{t("subtitle")}</p>

      {!items ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-label-secondary">{t("empty")}</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.slug}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-label">{item.name}</span>
                <span className="shrink-0 tabular-nums text-label-secondary">
                  {t("sold", { count: item.quantity })} · {formatTaka(item.revenue, locale)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-fill">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(item.quantity / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
