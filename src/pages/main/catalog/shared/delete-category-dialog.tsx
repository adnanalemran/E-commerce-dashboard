import { categoriesApi, type Category } from "@/api/categories";
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
import { useTranslations } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
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
  const isBlocked = category.subcategoryCount > 0;

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
        <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("delete.title", { name: category.name })}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
          {isBlocked
            ? t("delete.blocked", { count: category.subcategoryCount })
            : t("delete.description")}
        </DialogDescription>
      </DialogHeader>

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
        {!isBlocked && (
          <Button
            variant="destructive"
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? t("delete.deleting") : t("delete.confirm")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
