import { authApi } from "@/api/auth";
import { clearSession } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import AuthHeader from "../auth-header";
import AuthShell from "../auth-shell";
import FormAlert from "../form-alert";
import PasswordInput from "../password-input";
import { applyFieldErrors, getAuthErrorMessage } from "../utils";
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from "./schema";

const linkClass =
  "text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400";

export default function ResetPassword() {
  const t = useTranslations("auth");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const handleFormSubmit = async ({ newPassword }: ResetPasswordFormData) => {
    setFormError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      // The backend revokes every session on reset.
      clearSession({ broadcast: true });
      setIsDone(true);
    } catch (error) {
      if (!applyFieldErrors(error, setError, { newPassword: "newPassword" })) {
        setFormError(getAuthErrorMessage(error, t));
      }
    }
  };

  const renderContent = () => {
    if (!token) {
      return (
        <FormAlert title={t("resetPassword.missingTokenTitle")}>
          <p>{t("resetPassword.missingTokenDescription")}</p>
          <Link to="/forgot-password" className={linkClass}>
            {t("resetPassword.requestNewLink")}
          </Link>
        </FormAlert>
      );
    }

    if (isDone) {
      return (
        <FormAlert variant="success" title={t("resetPassword.successTitle")}>
          <p>{t("resetPassword.successDescription")}</p>
          <Link to="/signin" className={linkClass}>
            {t("goToSignIn")}
          </Link>
        </FormAlert>
      );
    }

    return (
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-5"
        noValidate
      >
        {formError && (
          <FormAlert title={formError}>
            <Link to="/forgot-password" className={linkClass}>
              {t("resetPassword.requestNewLink")}
            </Link>
          </FormAlert>
        )}

        <Field data-invalid={Boolean(errors.newPassword)}>
          <FieldLabel className="mb-1.5 block">
            {t("fields.newPassword")} <span className="text-red-500">*</span>
          </FieldLabel>
          <PasswordInput
            {...register("newPassword")}
            autoComplete="new-password"
            placeholder={t("fields.newPasswordPlaceholder")}
            aria-invalid={errors.newPassword ? "true" : undefined}
          />
          <FieldError errors={[errors.newPassword]} />
          {!errors.newPassword && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("fields.passwordHint")}
            </p>
          )}
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel className="mb-1.5 block">
            {t("fields.confirmPassword")}{" "}
            <span className="text-red-500">*</span>
          </FieldLabel>
          <PasswordInput
            {...register("confirmPassword")}
            autoComplete="new-password"
            placeholder={t("fields.confirmPasswordPlaceholder")}
            aria-invalid={errors.confirmPassword ? "true" : undefined}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("resetPassword.submitting")
            : t("resetPassword.submit")}
        </Button>
      </form>
    );
  };

  return (
    <AuthShell back={{ to: "/signin", label: t("backToSignIn") }}>
      <AuthHeader
        title={t("resetPassword.title")}
        description={t("resetPassword.description")}
      />
      {renderContent()}
    </AuthShell>
  );
}
