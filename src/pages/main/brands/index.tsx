import { brandsApi, type Brand } from "@/api/content";
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
import { Textarea } from "@/components/ui/textarea";
import { useTranslations, type Translator } from "@/i18n";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import ImageField, { type ImageFieldValue } from "../catalog/shared/image-field";

const schema = (t: Translator) =>
  z.object({
    name: z.string().trim().min(2, t("validation.nameMin")).max(100),
    description: z.string().trim().max(1000),
    orderNo: z.string().trim().refine((v) => v === "" || /^\d{1,6}$/.test(v), t("validation.orderNo")),
    isFeatured: z.boolean(),
  });
type Values = z.infer<ReturnType<typeof schema>>;

export default function BrandsPage() {
  const t = useTranslations("brands");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.brands, queryFn: ({ signal }) => brandsApi.list(signal) });
  const [editing, setEditing] = useState<Brand | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.brands });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };
  const brands = query.data ?? [];

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
          isEmpty={brands.length === 0}
          emptyTitle={t("empty")}
          emptyHint={t("emptyHint")}
          onRetry={() => void query.refetch()}
        >
          <ul className="divide-y divide-separator border-t border-separator">
            {brands.map((brand) => (
              <li key={brand.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-fill">
                  {brand.logo ? (
                    <img src={brand.logo} alt="" className="size-full object-contain" />
                  ) : (
                    <span className="text-lg font-semibold text-label-secondary">{brand.name.charAt(0)}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-label">{brand.name}</span>
                    {brand.isFeatured && (
                      <Badge variant="light" color="primary" size="sm">
                        {t("featured")}
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-label-secondary">
                    {t("productCount", { count: brand.productCount })} · /brand/{brand.slug}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("edit", { name: brand.name })}
                  onClick={() => {
                    setEditing(brand);
                    setFormOpen(true);
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t("delete", { name: brand.name })} onClick={() => setDeleting(brand)}>
                  <TrashBinIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ListState>
      </ListCard>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? t("editTitle") : t("createTitle")}>
        <BrandForm
          brand={editing}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      </FormDialog>
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { name: deleting?.name ?? "" })}
        description={t("deleteDescription")}
        onConfirm={async () => {
          await brandsApi.remove(deleting!.id);
          refresh();
        }}
      />
    </>
  );
}

function BrandForm({ brand, onSaved }: { brand: Brand | null; onSaved: () => void }) {
  const t = useTranslations("brands");
  const [logo, setLogo] = useState<ImageFieldValue>({ file: null, removed: false });
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
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      orderNo: brand ? String(brand.orderNo) : "",
      isFeatured: brand?.isFeatured ?? false,
    },
  });

  const onSubmit = async (v: Values) => {
    setFormError(null);
    const input = {
      name: v.name,
      description: v.description || null,
      isFeatured: v.isFeatured,
      orderNo: v.orderNo === "" ? undefined : Number(v.orderNo),
      logo: logo.file,
      removeLogo: logo.removed,
    };
    try {
      if (brand) await brandsApi.update(brand.id, input);
      else await brandsApi.create(input);
      onSaved();
    } catch (error) {
      if (!applyFieldErrors(error, setError, { name: "name", description: "description", orderNo: "orderNo" })) {
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
      <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
        <FieldLabel>{t("form.name")}</FieldLabel>
        <Input {...register("name")} autoFocus aria-invalid={errors.name ? "true" : undefined} />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel>{t("form.logo")}</FieldLabel>
        <ImageField initialUrl={brand?.logo ?? null} onChange={setLogo} disabled={isSubmitting} />
      </Field>
      <Field data-invalid={Boolean(errors.description)} className="gap-1.5">
        <FieldLabel>{t("form.description")}</FieldLabel>
        <Textarea {...register("description")} rows={3} />
        <FieldError errors={[errors.description]} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.orderNo)} className="gap-1.5">
          <FieldLabel>{t("form.orderNo")}</FieldLabel>
          <Input {...register("orderNo")} inputMode="numeric" placeholder="0" />
          <FieldError errors={[errors.orderNo]} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="brand-featured">{t("form.featured")}</FieldLabel>
          <div className="flex h-11 items-center gap-3">
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => <Switch id="brand-featured" checked={field.value} onCheckedChange={(c) => field.onChange(c)} />}
            />
            <span className="text-sm text-label-secondary">{t("form.featuredHint")}</span>
          </div>
        </Field>
      </div>
      <FormActions busy={isSubmitting} submitLabel={brand ? t("form.save") : t("form.create")} />
    </form>
  );
}
