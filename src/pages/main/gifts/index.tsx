import { giftsApi, type GiftRule, type GiftRuleInput } from "@/api/content";
import { productsApi } from "@/api/products";
import { queryKeys } from "@/api/query-client";
import { ConfirmDeleteDialog, FormActions, FormDialog, ListCard, ListState } from "@/components/shared/crud";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocale, useTranslations } from "@/i18n";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import { formatTaka } from "@/utils/currency";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

export default function GiftsPage() {
  const t = useTranslations("gifts");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.giftRules, queryFn: ({ signal }) => giftsApi.list(signal) });
  const [editing, setEditing] = useState<GiftRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<GiftRule | null>(null);
  const setRules = (rules: GiftRule[]) => queryClient.setQueryData(queryKeys.giftRules, rules);
  const rules = query.data ?? [];

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      <ListCard
        title={t("listTitle")}
        description={t("description")}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            {t("create")}
          </Button>
        }
      >
        <ListState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={rules.length === 0}
          emptyTitle={t("empty")}
          emptyHint={t("emptyHint")}
          onRetry={() => void query.refetch()}
        >
          <ul className="divide-y divide-separator border-t border-separator">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-fill">
                  {r.product.image && <img src={r.product.image} alt="" className="size-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-label">{r.name}</span>
                    <Badge variant="light" color={r.isActive ? "success" : "gray"} size="sm">
                      {r.isActive ? t("active") : t("off")}
                    </Badge>
                    {r.variant && r.variant.stock === 0 && (
                      <Badge variant="light" color="error" size="sm">
                        {t("outOfStock")}
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-label-secondary">
                    {t("rule", {
                      amount: formatTaka(r.minSubtotal, locale),
                      gift: `${r.product.name}${r.variant ? ` (${r.variant.name})` : ""}`,
                    })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("edit", { name: r.name })}
                  onClick={() => {
                    setEditing(r);
                    setFormOpen(true);
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t("delete", { name: r.name })} onClick={() => setDeleting(r)}>
                  <TrashBinIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ListState>
      </ListCard>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? t("editTitle") : t("createTitle")} description={t("formHint")}>
        <GiftForm
          rule={editing}
          onSaved={(next) => {
            setRules(next);
            setFormOpen(false);
          }}
        />
      </FormDialog>
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { name: deleting?.name ?? "" })}
        description={t("deleteDescription")}
        onConfirm={async () => setRules(await giftsApi.remove(deleting!.id))}
      />
    </>
  );
}

const localInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function GiftForm({ rule, onSaved }: { rule: GiftRule | null; onSaved: (rules: GiftRule[]) => void }) {
  const t = useTranslations("gifts");
  const locale = useLocale();
  const [name, setName] = useState(rule?.name ?? "");
  const [minSubtotal, setMinSubtotal] = useState(rule ? String(rule.minSubtotal) : "");
  const [variantId, setVariantId] = useState(rule?.giftVariantId ?? "");
  const [variantLabel, setVariantLabel] = useState(rule ? `${rule.product.name}${rule.variant ? ` (${rule.variant.name})` : ""}` : "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(localInput(rule?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(localInput(rule?.endsAt ?? null));
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [errors, setErrors] = useState<Partial<Record<"name" | "minSubtotal" | "variant" | "endsAt", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const results = useQuery({
    queryKey: queryKeys.products.list({ search: debounced, limit: 8 }),
    queryFn: ({ signal }) => productsApi.list({ search: debounced, limit: 8 }, signal),
    enabled: debounced.length >= 2,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = t("validation.name");
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(minSubtotal.trim())) next.minSubtotal = t("validation.amount");
    if (!variantId) next.variant = t("validation.variant");
    if (startsAt && endsAt && endsAt <= startsAt) next.endsAt = t("validation.endAfterStart");
    setErrors(next);
    if (Object.keys(next).length) return;
    const input: GiftRuleInput = {
      name: name.trim(),
      giftVariantId: variantId,
      minSubtotal: Number(minSubtotal),
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    };
    setBusy(true);
    setFormError(null);
    try {
      onSaved(rule ? await giftsApi.update(rule.id, input) : await giftsApi.create(input));
    } catch (error) {
      setFormError(getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>{formError}</AlertTitle>
        </Alert>
      )}
      <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
        <FieldLabel>{t("form.name")}</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("form.namePlaceholder")} autoFocus />
        {errors.name && <FieldError errors={[{ message: errors.name }]} />}
      </Field>
      <Field data-invalid={Boolean(errors.minSubtotal)} className="gap-1.5">
        <FieldLabel>{t("form.minSubtotal")}</FieldLabel>
        <Input value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} inputMode="decimal" placeholder="2000" />
        {errors.minSubtotal && <FieldError errors={[{ message: errors.minSubtotal }]} />}
      </Field>
      <Field data-invalid={Boolean(errors.variant)} className="gap-1.5">
        <FieldLabel>{t("form.gift")}</FieldLabel>
        {variantLabel && <p className="rounded-lg bg-fill px-3 py-2 text-sm text-label">{variantLabel}</p>}
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("form.searchProduct")} type="search" />
        {results.data && (
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-separator">
            {results.data.items.flatMap((p) =>
              p.variants.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setVariantId(v.id);
                      setVariantLabel(`${p.name} (${v.name})`);
                      setSearch("");
                    }}
                    className={cn("flex w-full justify-between gap-3 px-3 py-2 text-start text-sm hover:bg-fill", v.id === variantId && "bg-accent-soft")}
                  >
                    <span className="text-label">
                      {p.name} · {v.name}
                    </span>
                    <span className="shrink-0 text-xs text-label-secondary">
                      {formatTaka(v.price, locale)} · {t("stock", { count: v.stock })}
                    </span>
                  </button>
                </li>
              )),
            )}
          </ul>
        )}
        {errors.variant && <FieldError errors={[{ message: errors.variant }]} />}
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field className="gap-1.5">
          <FieldLabel>{t("form.startsAt")}</FieldLabel>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </Field>
        <Field data-invalid={Boolean(errors.endsAt)} className="gap-1.5">
          <FieldLabel>{t("form.endsAt")}</FieldLabel>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          {errors.endsAt && <FieldError errors={[{ message: errors.endsAt }]} />}
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-fill px-4 py-3">
        <label htmlFor="gift-active" className="text-sm text-label">
          {t("form.active")}
        </label>
        <Switch id="gift-active" checked={isActive} onCheckedChange={(c) => setIsActive(c)} />
      </div>
      <FormActions busy={busy} submitLabel={rule ? t("form.save") : t("form.create")} />
    </form>
  );
}
