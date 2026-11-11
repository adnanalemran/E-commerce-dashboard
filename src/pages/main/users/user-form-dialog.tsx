import type { AuthUser } from "@/api/types";
import { usersApi, type UpdateUserInput, type UserStatus } from "@/api/users";
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
import { useTranslations } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { primaryRole, type RoleName } from "@/utils/roles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { createUserFormSchema, type UserFormValues } from "./schema";

const EDITABLE_STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** User being edited; `null` to create a new one. */
  user: AuthUser | null;
  /** The signed-in admin may not change their own role or status. */
  isSelf: boolean;
  /** Roles the signed-in admin may assign. */
  assignableRoles: RoleName[];
  /** Called after any successful change; `close` is false after a partial failure. */
  onSaved: (close: boolean) => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  ...formProps
}: UserFormDialogProps) {
  const t = useTranslations("users");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-6 sm:max-w-146 sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {formProps.user ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {formProps.user
              ? t("form.editDescription")
              : t("form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so every open starts from fresh state. */}
        <UserForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  user,
  isSelf,
  assignableRoles,
  onSaved,
}: Omit<UserFormDialogProps, "open" | "onOpenChange">) {
  const t = useTranslations("users");
  const isCreate = user === null;
  const currentRole = user ? (primaryRole(user.roles) ?? "") : "CUSTOMER";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserFormSchema(t, isCreate)),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      password: "",
      role: currentRole,
      status: user?.status ?? "ACTIVE",
    },
    mode: "onTouched",
  });

  // Keep the current role selectable even if this admin couldn't grant it.
  const roleOptions = assignableRoles.includes(currentRole as RoleName)
    ? assignableRoles
    : [...(currentRole ? [currentRole as RoleName] : []), ...assignableRoles];

  const fieldMap = {
    name: "name",
    email: "email",
    phone: "phone",
    password: "password",
    roles: "role",
    status: "status",
  } as const;

  const reportError = (error: unknown) => {
    if (!applyFieldErrors(error, setError, fieldMap)) {
      setFormError(
        getApiErrorMessage(error, {
          network: t("errors.network"),
          unexpected: t("errors.unexpected"),
        }),
      );
    }
  };

  const onSubmit = async (values: UserFormValues) => {
    setFormError(null);

    if (isCreate) {
      try {
        await usersApi.create({
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          password: values.password,
          roles: [values.role as RoleName],
        });
        onSaved(true);
      } catch (error) {
        reportError(error);
      }
      return;
    }

    // Edit: send only what changed, one endpoint per concern.
    const details: UpdateUserInput = {};
    if (values.name !== user.name) details.name = values.name;
    if (values.email && values.email !== (user.email ?? "")) details.email = values.email;
    if (values.phone && values.phone !== (user.phone ?? "")) details.phone = values.phone;

    const steps: (() => Promise<unknown>)[] = [];
    if (Object.keys(details).length > 0) {
      steps.push(() => usersApi.update(user.id, details));
    }
    if (!isSelf && values.role !== currentRole) {
      steps.push(() => usersApi.setRoles(user.id, [values.role as RoleName]));
    }
    if (!isSelf && values.status !== user.status) {
      steps.push(() => usersApi.setStatus(user.id, values.status as UserStatus));
    }

    let completed = 0;
    try {
      for (const step of steps) {
        await step();
        completed++;
      }
      onSaved(true);
    } catch (error) {
      reportError(error);
      if (completed > 0) onSaved(false); // refresh the list, keep the dialog open
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
          autoComplete="off"
          placeholder={t("form.namePlaceholder")}
          aria-invalid={errors.name ? "true" : undefined}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
          <FieldLabel>{t("form.email")}</FieldLabel>
          <Input
            {...register("email")}
            type="email"
            autoComplete="off"
            placeholder={t("form.emailPlaceholder")}
            aria-invalid={errors.email ? "true" : undefined}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={Boolean(errors.phone)} className="gap-1.5">
          <FieldLabel>{t("form.phone")}</FieldLabel>
          <Input
            {...register("phone")}
            type="tel"
            autoComplete="off"
            placeholder="+1234567890"
            aria-invalid={errors.phone ? "true" : undefined}
          />
          <FieldError errors={[errors.phone]} />
        </Field>
      </div>

      {isCreate && (
        <Field data-invalid={Boolean(errors.password)} className="gap-1.5">
          <FieldLabel>
            {t("form.password")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("password")}
            type="password"
            autoComplete="new-password"
            placeholder={t("form.passwordPlaceholder")}
            aria-invalid={errors.password ? "true" : undefined}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("form.passwordHint")}
            </p>
          )}
        </Field>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          control={control}
          name="role"
          label={t("form.role")}
          options={roleOptions.map((role) => ({
            value: role,
            label: t(`roles.${role}`),
          }))}
          disabled={isSelf}
          error={errors.role}
        />
        {!isCreate && (
          <SelectField
            control={control}
            name="status"
            label={t("form.status")}
            options={EDITABLE_STATUSES.map((status) => ({
              value: status,
              label: t(`statuses.${status}`),
            }))}
            disabled={isSelf}
            error={errors.status}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isSelf ? t("form.selfHint") : t("form.roleHint")}
      </p>

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
            : isCreate
              ? t("form.create")
              : t("form.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  disabled,
  error,
}: {
  control: Control<UserFormValues>;
  name: "role" | "status";
  label: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: { message?: string };
}) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            items={options}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
          >
            <SelectTrigger
              onBlur={field.onBlur}
              aria-invalid={error ? "true" : undefined}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError errors={[error]} />
    </Field>
  );
}
