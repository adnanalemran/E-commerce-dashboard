import { productsApi, type Product } from "@/api/products";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n";
import { CheckCircleIcon, OctagonAlertIcon, TrashBinIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import DeleteProductDialog from "../delete-product-dialog";
import { useCategoryOptions } from "../use-products";
import ImagesManager, { type QueuedImage } from "./images-manager";
import {
  createProductFormSchema,
  NO_CATEGORY,
  toFormValues,
  toProductInput,
  type ProductFormValues,
} from "./schema";
import VariantsEditor from "./variants-editor";

interface EditorState {
  created?: boolean;
  imageUploadFailed?: boolean;
}

/** `/products/new` and `/products/:id/edit`. */
export default function ProductEditorPage() {
  const t = useTranslations("products");
  const { id } = useParams();
  const [loaded, setLoaded] = useState<{ id: string; product?: Product; error?: unknown } | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    productsApi
      .get(id, controller.signal)
      .then((product) => setLoaded({ id, product }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoaded({ id, error });
      });
    return () => controller.abort();
  }, [id]);

  if (!id) return <ProductForm product={null} />;

  if (loaded?.id !== id) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  if (!loaded.product) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium text-gray-800 dark:text-white/90">{t("editor.notFound")}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {getApiErrorMessage(loaded.error, {
            network: t("errors.network"),
            unexpected: t("errors.unexpected"),
          })}
        </p>
        <Button variant="outline" render={<Link to="/products" />} nativeButton={false}>
          {t("editor.backToList")}
        </Button>
      </div>
    );
  }

  // Keyed so switching products starts from fresh form state.
  return <ProductForm key={loaded.product.id} product={loaded.product} />;
}

