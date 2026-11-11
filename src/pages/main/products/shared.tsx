import {
  LOW_STOCK_THRESHOLD,
  type Product,
  type ProductStatus,
} from "@/api/products";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/i18n";

const STATUS_COLORS: Record<ProductStatus, "success" | "gray" | "warning"> = {
  ACTIVE: "success",
  DRAFT: "warning",
  ARCHIVED: "gray",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const t = useTranslations("products.statuses");
  return (
    <Badge variant="light" color={STATUS_COLORS[status]} size="sm">
      {t(status)}
    </Badge>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const t = useTranslations("products.stock");
  if (stock === 0) {
    return (
      <Badge variant="light" color="error" size="sm">
        {t("out")}
      </Badge>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge variant="light" color="warning" size="sm">
        {t("low")}
      </Badge>
    );
  }
  return null;
}

/** "Best selling", "New", "Featured" flags shown on storefront cards. */
export function ProductFlags({ product }: { product: Product }) {
  const t = useTranslations("products.flags");
  const flags = [
    product.isBestSelling && { key: "bestSelling", color: "primary" as const },
    product.isNewArrival && { key: "newArrival", color: "info" as const },
    product.isFeatured && { key: "featured", color: "dark" as const },
  ].filter(Boolean) as { key: string; color: "primary" | "info" | "dark" }[];

  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag.key} variant="light" color={flag.color} size="sm">
          {t(flag.key)}
        </Badge>
      ))}
    </div>
  );
}
