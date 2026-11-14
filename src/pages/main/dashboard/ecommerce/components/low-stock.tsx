import type { OrderStats } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/i18n";
import { Link } from "react-router";

export default function LowStock({ lowStock }: { lowStock?: OrderStats["lowStock"] }) {
  const t = useTranslations("ecommerce.lowStock");

  return (
    <div className="surface-card h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-label">{t("title")}</h3>
          <p className="text-sm text-label-secondary">
            {lowStock ? t("subtitle", { threshold: lowStock.threshold }) : " "}
          </p>
        </div>
        {lowStock && lowStock.count > 0 && (
          <Badge variant="light" color="warning" size="sm">
            {lowStock.count}
          </Badge>
        )}
      </div>

      {!lowStock ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : lowStock.items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-label-secondary">{t("empty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-separator">
          {lowStock.items.map((item) => (
            <li key={item.variantId}>
              <Link
                to={`/products/${item.productId}/edit`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-fill"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-label">{item.productName}</span>
                  <span className="block text-xs text-label-secondary">{item.variantName}</span>
                </span>
                <Badge variant="light" color={item.stock === 0 ? "error" : "warning"} size="sm">
                  {item.stock === 0 ? t("outOfStock") : t("left", { count: item.stock })}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
