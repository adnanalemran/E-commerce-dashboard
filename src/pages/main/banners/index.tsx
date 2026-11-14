import { BANNER_PLACEMENTS, bannersApi, type Banner } from "@/api/content";
import { queryKeys } from "@/api/query-client";
import { ConfirmDeleteDialog, FormActions, FormDialog, ListCard, ListState } from "@/components/shared/crud";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocale, useTranslations, type Translator } from "@/i18n";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import ImageField, { type ImageFieldValue } from "../catalog/shared/image-field";

const schema = (t: Translator) =>
  z
    .object({
      title: z.string().trim().min(2, t("validation.titleMin")).max(120),
      subtitle: z.string().trim().max(200),
      ctaLabel: z.string().trim().max(40),
      href: z
        .string()
        .trim()
        .max(300)
        .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), t("validation.href")),
      placement: z.enum(BANNER_PLACEMENTS),
      orderNo: z.string().trim().refine((v) => v === "" || /^\d{1,6}$/.test(v), t("validation.orderNo")),
      isActive: z.boolean(),
      startsAt: z.string(),
      endsAt: z.string(),
    })
    .refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, { path: ["endsAt"], message: t("validation.endAfterStart") });
type Values = z.infer<ReturnType<typeof schema>>;

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function BannersPage() {
  const t = useTranslations("banners");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.banners, queryFn: ({ signal }) => bannersApi.list(signal) });
  const [editing, setEditing] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.banners });
  const banners = query.data ?? [];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

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
          isEmpty={banners.length === 0}
          emptyTitle={t("empty")}
          emptyHint={t("emptyHint")}
          onRetry={() => void query.refetch()}
        >
          {BANNER_PLACEMENTS.map((placement) => {
            const group = banners.filter((b) => b.placement === placement);
            if (group.length === 0) return null;
            return (
              <section key={placement} className="border-t border-separator">
                <h4 className="bg-fill px-5 py-2 text-xs font-semibold tracking-wide text-label-secondary uppercase sm:px-6">
                  {t(`placements.${placement}`)}
                </h4>
                <ul className="divide-y divide-separator">
                  {group.map((b) => (
                    <li key={b.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                      <span className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-fill">
                        {b.image && <img src={b.image} alt="" className="size-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-label">{b.title}</span>
                          <Badge variant="light" color={b.isActive ? "success" : "gray"} size="sm">
                            {b.isActive ? t("active") : t("hidden")}
                          </Badge>
                        </span>
                        <span className="block truncate text-xs text-label-secondary">
                          {b.href ?? t("noLink")}
                          {(b.startsAt || b.endsAt) &&
                            ` · ${b.startsAt ? date.format(new Date(b.startsAt)) : "…"} – ${b.endsAt ? date.format(new Date(b.endsAt)) : "…"}`}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("edit", { title: b.title })}
                        onClick={() => {
                          setEditing(b);
                          setFormOpen(true);
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={t("delete", { title: b.title })} onClick={() => setDeleting(b)}>
                        <TrashBinIcon className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </ListState>
      </ListCard>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? t("editTitle") : t("createTitle")} description={t("formHint")}>
        <BannerForm
          banner={editing}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      </FormDialog>
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { title: deleting?.title ?? "" })}
        description={t("deleteDescription")}
        onConfirm={async () => {
          await bannersApi.remove(deleting!.id);
          refresh();
        }}
      />
    </>
  );
}

function BannerForm({ banner, onSaved }: { banner: Banner | null; onSaved: () => void }) {
  const t = useTranslations("banners");
  const [image, setImage] = useState<ImageFieldValue>({ file: null, removed: false });
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(t)),
    defaultValues: {
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      ctaLabel: banner?.ctaLabel ?? "",
      href: banner?.href ?? "",
      placement: banner?.placement ?? "HERO",
      orderNo: banner ? String(banner.orderNo) : "",
      isActive: banner?.isActive ?? true,
      startsAt: toLocalInput(banner?.startsAt ?? null),
      endsAt: toLocalInput(banner?.endsAt ?? null),
    },
  });
  const placementItems = BANNER_PLACEMENTS.map((value) => ({ value, label: t(`placements.${value}`) }));

  const onSubmit = async (v: Values) => {
    setFormError(null);
    const input = {
      title: v.title,
      subtitle: v.subtitle || null,
      ctaLabel: v.ctaLabel || null,
      href: v.href || null,
      placement: v.placement,
      orderNo: v.orderNo === "" ? 0 : Number(v.orderNo),
      isActive: v.isActive,
      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
      endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
      image: image.file,
      removeImage: image.removed,
    };
    try {
      if (banner) await bannersApi.update(banner.id, input);
      else await bannersApi.create(input);
      onSaved();
    } catch (error) {
      if (!applyFieldErrors(error, setError, { title: "title", href: "href", subtitle: "subtitle", endsAt: "endsAt" })) {
        setFormError(getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>{formError}</AlertTitle>
        </Alert>
      )}
      <Field data-invalid={Boolean(errors.title)} className="gap-1.5">
        <FieldLabel>{t("form.title")}</FieldLabel>
        <Input {...register("title")} autoFocus aria-invalid={errors.title ? "true" : undefined} />
        <FieldError errors={[errors.title]} />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel>{t("form.subtitle")}</FieldLabel>
        <Input {...register("subtitle")} />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel>{t("form.image")}</FieldLabel>
        <ImageField initialUrl={banner?.image ?? null} onChange={setImage} disabled={isSubmitting} />
        <p className="text-xs text-label-secondary">{t("form.imageHint")}</p>
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field className="gap-1.5">
          <FieldLabel>{t("form.ctaLabel")}</FieldLabel>
          <Input {...register("ctaLabel")} placeholder={t("form.ctaPlaceholder")} />
        </Field>
        <Field data-invalid={Boolean(errors.href)} className="gap-1.5">
          <FieldLabel>{t("form.href")}</FieldLabel>
          <Input {...register("href")} placeholder="/category/honey" />
          <FieldError errors={[errors.href]} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>{t("form.placement")}</FieldLabel>
          <Controller
            control={control}
            name="placement"
            render={({ field }) => (
              <Select items={placementItems} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {placementItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field data-invalid={Boolean(errors.orderNo)} className="gap-1.5">
          <FieldLabel>{t("form.orderNo")}</FieldLabel>
          <Input {...register("orderNo")} inputMode="numeric" placeholder="0" />
          <FieldError errors={[errors.orderNo]} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>{t("form.startsAt")}</FieldLabel>
          <Input {...register("startsAt")} type="datetime-local" />
        </Field>
        <Field data-invalid={Boolean(errors.endsAt)} className="gap-1.5">
          <FieldLabel>{t("form.endsAt")}</FieldLabel>
          <Input {...register("endsAt")} type="datetime-local" />
          <FieldError errors={[errors.endsAt]} />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-fill px-4 py-3">
        <label htmlFor="banner-active" className="text-sm text-label">
          {t("form.active")}
        </label>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => <Switch id="banner-active" checked={field.value} onCheckedChange={(c) => field.onChange(c)} />}
        />
      </div>
      <FormActions busy={isSubmitting} submitLabel={banner ? t("form.save") : t("form.create")} />
    </form>
  );
}
