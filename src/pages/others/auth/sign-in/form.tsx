import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";
import FormAlert from "../form-alert";
import PasswordInput from "../password-input";
import { applyFieldErrors, getAuthErrorMessage } from "../utils";
import { createSignInSchema, type SignInFormData } from "./schema";

export default function SignInFormFields() {
  const t = useTranslations("auth");
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(createSignInSchema(t)),
    defaultValues: {
      identifier: "",
      password: "",
      keepLoggedIn: false,
    },
    mode: "onTouched",
  });

  const handleFormSubmit = async (data: SignInFormData) => {
    setFormError(null);
    try {
      await login({
        identifier: data.identifier,
        password: data.password,
        rememberMe: data.keepLoggedIn ?? false,
      });
      // GuestRoute redirects to the requested page once the session is set.
    } catch (error) {
      const mapped = applyFieldErrors(error, setError, {
        identifier: "identifier",
        password: "password",
      });
      if (!mapped) setFormError(getAuthErrorMessage(error, t));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
      noValidate
    >
      {formError && <FormAlert title={formError} />}

      <Field data-invalid={Boolean(errors.identifier)}>
        <FieldLabel className="mb-1.5 block">
          {t("fields.identifier")} <span className="text-red-500">*</span>
        </FieldLabel>
        <Input
          {...register("identifier")}
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder={t("fields.identifierPlaceholder")}
          aria-invalid={errors.identifier ? "true" : undefined}
        />
        <FieldError errors={[errors.identifier]} />
      </Field>

      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel className="mb-1.5 block">
          {t("fields.password")} <span className="text-red-500">*</span>
        </FieldLabel>
        <PasswordInput
          {...register("password")}
          autoComplete="current-password"
          placeholder={t("fields.passwordPlaceholder")}
          aria-invalid={errors.password ? "true" : undefined}
        />
        <FieldError errors={[errors.password]} />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Field orientation="horizontal" className="w-auto items-center gap-3">
          <Controller
            control={control}
            name="keepLoggedIn"
            render={({ field }) => (
              <Checkbox
                id="keep-logged-in"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          />
          <FieldLabel
            htmlFor="keep-logged-in"
            className="text-theme-sm block cursor-pointer font-normal text-gray-700 dark:text-gray-400"
          >
            {t("signIn.keepLoggedIn")}
          </FieldLabel>
        </Field>
        <Link
          to="/forgot-password"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {t("signIn.forgotPassword")}
        </Link>
      </div>

      <div>
        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("signIn.submitting") : t("signIn.submit")}
        </Button>
      </div>
    </form>
  );
}
