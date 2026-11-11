import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import AuthHeader from "../auth-header";
import AuthShell from "../auth-shell";
import FormAlert from "../form-alert";
import { applyFieldErrors, getAuthErrorMessage } from "../utils";
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from "./schema";

export default function ForgotPassword() {
  const t = useTranslations("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const handleFormSubmit = async ({ email }: ForgotPasswordFormData) => {
    setFormError(null);
    try {
      await authApi.forgotPassword(email);
      setSentTo(email);
    } catch (error) {
      if (!applyFieldErrors(error, setError, { email: "email" })) {
        setFormError(getAuthErrorMessage(error, t));
      }
    }
  };

  return (
    <AuthShell back={{ to: "/signin", label: t("backToSignIn") }}>
      <AuthHeader
        title={t("forgotPassword.title")}
        description={t("forgotPassword.description")}
      />

      {sentTo ? (
        <FormAlert variant="success" title={t("forgotPassword.successTitle")}>
          {t("forgotPassword.successDescription", { email: sentTo })}
        </FormAlert>
      ) : (
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-5"
          noValidate
        >
          {formError && <FormAlert title={formError} />}

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel className="mb-1.5 block">
              {t("fields.email")} <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder={t("fields.emailPlaceholder")}
              aria-invalid={errors.email ? "true" : undefined}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submit")}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
        {t("forgotPassword.rememberPassword")}{" "}
        <Link
          to="/signin"
          className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {t("signUp.signInLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
