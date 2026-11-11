import { categoriesApi, type Category, type CategoryInput } from "@/api/categories";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ImageField, { type ImageFieldValue } from "./image-field";
import { createCategoryFormSchema, type CategoryFormValues } from "./schema";
import type { CategoryLevel } from "./types";

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: CategoryLevel;
  /** Category being edited; `null` to create a new one. */
  category: Category | null;
  /** Top-level categories offered as parents (subcategory level only). */
  parents: Category[];
  /** Pre-selected parent when creating a subcategory. */
  defaultParentId?: string;
  onSaved: (category: Category) => void;
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  ...formProps
}: CategoryFormDialogProps) {
  const t = useTranslations("catalog");
  const section = formProps.level === "sub" ? "subcategories" : "categories";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-6 sm:max-w-146 sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {formProps.category
              ? t(`${section}.editTitle`)
              : t(`${section}.createTitle`)}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {t(`${section}.formDescription`)}
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so every open starts from fresh state. */}
        <CategoryForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  level,
  category,
  parents,
  defaultParentId,
  onSaved,
}: Omit<CategoryFormDialogProps, "open" | "onOpenChange">) {
  const t = useTranslations("catalog");
  const isSub = level === "sub";
  const [image, setImage] = useState<ImageFieldValue>({
    file: null,
    removed: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategoryFormSchema(t, isSub)),
    defaultValues: {
      name: category?.name ?? "",
      parentId: category?.parentId ?? defaultParentId ?? "",
      orderNo: category ? String(category.orderNo) : "",
      isFeatured: category?.isFeatured ?? false,
    },
    mode: "onTouched",
  });

  const parentItems = parents.map((parent) => ({
    value: parent.id,
    label: parent.name,
  }));

  const onSubmit = async (values: CategoryFormValues) => {
    setFormError(null);

    const input: CategoryInput = {
      name: values.name,
      parentId: isSub ? values.parentId : null,
      isFeatured: values.isFeatured,
      orderNo: values.orderNo === "" ? undefined : Number(values.orderNo),
      image: image.file,
      removeImage: image.removed,
    };

    try {
      const saved = category
        ? await categoriesApi.update(category.id, input)
        : await categoriesApi.create(input);
      onSaved(saved);
    } catch (error) {
      const mapped = applyFieldErrors(error, setError, {
        name: "name",
        parentId: "parentId",
        orderNo: "orderNo",
      });
      if (!mapped) {
        setFormError(
          getApiErrorMessage(error, {
            network: t("errors.network"),
            unexpected: t("errors.unexpected"),
          }),
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive" className="p-4">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle className="text-sm">{formError}</AlertTitle>
        </Alert>
      )}

      <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
        <FieldLabel>
          {t("form.name")} <span className="text-red-500">*</span>
        </FieldLabel>
        <Input
          {...register("name")}
          autoFocus
          placeholder={t(isSub ? "form.subNamePlaceholder" : "form.namePlaceholder")}
          aria-invalid={errors.name ? "true" : undefined}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      {isSub && (
        <Field data-invalid={Boolean(errors.parentId)} className="gap-1.5">
          <FieldLabel>
            {t("form.parent")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                items={parentItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <SelectTrigger
                  onBlur={field.onBlur}
                  aria-invalid={errors.parentId ? "true" : undefined}
                >
                  <SelectValue placeholder={t("form.parentPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {parentItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.parentId]} />
        </Field>
      )}

      <Field className="gap-1.5">
        <FieldLabel>{t("form.image")}</FieldLabel>
        <ImageField
          initialUrl={category?.image ?? null}
          onChange={setImage}
          disabled={isSubmitting}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.orderNo)} className="gap-1.5">
          <FieldLabel>{t("form.orderNo")}</FieldLabel>
          <Input
            {...register("orderNo")}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder={t("form.orderNoPlaceholder")}
            aria-invalid={errors.orderNo ? "true" : undefined}
          />
          {errors.orderNo ? (
            <FieldError errors={[errors.orderNo]} />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("form.orderNoHint")}
            </p>
          )}
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="category-featured">{t("form.featured")}</FieldLabel>
          <div className="flex h-11 items-center gap-3">
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Switch
                  id="category-featured"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("form.featuredHint")}
            </span>
          </div>
        </Field>
      </div>

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isSubmitting}>
              {t("form.cancel")}
            </Button>
          }
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("form.saving")
            : category
              ? t("form.save")
              : t("form.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}
