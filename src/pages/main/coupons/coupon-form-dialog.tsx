import { COUPON_TYPES, couponsApi, type Coupon } from "@/api/coupons";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createCouponFormSchema, toCouponInput, toFormValues, type CouponFormValues } from "./schema";

export interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Coupon being edited; `null` to create one. */
  coupon: Coupon | null;
  onSaved: () => void;
}

export default function CouponFormDialog({ open, onOpenChange, coupon, onSaved }: CouponFormDialogProps) {
  const t = useTranslations("coupons");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-6 sm:max-w-160 sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-label">
            {coupon ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-label-secondary">{t("form.description")}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every open starts from fresh state. */}
        <CouponForm coupon={coupon} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}

const FIELD_MAP = {
  code: "code",
  description: "description",
  type: "type",
  value: "value",
  minSubtotal: "minSubtotal",
  maxDiscount: "maxDiscount",
  startsAt: "startsAt",
  endsAt: "endsAt",
  usageLimit: "usageLimit",
  perPhoneLimit: "perPhoneLimit",
} as const;

function CouponForm({ coupon, onSaved }: { coupon: Coupon | null; onSaved: () => void }) {
  const t = useTranslations("coupons");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(createCouponFormSchema(t)),
    defaultValues: toFormValues(coupon),
    mode: "onTouched",
  });
  const type = useWatch({ control, name: "type" });
  const typeItems = COUPON_TYPES.map((value) => ({ value, label: t(`types.${value}`) }));
  const locked = Boolean(coupon && coupon.usedCount > 0);

  const onSubmit = async (values: CouponFormValues) => {
    setFormError(null);
    const input = toCouponInput(values);
    try {
      if (coupon) await couponsApi.update(coupon.id, input);
      else await couponsApi.create(input);
      onSaved();
    } catch (error) {
      if (!applyFieldErrors(error, setError, FIELD_MAP)) {
        setFormError(getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.code)} className="gap-1.5">
          <FieldLabel>
            {t("form.code")} <span className="text-danger">*</span>
          </FieldLabel>
          <Input {...register("code")} autoFocus={!coupon} readOnly={locked} className="font-mono uppercase" placeholder="WELCOME10" aria-invalid={errors.code ? "true" : undefined} />
          {errors.code ? <FieldError errors={[errors.code]} /> : locked && <p className="text-xs text-label-secondary">{t("form.codeLocked")}</p>}
        </Field>

        <Field data-invalid={Boolean(errors.type)} className="gap-1.5">
          <FieldLabel>{t("form.type")}</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select items={typeItems} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                <SelectTrigger onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field data-invalid={Boolean(errors.description)} className="gap-1.5">
        <FieldLabel>{t("form.descriptionLabel")}</FieldLabel>
        <Input {...register("description")} placeholder={t("form.descriptionPlaceholder")} />
        {errors.description ? <FieldError errors={[errors.description]} /> : <p className="text-xs text-label-secondary">{t("form.descriptionHint")}</p>}
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {type !== "FREE_DELIVERY" && (
          <Field data-invalid={Boolean(errors.value)} className="gap-1.5">
            <FieldLabel>
              {type === "PERCENT" ? t("form.percent") : t("form.amount")} <span className="text-danger">*</span>
            </FieldLabel>
            <Input {...register("value")} inputMode="decimal" placeholder={type === "PERCENT" ? "10" : "100"} aria-invalid={errors.value ? "true" : undefined} />
            <FieldError errors={[errors.value]} />
          </Field>
        )}
        {type === "PERCENT" && (
          <Field data-invalid={Boolean(errors.maxDiscount)} className="gap-1.5">
            <FieldLabel>{t("form.maxDiscount")}</FieldLabel>
            <Input {...register("maxDiscount")} inputMode="decimal" placeholder={t("form.noLimit")} />
            <FieldError errors={[errors.maxDiscount]} />
          </Field>
        )}
        <Field data-invalid={Boolean(errors.minSubtotal)} className="gap-1.5">
          <FieldLabel>{t("form.minSubtotal")}</FieldLabel>
          <Input {...register("minSubtotal")} inputMode="decimal" placeholder={t("form.noMinimum")} />
          <FieldError errors={[errors.minSubtotal]} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.startsAt)} className="gap-1.5">
          <FieldLabel>{t("form.startsAt")}</FieldLabel>
          <Input {...register("startsAt")} type="datetime-local" />
          <FieldError errors={[errors.startsAt]} />
        </Field>
        <Field data-invalid={Boolean(errors.endsAt)} className="gap-1.5">
          <FieldLabel>{t("form.endsAt")}</FieldLabel>
          <Input {...register("endsAt")} type="datetime-local" />
          <FieldError errors={[errors.endsAt]} />
        </Field>
        <Field data-invalid={Boolean(errors.usageLimit)} className="gap-1.5">
          <FieldLabel>{t("form.usageLimit")}</FieldLabel>
          <Input {...register("usageLimit")} inputMode="numeric" placeholder={t("form.unlimited")} />
          <FieldError errors={[errors.usageLimit]} />
        </Field>
        <Field data-invalid={Boolean(errors.perPhoneLimit)} className="gap-1.5">
          <FieldLabel>{t("form.perPhoneLimit")}</FieldLabel>
          <Input {...register("perPhoneLimit")} inputMode="numeric" placeholder={t("form.unlimited")} />
          <FieldError errors={[errors.perPhoneLimit]} />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl bg-fill px-4 py-3">
        <label htmlFor="coupon-active" className="text-sm text-label">
          {t("form.active")}
          <span className="block text-xs text-label-secondary">{t("form.activeHint")}</span>
        </label>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => <Switch id="coupon-active" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />}
        />
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
          {isSubmitting ? t("form.saving") : coupon ? t("form.save") : t("form.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}
