import { profileApi } from "@/api/profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { CheckCircleIcon, OctagonAlertIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { createPasswordSchema } from "@/utils/password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

/** `t` is scoped to `profile`, `tAuth` to `auth` (shared password rules). */
function createSchema(t: Translator, tAuth: Translator) {
  return z
    .object({
      currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
      newPassword: createPasswordSchema(tAuth),
      confirmNewPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t("validation.passwordSame"),
      path: ["newPassword"],
    });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("profile");
  const { logout } = useAuth();
  const [isDone, setIsDone] = useState(false);

  // The backend revokes every session after a password change, so finish by
  // signing out locally; ProtectedRoute then sends the user to /signin.
  const handleOpenChange = (next: boolean) => {
    if (!next && isDone) {
      void logout();
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-lg sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {t("password.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {t("password.description")}
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <>
            <Alert variant="success" className="p-4">
              <CheckCircleIcon className="size-5" />
              <AlertTitle className="text-sm">{t("password.successTitle")}</AlertTitle>
              <AlertDescription>{t("password.successDescription")}</AlertDescription>
            </Alert>
            <DialogFooter className="mx-0 mb-0 p-0 pt-2 sm:justify-end">
              <Button onClick={() => void logout()}>{t("password.signInAgain")}</Button>
            </DialogFooter>
          </>
        ) : (
          <ChangePasswordForm onSuccess={() => setIsDone(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema(t, tAuth)),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await profileApi.changePassword(values);
      onSuccess();
    } catch (error) {
      const mapped = applyFieldErrors(error, setError, {
        currentPassword: "currentPassword",
        newPassword: "newPassword",
        confirmNewPassword: "confirmNewPassword",
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

  const fields = [
    { name: "currentPassword", label: t("password.current"), autoComplete: "current-password" },
    { name: "newPassword", label: t("password.new"), autoComplete: "new-password" },
    { name: "confirmNewPassword", label: t("password.confirm"), autoComplete: "new-password" },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive" className="p-4">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle className="text-sm">{formError}</AlertTitle>
        </Alert>
      )}

      {fields.map((field) => (
        <Field key={field.name} data-invalid={Boolean(errors[field.name])} className="gap-1.5">
          <FieldLabel>{field.label}</FieldLabel>
          <Input
            {...register(field.name)}
            type="password"
            autoComplete={field.autoComplete}
            aria-invalid={errors[field.name] ? "true" : undefined}
          />
          {errors[field.name] ? (
            <FieldError errors={[errors[field.name]]} />
          ) : (
            field.name === "newPassword" && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tAuth("fields.passwordHint")}
              </p>
            )
          )}
        </Field>
      ))}

      <p className="text-xs text-gray-500 dark:text-gray-400">{t("password.signOutNotice")}</p>

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
          }
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("actions.saving") : t("password.submit")}
        </Button>
      </DialogFooter>
    </form>
  );
}
