import { pagesApi, type ContentPage } from "@/api/content";
import { queryKeys } from "@/api/query-client";
import { ConfirmDeleteDialog, FormActions, FormDialog, ListCard, ListState } from "@/components/shared/crud";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations, type Translator } from "@/i18n";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { applyFieldErrors, getApiErrorMessage } from "@/utils/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = (t: Translator) =>
  z.object({
    title: z.string().trim().min(2, t("validation.titleMin")).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), t("validation.slug")),
    content: z.string().trim().min(1, t("validation.content")).max(50_000),
    isPublished: z.boolean(),
    showInFooter: z.boolean(),
    orderNo: z.string().trim().refine((v) => v === "" || /^\d{1,5}$/.test(v), t("validation.orderNo")),
  });
type Values = z.infer<ReturnType<typeof schema>>;

export default function ContentPagesPage() {
  const t = useTranslations("contentPages");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.pages, queryFn: ({ signal }) => pagesApi.list(signal) });
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ContentPage | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.pages });
  const pages = query.data ?? [];

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      <ListCard
        title={t("listTitle")}
        description={t("description")}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            {t("create")}
          </Button>
        }
      >
        <ListState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={pages.length === 0}
          emptyTitle={t("empty")}
          emptyHint={t("emptyHint")}
          onRetry={() => void query.refetch()}
        >
          <ul className="divide-y divide-separator border-t border-separator">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-label">{p.title}</span>
                    <Badge variant="light" color={p.isPublished ? "success" : "gray"} size="sm">
                      {p.isPublished ? t("published") : t("draft")}
                    </Badge>
                  </span>
                  <span className="block font-mono text-xs text-label-secondary">/page/{p.slug}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("edit", { title: p.title })}
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t("delete", { title: p.title })} onClick={() => setDeleting(p)}>
                  <TrashBinIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ListState>
      </ListCard>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? t("editTitle") : t("createTitle")} wide>
        <PageForm
          page={editing}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      </FormDialog>
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { title: deleting?.title ?? "" })}
        description={t("deleteDescription")}
        onConfirm={async () => {
          await pagesApi.remove(deleting!.id);
          refresh();
        }}
      />
    </>
  );
}

function PageForm({ page, onSaved }: { page: ContentPage | null; onSaved: () => void }) {
  const t = useTranslations("contentPages");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(t)),
    defaultValues: {
      title: page?.title ?? "",
      slug: page?.slug ?? "",
      content: page?.content ?? "",
      isPublished: page?.isPublished ?? false,
      showInFooter: page?.showInFooter ?? true,
      orderNo: page ? String(page.orderNo) : "",
    },
  });

  const onSubmit = async (v: Values) => {
    setFormError(null);
    const input = {
      title: v.title,
      content: v.content,
      isPublished: v.isPublished,
      showInFooter: v.showInFooter,
      orderNo: v.orderNo === "" ? 0 : Number(v.orderNo),
      ...(v.slug ? { slug: v.slug } : {}),
    };
    try {
      if (page) await pagesApi.update(page.id, input);
      else await pagesApi.create(input as Parameters<typeof pagesApi.create>[0]);
      onSaved();
    } catch (error) {
      if (!applyFieldErrors(error, setError, { title: "title", slug: "slug", content: "content" })) {
        setFormError(getApiErrorMessage(error, { network: t("errors.network"), unexpected: t("errors.unexpected") }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>{formError}</AlertTitle>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.title)} className="gap-1.5">
          <FieldLabel>{t("form.title")}</FieldLabel>
          <Input {...register("title")} autoFocus aria-invalid={errors.title ? "true" : undefined} />
          <FieldError errors={[errors.title]} />
        </Field>
        <Field data-invalid={Boolean(errors.slug)} className="gap-1.5">
          <FieldLabel>{t("form.slug")}</FieldLabel>
          <Input {...register("slug")} className="font-mono" placeholder="how-to-order" />
          {errors.slug ? <FieldError errors={[errors.slug]} /> : <p className="text-xs text-label-secondary">{t("form.slugHint")}</p>}
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.content)} className="gap-1.5">
        <FieldLabel>{t("form.content")}</FieldLabel>
        <Textarea {...register("content")} rows={14} className="font-mono text-sm" placeholder={t("form.contentPlaceholder")} />
        {errors.content ? <FieldError errors={[errors.content]} /> : <p className="text-xs text-label-secondary">{t("form.contentHint")}</p>}
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["isPublished", "showInFooter"] as const).map((name) => (
          <div key={name} className="flex items-center justify-between gap-3 rounded-xl bg-fill px-4 py-3">
            <label htmlFor={`page-${name}`} className="text-sm text-label">
              {t(`form.${name}`)}
            </label>
            <Controller
              control={control}
              name={name}
              render={({ field }) => <Switch id={`page-${name}`} checked={field.value} onCheckedChange={(c) => field.onChange(c)} />}
            />
          </div>
        ))}
        <Field data-invalid={Boolean(errors.orderNo)} className="gap-1.5">
          <Input {...register("orderNo")} inputMode="numeric" placeholder={t("form.orderNo")} aria-label={t("form.orderNo")} />
          <FieldError errors={[errors.orderNo]} />
        </Field>
      </div>
      <FormActions busy={isSubmitting} submitLabel={page ? t("form.save") : t("form.create")} />
    </form>
  );
}
