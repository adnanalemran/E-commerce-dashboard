import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/i18n";

type BadgeColor = "warning" | "info" | "primary" | "success" | "error" | "gray" | "dark";

const STATUS_COLORS: Record<OrderStatus, BadgeColor> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "primary",
  SHIPPED: "dark",
  DELIVERED: "success",
  CANCELLED: "error",
  RETURNED: "gray",
};

const PAYMENT_COLORS: Record<PaymentStatus, BadgeColor> = {
  UNPAID: "warning",
  PAID: "success",
  REFUNDED: "gray",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders.statuses");
  return (
    <Badge variant="light" color={STATUS_COLORS[status]} size="sm">
      {t(status)}
    </Badge>
  );
}

export function PaymentBadge({
  method,
  status,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  const t = useTranslations("orders");
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs font-semibold text-label-secondary">{t(`paymentMethods.${method}`)}</span>
      <Badge variant="light" color={PAYMENT_COLORS[status]} size="sm">
        {t(`paymentStatuses.${status}`)}
      </Badge>
    </span>
  );
}
