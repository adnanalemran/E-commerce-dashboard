import { profileApi } from "@/api/profile";
import type { AuthUser } from "@/api/types";
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
import { useAuth } from "@/contexts";
import { useTranslations, type Translator } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function createSchema(t: Translator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("validation.nameMin"))
      .max(100, t("validation.nameMax")),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        t("validation.emailInvalid"),
      ),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
  /** Called with the new address after a confirmation email was sent. */
  onEmailChangeRequested: (email: string) => void;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  ...props
}: EditProfileDialogProps) {
  const t = useTranslations("profile");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-lg sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {t("edit.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {t("edit.description")}
          </DialogDescription>
        </DialogHeader>
        <EditProfileForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditProfileForm({
  user,
  onEmailChangeRequested,
  onDone,
}: Omit<EditProfileDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const t = useTranslations("profile");
  const { updateUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema(t)),
    defaultValues: { name: user.name, email: user.email ?? "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const emailChanged =
      values.email !== "" && values.email.toLowerCase() !== (user.email ?? "").toLowerCase();

    try {
      if (values.name !== user.name) {
        updateUser(await profileApi.update({ name: values.name }));
      }
      if (emailChanged) {
        await profileApi.requestEmailChange(values.email);
        onEmailChangeRequested(values.email);
      }
      onDone();
    } catch (error) {
      if (!applyFieldErrors(error, setError, { name: "name", email: "email" })) {
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
        <FieldLabel>{t("fields.name")}</FieldLabel>
        <Input
          {...register("name")}
          autoComplete="name"
          aria-invalid={errors.name ? "true" : undefined}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
        <FieldLabel>{t("fields.email")}</FieldLabel>
        <Input
          {...register("email")}
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
        />
        {errors.email ? (
          <FieldError errors={[errors.email]} />
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("edit.emailHint")}
          </p>
        )}
      </Field>

      <Field className="gap-1.5">
        <FieldLabel>{t("fields.phone")}</FieldLabel>
        <Input value={user.phone ?? ""} disabled readOnly />
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("edit.phoneHint")}</p>
      </Field>

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
          }
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("actions.saving") : t("actions.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
