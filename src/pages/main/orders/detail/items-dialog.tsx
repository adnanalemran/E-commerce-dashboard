import type { Order, OrderItemInput, OrderItemProblem } from "@/api/orders";
import type { Product, ProductVariant } from "@/api/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocale, useTranslations } from "@/i18n";
import { MinusIcon, PlusIcon, SearchIcon, TagIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useMemo, useState } from "react";
import { useOrderItemsPreview, useOrderMutations, useProductSearch } from "../use-orders";

/** Mirrors `STORE_CONFIG.maxQuantityPerLine` in the backend. */
const MAX_QUANTITY = 50;

interface DraftLine {
  variantId: string;
  productName: string;
  variantName: string;
  image: string | null;
  /** Price shown until the server preview arrives. */
  unitPrice: number;
  quantity: number;
}

export interface ItemsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Staff edit of an order's items: quantities, removals and new products, priced by the server. */
export default function ItemsDialog({ order, open, onOpenChange }: ItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] overflow-y-auto p-6 sm:max-w-2xl sm:p-8">
        {open && <ItemsEditor order={order} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemsEditor({ order, onDone }: { order: Order; onDone: () => void }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const money = (n: number) => formatTaka(n, locale);
  const { updateItems } = useOrderMutations(order.id);

  // Paid lines with a live variant are editable; gifts and lines of deleted variants are kept as they are.
  const original = useMemo(
    () =>
      new Map(
        order.items
          .filter((item) => !item.isGift && item.variantId)
          .map((item) => [item.variantId!, item]),
      ),
    [order.items],
  );
  const fixed = order.items.filter((item) => item.isGift || !item.variantId);

  const [lines, setLines] = useState<DraftLine[]>(() =>
    [...original.values()].map((item) => ({
      variantId: item.variantId!,
      productName: item.productName,
      variantName: item.variantName,
      image: item.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items = useMemo<OrderItemInput[]>(
    () => lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
    [lines],
  );
  const debouncedItems = useDebouncedValue(items, 400);
  const preview = useOrderItemsPreview(order.id, debouncedItems);
  // The preview matches what is on screen (not an older list still loading or debouncing).
  const previewCurrent = debouncedItems === items && Boolean(preview.data) && !preview.isPlaceholderData;
  const previewLines = new Map(preview.data?.items.map((line) => [line.variantId, line]));
  const problems = new Map<string, OrderItemProblem>(
    previewCurrent ? preview.data!.problems.map((p) => [p.variantId, p]) : [],
  );

  const changed =
    lines.length !== original.size ||
    lines.some((line) => original.get(line.variantId)?.quantity !== line.quantity);

  const setQuantity = (variantId: string, quantity: number) =>
    setLines((current) =>
      current.map((line) =>
        line.variantId === variantId
          ? { ...line, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }
          : line,
      ),
    );

  const remove = (variantId: string) =>
    setLines((current) => current.filter((line) => line.variantId !== variantId));

  const add = (product: Product, variant: ProductVariant) =>
    setLines((current) => {
      if (current.some((line) => line.variantId === variant.id)) {
        return current.map((line) =>
          line.variantId === variant.id
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + 1) }
            : line,
        );
      }
      // A line removed in this edit comes back with its original (checkout) price.
      const before = original.get(variant.id);
      return [
        ...current,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          image: before?.image ?? product.image,
          unitPrice: before?.unitPrice ?? variant.price,
          quantity: 1,
        },
      ];
    });

  const save = async () => {
    setError(null);
    try {
      await updateItems.mutateAsync({ items, note: note.trim() || undefined });
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
    }
  };

  const totals = previewCurrent ? preview.data! : null;
  const canSave = changed && lines.length > 0 && problems.size === 0 && !updateItems.isPending;

  return (
    <>
      <DialogHeader className="gap-2 pe-12 text-start">
        <DialogTitle className="text-xl font-semibold text-label">{t("editItems.title")}</DialogTitle>
        <DialogDescription className="text-sm text-label-secondary">{t("editItems.description")}</DialogDescription>
      </DialogHeader>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator px-4 py-6 text-center text-sm text-label-secondary">
          {t("editItems.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-separator">
          {lines.map((line) => {
            const before = original.get(line.variantId)?.quantity ?? 0;
            const priced = previewLines.get(line.variantId);
            const unitPrice = priced?.unitPrice ?? line.unitPrice;
            const problem = problems.get(line.variantId);
            const label = `${line.productName} – ${line.variantName}`;
            return (
              <li key={line.variantId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                <Thumb image={line.image} />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-medium text-label">{line.productName}</p>
                  <p className="text-xs text-label-secondary">
                    {line.variantName} · {money(unitPrice)}
                    {before > 0 && before !== line.quantity && (
                      <span className="ms-1">· {t("editItems.was", { quantity: before })}</span>
                    )}
                  </p>
                  {before === 0 && (
                    <Badge variant="light" color="primary" size="sm" className="mt-1">
                      {t("editItems.new")}
                    </Badge>
                  )}
                  {problem && (
                    <p role="alert" className="mt-1 text-xs font-medium text-red-500 dark:text-red-400">
                      {t(`editItems.problems.${problem.reason}`, { available: problem.available })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label={t("editItems.decrease")}
                    disabled={line.quantity <= 1}
                    onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                  >
                    <MinusIcon className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_QUANTITY}
                    value={line.quantity}
                    aria-label={t("editItems.quantity", { name: label })}
                    aria-invalid={problem ? true : undefined}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isInteger(value) && value >= 1) setQuantity(line.variantId, value);
                    }}
                    className="h-8 w-14 px-1 text-center tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label={t("editItems.increase")}
                    disabled={line.quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
                <p className="w-20 text-end font-semibold tabular-nums text-label">
                  {money(priced && priced.quantity === line.quantity ? priced.lineTotal : unitPrice * line.quantity)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("editItems.remove", { name: label })}
                  onClick={() => remove(line.variantId)}
                  className="text-label-secondary hover:text-red-500"
                >
                  <TrashBinIcon className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {fixed.length > 0 && (
        <ul className="space-y-2 rounded-xl bg-fill px-4 py-3">
          {fixed.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-label">
                {item.productName} – {item.variantName} × {item.quantity}
              </span>
              <span className="shrink-0 text-xs text-label-secondary">
                {item.isGift ? t("editItems.giftLocked") : t("editItems.deletedLocked")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ProductPicker onPick={add} />

      <dl className="space-y-1.5 border-t border-separator pt-4 text-sm">
        <TotalRow label={t("detail.subtotal")} value={totals && money(totals.subtotal)} />
        <TotalRow
          label={t("detail.delivery")}
          value={totals && (totals.deliveryCharge ? money(totals.deliveryCharge) : t("detail.free"))}
        />
        {(order.couponCode || (totals?.discount ?? 0) > 0) && (
          <TotalRow
            label={order.couponCode ? t("detail.discountCode", { code: order.couponCode }) : t("detail.discount")}
            value={totals && `− ${money(totals.discount)}`}
          />
        )}
        <div className="flex items-baseline justify-between gap-3 pt-1.5 text-base font-semibold text-label">
          <dt>{t("detail.total")}</dt>
          <dd className="flex items-baseline gap-2 tabular-nums">
            {totals && totals.total !== order.total && (
              <span className="text-xs font-normal text-label-secondary line-through">{money(order.total)}</span>
            )}
            {totals ? money(totals.total) : lines.length > 0 ? <Spinner className="size-4 text-accent" /> : "—"}
          </dd>
        </div>
      </dl>

      <Field className="gap-1.5">
        <FieldLabel>{t("editItems.note")}</FieldLabel>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder={t("editItems.notePlaceholder")}
        />
      </Field>

      {(error || (preview.error && !preview.isFetching)) && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error ??
            getApiErrorMessage(preview.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}
        </p>
      )}

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={updateItems.isPending}>
              {t("actions.close")}
            </Button>
          }
        />
        <Button type="button" disabled={!canSave} onClick={() => void save()}>
          {updateItems.isPending ? t("actions.saving") : t("editItems.save")}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Search active products and add one of their variants to the order. */
function ProductPicker({ onPick }: { onPick: (product: Product, variant: ProductVariant) => void }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 300);
  const query = useProductSearch(term);
  const products = term.length >= 2 ? (query.data?.items ?? []) : [];

  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor="order-item-search">{t("editItems.addProduct")}</FieldLabel>
      <InputGroup className="h-10">
        <InputGroupAddon align="inline-start">
          <SearchIcon className="size-5 text-label-tertiary" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="order-item-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("editItems.searchPlaceholder")}
          autoComplete="off"
        />
        {query.isFetching && (
          <InputGroupAddon align="inline-end">
            <Spinner className="size-4 text-accent" />
          </InputGroupAddon>
        )}
      </InputGroup>

      {term.length >= 2 && !query.isPending && products.length === 0 && (
        <p className="text-sm text-label-secondary">{t("editItems.noProducts")}</p>
      )}
      {products.length > 0 && (
        <ul className="divide-y divide-separator rounded-xl border border-separator">
          {products.map((product) => (
            <li key={product.id} className="flex items-start gap-3 px-3 py-2.5">
              <Thumb image={product.image} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-label">{product.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={variant.stock <= 0}
                      onClick={() => onPick(product, variant)}
                      className="h-auto py-1"
                    >
                      <PlusIcon className="size-3.5" aria-hidden="true" />
                      <span>
                        {variant.name} · {formatTaka(variant.price, locale)}
                      </span>
                      <span className={cn("font-normal", variant.stock <= 0 ? "text-red-500" : "text-label-secondary")}>
                        {variant.stock > 0
                          ? t("editItems.inStock", { count: variant.stock })
                          : t("editItems.outOfStock")}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

function Thumb({ image, small = false }: { image: string | null; small?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-separator bg-fill text-label-tertiary",
        small ? "size-10" : "size-12",
      )}
    >
      {image ? <img src={image} alt="" className="size-full object-cover" /> : <TagIcon className="size-5" />}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-label-secondary">
      <dt>{label}</dt>
      <dd className="tabular-nums text-label">{value ?? "—"}</dd>
    </div>
  );
}
