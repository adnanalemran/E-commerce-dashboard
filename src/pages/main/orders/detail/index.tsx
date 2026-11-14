import type { OrderStatus, PaymentStatus } from "@/api/orders";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLocale, useTranslations } from "@/i18n";
import { ArrowLeftIcon, OctagonAlertIcon, TagIcon } from "@/icons";
import { cn } from "@/utils";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { OrderStatusBadge, PaymentBadge } from "../order-badges";
import { useOrder, useOrderMutations } from "../use-orders";
import StatusDialog from "./status-dialog";
import CourierPanel from "./courier-panel";

/** Exits from the normal flow need a reason and restock items. */
const EXIT_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

export default function OrderDetailPage() {
  const t = useTranslations("orders");
  const { id } = useParams();
  const query = useOrder(id);

  if (query.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-accent" />
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium text-label">{t("detail.notFound")}</p>
        <p className="text-sm text-label-secondary">
          {getApiErrorMessage(query.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}
        </p>
        <Button variant="outline" render={<Link to="/orders" />} nativeButton={false}>
          {t("detail.back")}
        </Button>
      </div>
    );
  }

  return <OrderDetail orderId={query.data.id} />;
}

function OrderDetail({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const money = (n: number) => formatTaka(n, locale);
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const { data: order } = useOrder(orderId);
  const { setStatus, setPaymentStatus } = useOrderMutations(orderId);
  const [dialogStatus, setDialogStatus] = useState<OrderStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!order) return null;

  const errorMessages = { network: t("errors.network"), unexpected: t("errors.unexpected") };
  const forward = order.allowedTransitions.filter((s) => !EXIT_STATUSES.includes(s));
  const exits = order.allowedTransitions.filter((s) => EXIT_STATUSES.includes(s));
  const busy = setStatus.isPending || setPaymentStatus.isPending;

  const changeStatus = async (status: OrderStatus, note?: string) => {
    setActionError(null);
    try {
      await setStatus.mutateAsync({ status, note });
      setDialogStatus(null);
    } catch (error) {
      setActionError(getApiErrorMessage(error, errorMessages));
    }
  };

  const changePayment = async (paymentStatus: PaymentStatus) => {
    setActionError(null);
    try {
      await setPaymentStatus.mutateAsync(paymentStatus);
    } catch (error) {
      setActionError(getApiErrorMessage(error, errorMessages));
    }
  };

  const otherPaymentStatuses = (["UNPAID", "PAID", "REFUNDED"] as const).filter((s) => s !== order.paymentStatus);

  return (
    <>
      <PageMeta title={`#${order.orderNumber} | ${t("metaTitle")}`} description={t("description")} />
      <PageBreadcrumb pageTitle={`${t("detail.title")} #${order.orderNumber}`} />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link to="/orders" />} nativeButton={false}>
            <ArrowLeftIcon className="size-4 rtl:rotate-180" />
            {t("detail.back")}
          </Button>
          <OrderStatusBadge status={order.status} />
          <span className="text-sm text-label-secondary">{dateTime.format(new Date(order.createdAt))}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to={`/orders/${order.id}/invoice`} target="_blank" />} nativeButton={false}>
            {t("invoice.print")}
          </Button>
          {forward.map((status, i) => (
            <Button key={status} variant={i === 0 ? "default" : "outline"} disabled={busy} onClick={() => void changeStatus(status)}>
              {t(`transitions.${status}`)}
            </Button>
          ))}
          {exits.map((status) => (
            <Button
              key={status}
              variant="outline"
              disabled={busy}
              onClick={() => {
                setActionError(null);
                setDialogStatus(status);
              }}
              className="border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {t(`transitions.${status}`)}
            </Button>
          ))}
        </div>
      </div>

      {actionError && !dialogStatus && (
        <Alert variant="destructive" className="mb-6 p-4">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle className="text-sm">{actionError}</AlertTitle>
        </Alert>
      )}
      {order.cancelReason && (
        <Alert variant="warning" className="mb-6 p-4">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle className="text-sm">
            {t("detail.cancelReason")}: {order.cancelReason}
          </AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title={t("detail.items", { count: order.itemCount })}>
            <ul className="divide-y divide-separator">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-separator bg-fill text-label-tertiary">
                    {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <TagIcon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link to={`/products/${item.productId}/edit`} className="font-medium text-label hover:text-accent">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-medium text-label">{item.productName}</p>
                    )}
                    <p className="text-xs text-label-secondary">
                      {item.isGift && <span className="me-1 font-semibold text-success">{t("detail.gift")} ·</span>}
                      {item.variantName}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-label-secondary tabular-nums">
                    {money(item.unitPrice)} × {item.quantity}
                  </p>
                  <p className="w-24 text-end font-semibold tabular-nums text-label">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-separator pt-4 text-sm">
              <Row label={t("detail.subtotal")} value={money(order.subtotal)} />
              <Row label={t("detail.delivery")} value={order.deliveryCharge ? money(order.deliveryCharge) : t("detail.free")} />
              {order.discount > 0 && (
                <Row
                  label={order.couponCode ? t("detail.discountCode", { code: order.couponCode }) : t("detail.discount")}
                  value={`− ${money(order.discount)}`}
                />
              )}
              <div className="flex justify-between pt-1.5 text-base font-semibold text-label">
                <dt>{t("detail.total")}</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title={t("detail.timeline")}>
            <ol className="space-y-4">
              {[...order.events].reverse().map((event, i) => (
                <li key={event.id} className="flex gap-3">
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", i === 0 ? "bg-accent" : "bg-gray-300 dark:bg-gray-600")} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={event.status} />
                      <span className="text-xs text-label-secondary">{dateTime.format(new Date(event.createdAt))}</span>
                    </div>
                    <p className="mt-1 text-xs text-label-secondary">
                      {event.actorName ? t("detail.by", { name: event.actorName }) : t("detail.byCustomer")}
                    </p>
                    {event.note && <p className="mt-1 text-sm text-label">{event.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t("detail.customer")}>
            <dl className="space-y-3 text-sm">
              <Info label={t("detail.name")}>{order.customerName}</Info>
              <Info label={t("detail.phone")}>
                <a href={`tel:${order.phone}`} className="text-accent hover:underline tabular-nums">
                  {order.phone}
                </a>
              </Info>
              {order.email && <Info label={t("detail.email")}>{order.email}</Info>}
              <Info label={t("detail.address")}>
                <span className="whitespace-pre-line">{order.address}</span>
              </Info>
              {order.district && (
                <Info label={t("detail.location")}>
                  {order.area ? `${order.area}, ${order.district}` : order.district}
                </Info>
              )}
              <Info label={t("detail.zone")}>{t(`zones.${order.deliveryZone}`)}</Info>
              {order.note && <Info label={t("detail.note")}>{order.note}</Info>}
            </dl>
          </Panel>

          <Panel title={t("courier.title")}>
            <CourierPanel order={order} />
          </Panel>

          <Panel title={t("detail.payment")}>
            <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
            <div className="mt-4 flex flex-wrap gap-2">
              {otherPaymentStatuses.map((status) => (
                <Button key={status} size="sm" variant="outline" disabled={busy} onClick={() => void changePayment(status)}>
                  {t(`paymentActions.${status}`)}
                </Button>
              ))}
            </div>
            {order.paymentMethod === "COD" && order.paymentStatus === "UNPAID" && (
              <p className="mt-3 text-xs text-label-secondary">{t("detail.codHint")}</p>
            )}
            {order.payments && order.payments.length > 0 && (
              <ul className="mt-4 divide-y divide-separator border-t border-separator">
                {order.payments.map((p) => (
                  <li key={p.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-label">bKash · {money(p.amount)}</span>
                      <span className={cn("text-xs font-medium", p.status === "COMPLETED" ? "text-success" : p.status === "INITIATED" ? "text-label-secondary" : "text-danger")}>
                        {t(`detail.attempt.${p.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-label-secondary">
                      {dateTime.format(new Date(p.createdAt))}
                      {p.trxId && <> · {t("detail.trxId", { id: p.trxId })}</>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <StatusDialog
        status={dialogStatus}
        onOpenChange={(open) => {
          if (!open) setDialogStatus(null);
        }}
        onConfirm={(note) => changeStatus(dialogStatus!, note || undefined)}
        error={dialogStatus ? actionError : null}
      />
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-label">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-label-secondary">
      <dt>{label}</dt>
      <dd className="tabular-nums text-label">{value}</dd>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-label-secondary">{label}</dt>
      <dd className="mt-0.5 text-label">{children}</dd>
    </div>
  );
}
