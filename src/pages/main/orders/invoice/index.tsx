import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLocale, useTranslations } from "@/i18n";
import { formatTaka } from "@/utils/currency";
import { Link, useParams } from "react-router";
import { useOrder } from "../use-orders";

/** Printable invoice / packing slip. Opened in its own tab without the app chrome. */
export default function OrderInvoicePage() {
  const t = useTranslations("orders.invoice");
  const tz = useTranslations("orders");
  const locale = useLocale();
  const { id } = useParams();
  const { data: order, isPending } = useOrder(id);
  const money = (n: number) => formatTaka(n, locale);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-accent" />
      </div>
    );
  }
  if (!order) return <p className="p-10 text-center text-label">{t("notFound")}</p>;

  const location = [order.address, order.area, order.district].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white text-black print:p-0">
      <PageMeta title={`${t("title")} #${order.orderNumber} | E-Dukan`} description={t("title")} />
      <div className="mx-auto flex max-w-3xl justify-end gap-2 p-4 print:hidden">
        <Button variant="outline" render={<Link to={`/orders/${order.id}`} />} nativeButton={false}>
          {t("back")}
        </Button>
        <Button onClick={() => window.print()}>{t("print")}</Button>
      </div>

      <article className="mx-auto max-w-3xl p-8 text-sm print:max-w-none print:p-6">
        <header className="flex items-start justify-between border-b border-black/20 pb-4">
          <div>
            <p className="text-2xl font-bold">E-Dukan</p>
            <p className="text-black/60">{t("subtitle")}</p>
          </div>
          <div className="text-end">
            <p className="text-lg font-semibold">
              {t("title")} #{order.orderNumber}
            </p>
            <p className="text-black/60">{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(order.createdAt))}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-4">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-black/50 uppercase">{t("shipTo")}</p>
            <p className="font-semibold">{order.customerName}</p>
            <p>{order.phone}</p>
            <p className="whitespace-pre-line">{location}</p>
          </div>
          <div className="text-end">
            <p className="mb-1 text-xs font-semibold tracking-wide text-black/50 uppercase">{t("payment")}</p>
            <p>{tz(`paymentMethods.${order.paymentMethod}`)}</p>
            <p className="font-semibold">{tz(`paymentStatuses.${order.paymentStatus}`)}</p>
            {order.trackingCode && <p className="mt-1 font-mono text-xs">{order.trackingCode}</p>}
          </div>
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-black/20 text-start text-xs text-black/60 uppercase">
              <th className="py-2 text-start">{t("item")}</th>
              <th className="py-2 text-end">{t("price")}</th>
              <th className="py-2 text-end">{t("qty")}</th>
              <th className="py-2 text-end">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-black/10">
                <td className="py-2">
                  {item.productName} – {item.variantName}
                  {item.isGift && <span className="ms-2 text-xs font-semibold">({t("gift")})</span>}
                  {item.sku && <span className="block text-xs text-black/50">{item.sku}</span>}
                </td>
                <td className="py-2 text-end tabular-nums">{money(item.unitPrice)}</td>
                <td className="py-2 text-end tabular-nums">{item.quantity}</td>
                <td className="py-2 text-end tabular-nums">{money(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ms-auto mt-4 w-64 space-y-1">
          <div className="flex justify-between">
            <dt>{t("subtotal")}</dt>
            <dd className="tabular-nums">{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("delivery")}</dt>
            <dd className="tabular-nums">{money(order.deliveryCharge)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt>
                {t("discount")}
                {order.couponCode ? ` (${order.couponCode})` : ""}
              </dt>
              <dd className="tabular-nums">− {money(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-black/20 pt-1 text-base font-bold">
            <dt>{order.paymentStatus === "PAID" ? t("total") : t("toCollect")}</dt>
            <dd className="tabular-nums">{money(order.total)}</dd>
          </div>
        </dl>

        {order.note && (
          <p className="mt-6 rounded border border-black/20 p-3">
            <span className="font-semibold">{t("note")}:</span> {order.note}
          </p>
        )}
        <p className="mt-10 text-center text-xs text-black/50">{t("thanks")}</p>
      </article>
    </div>
  );
}
