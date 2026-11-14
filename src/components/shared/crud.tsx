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
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState, type ReactNode } from "react";

/** Panel with a title, description and actions — the frame for simple admin lists. */
export function ListCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-label">{title}</h3>
          {description && <p className="text-sm text-label-secondary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Loading / error / empty states shared by the admin lists. */
export function ListState({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyHint,
  onRetry,
  rows = 4,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyTitle: string;
  emptyHint?: string;
  onRetry: () => void;
  rows?: number;
  children: ReactNode;
}) {
  const t = useTranslations("crud");
  if (error) {
    return (
      <div className="border-t border-separator px-6 py-12 text-center">
        <p className="text-sm text-label">{getApiErrorMessage(error, { network: t("network"), unexpected: t("unexpected") })}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-2 border-t border-separator px-5 py-4 sm:px-6">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="border-t border-separator px-6 py-14 text-center">
        <p className="font-medium text-label">{emptyTitle}</p>
        {emptyHint && <p className="mt-1 text-sm text-label-secondary">{emptyHint}</p>}
      </div>
    );
  }
  return <>{children}</>;
}

/** "Delete X?" confirmation that runs `onConfirm` and shows its error. */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<unknown>;
}) {
  const t = useTranslations("crud");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, { network: t("network"), unexpected: t("unexpected") }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-md sm:p-8">
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-label">{title}</DialogTitle>
          <DialogDescription className="text-sm text-label-secondary">{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
          <DialogClose
            render={
              <Button variant="outline" type="button" disabled={busy}>
                {t("cancel")}
              </Button>
            }
          />
          <Button variant="destructive" onClick={() => void run()} disabled={busy}>
            {busy ? t("deleting") : t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Dialog shell for create/edit forms; the form is mounted inside so it resets on each open. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-6 sm:p-8 ${wide ? "sm:max-w-3xl" : "sm:max-w-146"}`}
      >
        <DialogHeader className="gap-2 pe-12 text-start">
          <DialogTitle className="text-xl font-semibold text-label">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm text-label-secondary">{description}</DialogDescription>}
        </DialogHeader>
        {open && children}
      </DialogContent>
    </Dialog>
  );
}

/** Cancel + submit row for forms inside FormDialog. */
export function FormActions({ busy, submitLabel }: { busy: boolean; submitLabel: string }) {
  const t = useTranslations("crud");
  return (
    <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
      <DialogClose
        render={
          <Button variant="outline" type="button" disabled={busy}>
            {t("cancel")}
          </Button>
        }
      />
      <Button type="submit" disabled={busy}>
        {busy ? t("saving") : submitLabel}
      </Button>
    </DialogFooter>
  );
}
