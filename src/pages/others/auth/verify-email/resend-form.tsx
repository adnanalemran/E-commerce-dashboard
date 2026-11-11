import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormAlert from "../form-alert";
import {
  applyFieldErrors,
  createEmailSchema,
  getAuthErrorMessage,
} from "../utils";

interface EmailFormData {
  email: string;
}

export default function ResendVerificationForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const t = useTranslations("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(z.object({ email: createEmailSchema(t) })),
    defaultValues: { email: defaultEmail },
    mode: "onTouched",
  });

  const handleFormSubmit = async ({ email }: EmailFormData) => {
    setFormError(null);
    try {
      await authApi.resendVerification(email);
      setIsSent(true);
    } catch (error) {
      if (!applyFieldErrors(error, setError, { email: "email" })) {
        setFormError(getAuthErrorMessage(error, t));
      }
    }
  };

  if (isSent) {
    return (
      <FormAlert variant="success" title={t("verifyEmail.resendSuccess")} />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("verifyEmail.resendDescription")}
      </p>

      {formError && <FormAlert title={formError} />}

      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel className="mb-1.5 block">{t("fields.email")}</FieldLabel>
        <Input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder={t("fields.emailPlaceholder")}
          aria-invalid={errors.email ? "true" : undefined}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? t("verifyEmail.resendSubmitting")
          : t("verifyEmail.resendSubmit")}
      </Button>
    </form>
  );
}
