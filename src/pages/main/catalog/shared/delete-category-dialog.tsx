import { categoriesApi, type Category } from "@/api/categories";
import { queryKeys } from "@/api/query-client";
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
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "@/i18n";
import { OctagonAlertIcon } from "@/icons";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export interface DeleteCategoryDialogProps {
  /** Category to delete; `null` closes the dialog. */
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (category: Category) => void;
}

export default function DeleteCategoryDialog({
  category,
  onOpenChange,
  onDeleted,
}: DeleteCategoryDialogProps) {
  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-md sm:p-8">
        {category && (
          <DeleteCategoryContent category={category} onDeleted={onDeleted} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryContent({
  category,
  onDeleted,
}: {
  category: Category;
  onDeleted: (category: Category) => void;
}) {
  const t = useTranslations("catalog");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fresh counts each time the dialog opens, so the warning matches what will happen.
  const impact = useQuery({
    queryKey: queryKeys.categories.deletionImpact(category.id),
    queryFn: ({ signal }) => categoriesApi.deletionImpact(category.id, signal),
    staleTime: 0,
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await categoriesApi.remove(category.id);
      onDeleted(category);
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          network: t("errors.network"),
          unexpected: t("errors.unexpected"),
        }),
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-2 pe-12 text-start">
        <DialogTitle className="text-xl font-semibold text-label">
          {t("delete.title", { name: category.name })}
        </DialogTitle>
        <DialogDescription className="text-sm text-label-secondary">
          {t("delete.description")}
        </DialogDescription>
      </DialogHeader>

      {impact.isPending ? (
        <div className="flex justify-center py-2">
          <Spinner className="size-5 text-accent" />
        </div>
      ) : (
        impact.data &&
        (impact.data.subcategories > 0 || impact.data.products > 0) && (
          <Alert variant="warning" className="p-4">
            <OctagonAlertIcon className="size-5" />
            <AlertTitle className="text-sm">{t("delete.impactTitle")}</AlertTitle>
            <AlertDescription className="mt-1 space-y-1 text-sm">
              {impact.data.subcategories > 0 && (
                <p>{t("delete.cascade", { count: impact.data.subcategories })}</p>
              )}
              {impact.data.products > 0 && <p>{t("delete.products", { count: impact.data.products })}</p>}
            </AlertDescription>
          </Alert>
        )
      )}

      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isDeleting}>
              {t("form.cancel")}
            </Button>
          }
        />
        <Button
          variant="destructive"
          type="button"
          disabled={isDeleting || impact.isPending}
          onClick={handleDelete}
        >
          {isDeleting ? t("delete.deleting") : t("delete.confirm")}
        </Button>
      </DialogFooter>
    </>
  );
}