function ProductForm({ product: initialProduct }: { product: Product | null }) {
  const t = useTranslations("products");
  const navigate = useNavigate();
  const location = useLocation();
  const categories = useCategoryOptions();

  const [product, setProduct] = useState(initialProduct);
  const [queued, setQueued] = useState<QueuedImage[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navState = (location.state ?? {}) as EditorState;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(createProductFormSchema(t)),
    defaultValues: toFormValues(initialProduct),
    mode: "onTouched",
  });

  const isNew = product === null;

  const onSubmit = async (values: ProductFormValues) => {
    setFormError(null);
    setJustSaved(false);
    const input = toProductInput(values);

    try {
      if (isNew) {
        const created = await productsApi.create(input);
        let imageUploadFailed = false;
        if (queued.length > 0) {
          try {
            await productsApi.uploadImages(
              created.id,
              queued.map((q) => q.file),
            );
          } catch {
            imageUploadFailed = true;
          }
        }
        const state: EditorState = { created: true, imageUploadFailed };
        void navigate(`/products/${created.id}/edit`, { replace: true, state });
        return;
      }

      const updated = await productsApi.update(product.id, input);
      setProduct(updated);
      reset(toFormValues(updated));
      setJustSaved(true);
    } catch (error) {
      const fieldMap: Record<string, Path<ProductFormValues>> = {
        name: "name",
        shortDescription: "shortDescription",
        description: "description",
        status: "status",
        categoryId: "categoryId",
        tags: "tags",
        orderNo: "orderNo",
      };
      values.variants.forEach((_, index) => {
        for (const field of ["name", "sku", "price", "compareAtPrice", "stock"] as const) {
          fieldMap[`variants.${index}.${field}`] = `variants.${index}.${field}`;
        }
      });
      if (!applyFieldErrors(error, setError, fieldMap)) {
        setFormError(
          getApiErrorMessage(error, {
            network: t("errors.network"),
            unexpected: t("errors.unexpected"),
          }),
        );
      }
    }
  };

  const statusItems = (["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((value) => ({
    value,
    label: t(`statuses.${value}`),
  }));
  const categoryItems = [
    { value: NO_CATEGORY, label: t("editor.noCategory") },
    ...categories.options,
  ];

  const title = isNew ? t("editor.createTitle") : product.name;

  return (
    <>
      <PageMeta title={`${title} | ${t("metaTitle")}`} description={t("description")} />
      <PageBreadcrumb pageTitle={title} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 pb-24">
        {navState.created && !justSaved && (
          <Alert variant={navState.imageUploadFailed ? "warning" : "success"} className="p-4">
            <CheckCircleIcon className="size-5" />
            <AlertTitle className="text-sm">
              {navState.imageUploadFailed ? t("editor.createdImagesFailed") : t("editor.created")}
            </AlertTitle>
          </Alert>
        )}
        {justSaved && (
          <Alert variant="success" className="p-4">
            <CheckCircleIcon className="size-5" />
            <AlertTitle className="text-sm">{t("editor.saved")}</AlertTitle>
          </Alert>
        )}
        {formError && (
          <Alert variant="destructive" className="p-4">
            <OctagonAlertIcon className="size-5" />
            <AlertTitle className="text-sm">{formError}</AlertTitle>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <FormCard title={t("editor.general")}>
              <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
                <FieldLabel>
                  {t("fields.name")} <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  {...register("name")}
                  placeholder={t("placeholders.name")}
                  aria-invalid={errors.name ? "true" : undefined}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={Boolean(errors.shortDescription)} className="gap-1.5">
                <FieldLabel>{t("fields.shortDescription")}</FieldLabel>
                <Textarea
                  {...register("shortDescription")}
                  rows={2}
                  placeholder={t("placeholders.shortDescription")}
                  aria-invalid={errors.shortDescription ? "true" : undefined}
                />
                <FieldError errors={[errors.shortDescription]} />
              </Field>

              <Field data-invalid={Boolean(errors.description)} className="gap-1.5">
                <FieldLabel>{t("fields.description")}</FieldLabel>
                <Textarea
                  {...register("description")}
                  rows={8}
                  placeholder={t("placeholders.description")}
                  aria-invalid={errors.description ? "true" : undefined}
                />
                <FieldError errors={[errors.description]} />
              </Field>
            </FormCard>

            <FormCard title={t("editor.images")}>
              <ImagesManager
                productId={product?.id ?? null}
                images={product?.images ?? []}
                onProductChange={setProduct}
                queued={queued}
                onQueuedChange={setQueued}
              />
            </FormCard>

            <FormCard title={t("editor.variants")} description={t("editor.variantsHint")}>
              <VariantsEditor control={control} register={register} errors={errors} />
            </FormCard>
          </div>

          <div className="space-y-6">
            <FormCard title={t("fields.status")}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select items={statusItems} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger aria-label={t("fields.status")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("editor.statusHint")}</p>
            </FormCard>

            <FormCard title={t("editor.organization")}>
              <Field data-invalid={Boolean(errors.categoryId)} className="gap-1.5">
                <FieldLabel>{t("fields.category")}</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      items={categoryItems}
                      value={field.value}
                      onValueChange={(v) => v && field.onChange(v)}
                      disabled={categories.isLoading}
                    >
                      <SelectTrigger aria-invalid={errors.categoryId ? "true" : undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoryId]} />
              </Field>

              <Field data-invalid={Boolean(errors.tags)} className="gap-1.5">
                <FieldLabel>{t("fields.tags")}</FieldLabel>
                <Input {...register("tags")} placeholder={t("placeholders.tags")} />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("editor.tagsHint")}</p>
              </Field>

              <Field data-invalid={Boolean(errors.orderNo)} className="gap-1.5">
                <FieldLabel>{t("fields.orderNo")}</FieldLabel>
                <Input
                  {...register("orderNo")}
                  inputMode="numeric"
                  placeholder={t("placeholders.orderNo")}
                  aria-invalid={errors.orderNo ? "true" : undefined}
                />
                <FieldError errors={[errors.orderNo]} />
              </Field>
            </FormCard>

            <FormCard title={t("editor.badges")} description={t("editor.badgesHint")}>
              {(["isBestSelling", "isNewArrival", "isFeatured"] as const).map((name) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <label htmlFor={`flag-${name}`} className="text-sm text-gray-700 dark:text-gray-300">
                    {t(`fields.${name}`)}
                  </label>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <Switch
                        id={`flag-${name}`}
                        size="sm"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                </div>
              ))}
            </FormCard>

            {!isNew && (
              <FormCard title={t("editor.dangerZone")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <TrashBinIcon className="size-4" />
                  {t("delete.confirm")}
                </Button>
              </FormCard>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:ps-(--sidebar-width) dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex max-w-(--breakpoint-2xl) items-center justify-end gap-3 md:px-2">
            {!isNew && isDirty && (
              <span className="me-auto text-sm text-gray-500 dark:text-gray-400">
                {t("editor.unsaved")}
              </span>
            )}
            <Button variant="outline" type="button" render={<Link to="/products" />} nativeButton={false}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
              {isSubmitting
                ? t("actions.saving")
                : isNew
                  ? t("actions.create")
                  : t("actions.save")}
            </Button>
          </div>
        </div>
      </form>

      {!isNew && (
        <DeleteProductDialog
          product={isDeleteOpen ? product : null}
          onOpenChange={setIsDeleteOpen}
          onDeleted={() => void navigate("/products", { replace: true })}
        />
      )}
    </>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
