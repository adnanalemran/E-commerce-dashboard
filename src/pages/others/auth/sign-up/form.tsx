import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import FormAlert from "../form-alert";
import PasswordInput from "../password-input";
import { applyFieldErrors, getAuthErrorMessage } from "../utils";
import { createSignUpSchema, type SignUpFormData } from "./schema";

export default function SignUpFormFields() {
  const t = useTranslations("auth");
  const { register: registerAccount } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onTouched",
  });

  const handleFormSubmit = async (data: SignUpFormData) => {
    setFormError(null);
    try {
      await registerAccount({
        name: `${data.fname} ${data.lname}`.trim(),
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      // GuestRoute redirects to the dashboard once the session is set.
    } catch (error) {
      const mapped = applyFieldErrors(error, setError, {
        name: "fname",
        email: "email",
        password: "password",
        confirmPassword: "confirmPassword",
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.fname)}>
          <FieldLabel className="mb-1.5 block">
            {t("fields.firstName")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("fname")}
            type="text"
            autoComplete="given-name"
            placeholder={t("fields.firstNamePlaceholder")}
            aria-invalid={errors.fname ? "true" : undefined}
          />
          <FieldError errors={[errors.fname]} />
        </Field>

        <Field data-invalid={Boolean(errors.lname)}>
          <FieldLabel className="mb-1.5 block">
            {t("fields.lastName")} <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("lname")}
            type="text"
            autoComplete="family-name"
            placeholder={t("fields.lastNamePlaceholder")}
            aria-invalid={errors.lname ? "true" : undefined}
          />
          <FieldError errors={[errors.lname]} />
        </Field>
      </div>

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

      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel className="mb-1.5 block">
          {t("fields.password")} <span className="text-red-500">*</span>
        </FieldLabel>
        <PasswordInput
          {...register("password")}
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          aria-invalid={errors.password ? "true" : undefined}
        />
        <FieldError errors={[errors.password]} />
        {!errors.password && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("fields.passwordHint")}
          </p>
        )}
      </Field>

      <Field data-invalid={Boolean(errors.confirmPassword)}>
        <FieldLabel className="mb-1.5 block">
          {t("fields.confirmPassword")} <span className="text-red-500">*</span>
        </FieldLabel>
        <PasswordInput
          {...register("confirmPassword")}
          autoComplete="new-password"
          placeholder={t("fields.confirmPasswordPlaceholder")}
          aria-invalid={errors.confirmPassword ? "true" : undefined}
        />
        <FieldError errors={[errors.confirmPassword]} />
      </Field>

      <Field
        orientation="horizontal"
        className="items-start gap-3"
        data-invalid={Boolean(errors.terms)}
      >
        <Controller
          control={control}
          name="terms"
          render={({ field }) => (
            <Checkbox
              id="terms"
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              aria-invalid={errors.terms ? "true" : undefined}
            />
          )}
        />
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="terms"
            className="inline-block cursor-pointer text-sm font-normal text-gray-500 dark:text-gray-400"
          >
            {t("signUp.termsPrefix")}{" "}
            <span className="text-gray-800 dark:text-white/90">
              {t("signUp.terms")}
            </span>{" "}
            {t("signUp.and")}{" "}
            <span className="text-gray-800 dark:text-white">
              {t("signUp.privacy")}
            </span>
          </FieldLabel>
          <FieldError errors={[errors.terms]} />
        </div>
      </Field>

      <div>
        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("signUp.submitting") : t("signUp.submit")}
        </Button>
      </div>
    </form>
  );
}
