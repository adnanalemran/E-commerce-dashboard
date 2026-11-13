import { courierApi } from "@/api/content";
import type { Order } from "@/api/orders";
import { queryKeys } from "@/api/query-client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Steadfast booking for an order: book once confirmed, then show the tracking code. */
export default function CourierPanel({ order }: { order: Order }) {
  const t = useTranslations("orders.courier");
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: queryKeys.courierStatus, queryFn: ({ signal }) => courierApi.status(signal), staleTime: 5 * 60_000 });
  const book = useMutation({
    mutationFn: () => courierApi.book(order.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) }),
  });
  const track = useMutation({ mutationFn: () => courierApi.track(order.id) });
  const errors = { network: t("network"), unexpected: t("unexpected") };

  if (order.consignmentId) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-label">
          {t("bookedWith", { courier: order.courier === "STEADFAST" ? "Steadfast" : (order.courier ?? "") })}
        </p>
        <p className="text-label-secondary">
          {t("consignment")}: <span className="font-mono text-label">{order.consignmentId}</span>
        </p>
        {order.trackingCode && (
          <p className="text-label-secondary">
            {t("tracking")}:{" "}
            <a
              href={`https://steadfast.com.bd/t/${encodeURIComponent(order.trackingCode)}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-accent hover:underline"
            >
              {order.trackingCode}
            </a>
          </p>
        )}
        {status.data?.steadfast && (
          <Button size="sm" variant="outline" disabled={track.isPending} onClick={() => track.mutate()}>
            {t("checkStatus")}
          </Button>
        )}
        {track.data && <p className="text-label">{t("currentStatus", { status: track.data.deliveryStatus })}</p>}
        {track.error && <p className="text-danger">{getApiErrorMessage(track.error, errors)}</p>}
      </div>
    );
  }

  if (!status.data?.steadfast) {
    return <p className="text-sm text-label-secondary">{t("notConfigured")}</p>;
  }

  const canBook = order.status === "CONFIRMED" || order.status === "PROCESSING";
  return (
    <div className="space-y-2">
      <Button size="sm" disabled={!canBook || book.isPending} onClick={() => book.mutate()}>
        {book.isPending ? t("booking") : t("book")}
      </Button>
      <p className="text-xs text-label-secondary">{canBook ? t("bookHint") : t("confirmFirst")}</p>
      {book.error && <p className="text-sm text-danger">{getApiErrorMessage(book.error, errors)}</p>}
    </div>
  );
}
