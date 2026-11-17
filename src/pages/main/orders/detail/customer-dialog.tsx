import type { DeliveryLocations, Order } from "@/api/orders";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n";
import { InfoCircleIcon, OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useLocations, useOrderMutations } from "../use-orders";
import { createCustomerSchema, toCustomerInput, zoneFor, type CustomerFormValues } from "./customer-schema";

export interface CustomerDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Staff correction of the customer's contact and delivery details. */
export default function CustomerDialog({ order, open, onOpenChange }: CustomerDialogProps) {
  const t = useTranslations("orders");
  const locations = useLocations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] overflow-y-auto p-6 sm:max-w-xl sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-label">{t("editCustomer.title")}</DialogTitle>
          <DialogDescription className="text-sm text-label-secondary">
            {t("editCustomer.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so every open starts from the order's current details. */}
        {open &&
          (locations.data ? (
            <CustomerForm order={order} locations={locations.data} onDone={() => onOpenChange(false)} />
          ) : locations.isPending ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-accent" />
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p role="alert" className="text-sm text-red-500 dark:text-red-400">
                {getApiErrorMessage(locations.error, {
                  network: t("errors.network"),
                  unexpected: t("errors.unexpected"),
                })}
              </p>
              <Button variant="outline" size="sm" onClick={() => void locations.refetch()}>
                {t("errors.retry")}
              </Button>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({
  order,
  locations,
  onDone,
}: {
  order: Order;
  locations: DeliveryLocations;
  onDone: () => void;
}) {
  const t = useTranslations("orders");
  const { updateCustomer } = useOrderMutations(order.id);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(createCustomerSchema(t)),
    defaultValues: {
      customerName: order.customerName,
      phone: order.phone,
      email: order.email ?? "",
      address: order.address,
      district: order.district ?? "",
      area: order.area ?? "",
      note: order.note ?? "",
    },
    mode: "onTouched",
  });

  const district = useWatch({ control, name: "district" });
  const area = useWatch({ control, name: "area" });
  const isDhaka = district === "Dhaka";
  const newZone = district ? zoneFor(locations, district, area) : null;
  const zoneChanges = newZone !== null && newZone !== order.deliveryZone;

  const districtItems = locations.districts.map((d) => ({ value: d.name, label: d.name }));
  const areaItems = [...locations.dhakaAreas.city, ...locations.dhakaAreas.suburb]
    .sort((a, b) => a.localeCompare(b))
    .map((a) => ({ value: a, label: a }));

  const onSubmit = async (values: CustomerFormValues) => {
    setFormError(null);
    try {
      await updateCustomer.mutateAsync(toCustomerInput(values));
      onDone();
    } catch (error) {
      const mapped = applyFieldErrors(error, setError, {
        customerName: "customerName",
        phone: "phone",
        email: "email",
        address: "address",
        district: "district",
        area: "area",
        note: "note",
      });
      if (!mapped) {
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
        <Field data-invalid={Boolean(errors.customerName)} className="gap-1.5">
          <FieldLabel htmlFor="customer-name">
            {t("detail.name")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="customer-name"
            {...register("customerName")}
            autoComplete="off"
            aria-invalid={errors.customerName ? "true" : undefined}
          />
          <FieldError errors={[errors.customerName]} />
        </Field>

        <Field data-invalid={Boolean(errors.phone)} className="gap-1.5">
          <FieldLabel htmlFor="customer-phone">
            {t("detail.phone")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="customer-phone"
            {...register("phone")}
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder="01XXXXXXXXX"
            autoComplete="off"
            aria-invalid={errors.phone ? "true" : undefined}
          />
          <FieldError errors={[errors.phone]} />
        </Field>
      </div>

      <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
        <FieldLabel htmlFor="customer-email">{t("detail.email")}</FieldLabel>
        <Input
          id="customer-email"
          {...register("email")}
          type="email"
          dir="ltr"
          autoComplete="off"
          aria-invalid={errors.email ? "true" : undefined}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field data-invalid={Boolean(errors.address)} className="gap-1.5">
        <FieldLabel htmlFor="customer-address">
          {t("detail.address")} <span className="text-red-500">*</span>
        </FieldLabel>
        <Textarea
          id="customer-address"
          {...register("address")}
          rows={2}
          maxLength={500}
          aria-invalid={errors.address ? "true" : undefined}
        />
        <FieldError errors={[errors.address]} />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.district)} className="gap-1.5">
          <FieldLabel>
            {t("editCustomer.district")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Controller
            control={control}
            name="district"
            render={({ field }) => (
              <Select
                items={districtItems}
                value={field.value || null}
                onValueChange={(value) => {
                  field.onChange(value ?? "");
                  // Dhaka areas and free-text thanas don't carry over between districts.
                  setValue("area", "", { shouldDirty: true });
                }}
              >
                <SelectTrigger onBlur={field.onBlur} aria-invalid={errors.district ? "true" : undefined}>
                  <SelectValue placeholder={t("editCustomer.districtPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {districtItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.district]} />
        </Field>

        <Field data-invalid={Boolean(errors.area)} className="gap-1.5">
          <FieldLabel htmlFor={isDhaka ? undefined : "customer-area"}>
            {t("editCustomer.area")}
            {isDhaka && <span className="text-red-500"> *</span>}
          </FieldLabel>
          {isDhaka ? (
            <Controller
              control={control}
              name="area"
              render={({ field }) => (
                <Select
                  items={areaItems}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger onBlur={field.onBlur} aria-invalid={errors.area ? "true" : undefined}>
                    <SelectValue placeholder={t("editCustomer.areaPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {areaItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <Input
              id="customer-area"
              {...register("area")}
              maxLength={60}
              placeholder={t("editCustomer.areaOptional")}
              aria-invalid={errors.area ? "true" : undefined}
            />
          )}
          <FieldError errors={[errors.area]} />
        </Field>
      </div>

      {zoneChanges && (
        <Alert variant={order.paymentStatus === "UNPAID" ? "info" : "warning"} className="p-4">
          <InfoCircleIcon className="size-5" />
          <AlertTitle className="text-sm">
            {t(order.paymentStatus === "UNPAID" ? "editCustomer.zoneChange" : "editCustomer.zoneChangePaid", {
              from: t(`zones.${order.deliveryZone}`),
              to: t(`zones.${newZone}`),
            })}
          </AlertTitle>
        </Alert>
      )}

      <Field data-invalid={Boolean(errors.note)} className="gap-1.5">
        <FieldLabel htmlFor="customer-note">{t("detail.note")}</FieldLabel>
        <Textarea
          id="customer-note"
          {...register("note")}
          rows={2}
          maxLength={500}
          aria-invalid={errors.note ? "true" : undefined}
        />
        <FieldError errors={[errors.note]} />
      </Field>

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isSubmitting}>
              {t("actions.close")}
            </Button>
          }
        />
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? t("actions.saving") : t("editCustomer.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
