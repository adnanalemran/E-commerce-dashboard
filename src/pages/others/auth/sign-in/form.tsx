import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { EnvelopeIcon } from "@/icons";
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
      className="space-y-4"
      noValidate
    >
      {formError && <FormAlert title={formError} />}

      <Field data-invalid={Boolean(errors.identifier)} className="gap-1.5">
        <FieldLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t("fields.identifier")}
        </FieldLabel>
        <InputGroup className="rounded-xl border-gray-300/80 bg-gray-50/50 transition-all hover:bg-white focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 dark:focus-within:bg-gray-900">
          <InputGroupAddon
            align="inline-start"
            className="text-gray-400 dark:text-gray-500"
          >
            <EnvelopeIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            {...register("identifier")}
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder={t("fields.identifierPlaceholder")}
            aria-invalid={errors.identifier ? "true" : undefined}
          />
        </InputGroup>
        <FieldError errors={[errors.identifier]} />
      </Field>

      <Field data-invalid={Boolean(errors.password)} className="gap-1.5">
        <FieldLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {t("fields.password")}
        </FieldLabel>
        <PasswordInput
          {...register("password")}
          autoComplete="current-password"
          placeholder={t("fields.passwordPlaceholder")}
          aria-invalid={errors.password ? "true" : undefined}
        />
        <FieldError errors={[errors.password]} />
      </Field>

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <Controller
            control={control}
            name="keepLoggedIn"
            render={({ field }) => (
              <Checkbox
                id="keep-logged-in"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                className="rounded-md border-gray-300 data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
              />
            )}
          />
          <FieldLabel
            htmlFor="keep-logged-in"
            className="cursor-pointer select-none text-xs font-normal text-gray-600 dark:text-gray-400"
          >
            {t("signIn.keepLoggedIn")}
          </FieldLabel>
        </Field>
        <Link
          to="/forgot-password"
          className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
        >
          {t("signIn.forgotPassword")}
        </Link>
      </div>

      <div className="pt-2">
        <Button
          className="flex h-11.5 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-medium text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.99] disabled:opacity-60"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="size-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>{t("signIn.submitting")}</span>
            </>
          ) : (
            <span>{t("signIn.submit")}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
