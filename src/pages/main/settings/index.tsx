import { queryKeys } from "@/api/query-client";
import { settingsApi, type StoreSettings } from "@/api/settings";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useForm, type FieldError as RHFFieldError, type Path } from "react-hook-form";
import { createSettingsSchema, toFormValues, toSettings, type SettingsFormValues } from "./schema";

const ZONES = ["INSIDE_DHAKA", "DHAKA_SUBURB", "OUTSIDE_DHAKA"] as const;

export default function SettingsPage() {
  const t = useTranslations("settings");
  const query = useQuery({ queryKey: queryKeys.settings, queryFn: ({ signal }) => settingsApi.get(signal) });

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      {query.error ? (
        <Alert variant="destructive">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle>{getApiErrorMessage(query.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}</AlertTitle>
        </Alert>
      ) : !query.data ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        // Keyed so a refetch after saving starts the form from the saved values.
        <SettingsForm key={query.dataUpdatedAt} settings={query.data} />
      )}
    </>
  );
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const t = useTranslations("settings");
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(createSettingsSchema(t)),
    defaultValues: toFormValues(settings),
    mode: "onTouched",
  });

  const save = useMutation({
    mutationFn: (values: SettingsFormValues) => settingsApi.save(toSettings(values)),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings, data);
      reset(toFormValues(data));
      setSaved(true);
    },
  });

  const field = (name: Path<SettingsFormValues>, label: string, opts: { hint?: string; placeholder?: string; inputMode?: "tel" | "numeric" | "email" | "url" } = {}) => {
    const error = name.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], errors) as RHFFieldError | undefined;
    return (
      <Field data-invalid={Boolean(error)} className="gap-1.5">
        <FieldLabel>{label}</FieldLabel>
        <Input {...register(name)} placeholder={opts.placeholder} inputMode={opts.inputMode} aria-invalid={error ? "true" : undefined} />
        {error ? <FieldError errors={[error]} /> : opts.hint && <p className="text-xs text-label-secondary">{opts.hint}</p>}
      </Field>
    );
  };

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setSaved(false);
        save.mutate(values);
      })}
      noValidate
      className="space-y-6 pb-24"
    >
      {save.error && (
        <Alert variant="destructive">
          <OctagonAlertIcon className="size-5" />
          <AlertTitle>{getApiErrorMessage(save.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}</AlertTitle>
        </Alert>
      )}

      <Section title={t("contact.title")} description={t("contact.description")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {field("contact.hotline", t("contact.hotline"), { placeholder: "09612345678", inputMode: "tel", hint: t("contact.hotlineHint") })}
          {field("contact.phone", t("contact.phone"), { placeholder: "01712345678", inputMode: "tel" })}
          {field("contact.whatsapp", t("contact.whatsapp"), { placeholder: "01712345678", inputMode: "tel" })}
          {field("contact.messengerUrl", t("contact.messenger"), { placeholder: "https://m.me/yourpage", inputMode: "url" })}
          {field("contact.email", t("contact.email"), { placeholder: "support@example.com", inputMode: "email" })}
          {field("contact.hours", t("contact.hours"), { placeholder: t("contact.hoursPlaceholder") })}
        </div>
        <div className="mt-5">{field("contact.address", t("contact.address"))}</div>
      </Section>

      <Section title={t("socials.title")} description={t("socials.description")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {field("socials.facebook", "Facebook", { placeholder: "https://facebook.com/…", inputMode: "url" })}
          {field("socials.instagram", "Instagram", { placeholder: "https://instagram.com/…", inputMode: "url" })}
          {field("socials.youtube", "YouTube", { placeholder: "https://youtube.com/@…", inputMode: "url" })}
          {field("socials.tiktok", "TikTok", { placeholder: "https://tiktok.com/@…", inputMode: "url" })}
        </div>
      </Section>

      <Section title={t("tracking.title")} description={t("tracking.description")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {field("tracking.facebookPixelId", t("tracking.pixel"), { placeholder: "123456789012345", inputMode: "numeric" })}
          {field("tracking.gtmId", t("tracking.gtm"), { placeholder: "GTM-XXXXXXX" })}
          {field("tracking.ga4Id", t("tracking.ga4"), { placeholder: "G-XXXXXXXXXX" })}
        </div>
      </Section>

      <Section title={t("announcements.title")} description={t("announcements.description")}>
        <Field data-invalid={Boolean(errors.announcements)} className="gap-1.5">
          <FieldLabel>{t("announcements.label")}</FieldLabel>
          <Textarea {...register("announcements")} rows={4} placeholder={t("announcements.placeholder")} />
          {errors.announcements ? <FieldError errors={[errors.announcements]} /> : <p className="text-xs text-label-secondary">{t("announcements.hint")}</p>}
        </Field>
      </Section>

      <Section title={t("delivery.title")} description={t("delivery.description")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {ZONES.map((zone) => (
            <div key={zone} className="space-y-4 rounded-xl bg-fill p-4">
              <p className="text-sm font-semibold text-label">{t(`delivery.zones.${zone}`)}</p>
              {field(`delivery.charges.${zone}`, t("delivery.charge"), { inputMode: "numeric" })}
              {field(`delivery.estimatedDays.${zone}`, t("delivery.days"), { placeholder: "1-2" })}
            </div>
          ))}
        </div>
        <div className="mt-5 max-w-sm">
          {field("delivery.freeInsideDhakaFrom", t("delivery.freeFrom"), { inputMode: "numeric", hint: t("delivery.freeFromHint") })}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-40 material border-t border-separator px-4 py-3 xl:ps-(--sidebar-width,18.125rem)">
        <div className="mx-auto flex max-w-(--breakpoint-2xl) items-center justify-end gap-3 md:px-2">
          <span className="me-auto text-sm text-label-secondary" role="status">
            {isDirty ? t("unsaved") : saved ? t("saved") : ""}
          </span>
          <Button type="button" variant="outline" disabled={!isDirty || save.isPending} onClick={() => reset()}>
            {t("discard")}
          </Button>
          <Button type="submit" disabled={!isDirty || save.isPending}>
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h3 className="text-base font-semibold text-label">{title}</h3>
      <p className="mb-5 text-sm text-label-secondary">{description}</p>
      {children}
    </section>
  );
}
