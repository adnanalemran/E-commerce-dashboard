import type { OrderStatus } from "@/api/orders";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n";
import { useState } from "react";

export interface StatusDialogProps {
  /** Status to move to; `null` closes the dialog. */
  status: OrderStatus | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => Promise<unknown>;
  error: string | null;
}

/** Confirms a cancel/return, collecting the reason shown to staff and the customer. */
export default function StatusDialog({ status, onOpenChange, onConfirm, error }: StatusDialogProps) {
  return (
    <Dialog open={status !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] p-6 sm:max-w-md sm:p-8">
        {status && <StatusForm status={status} onConfirm={onConfirm} error={error} />}
      </DialogContent>
    </Dialog>
  );
}

function StatusForm({
  status,
  onConfirm,
  error,
}: {
  status: OrderStatus;
  onConfirm: (note: string) => Promise<unknown>;
  error: string | null;
}) {
  const t = useTranslations("orders");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const required = status === "CANCELLED";

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(note.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-2 pe-12 text-start">
        <DialogTitle className="text-xl font-semibold text-label">
          {t(`dialog.${status === "CANCELLED" ? "cancelTitle" : "returnTitle"}`)}
        </DialogTitle>
        <DialogDescription className="text-sm text-label-secondary">
          {t("dialog.restockNotice")}
        </DialogDescription>
      </DialogHeader>

      <Field className="gap-1.5">
        <FieldLabel>
          {t("dialog.reason")}
          {required && <span className="text-red-500"> *</span>}
        </FieldLabel>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t("dialog.reasonPlaceholder")}
          autoFocus
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={busy}>
              {t("actions.close")}
            </Button>
          }
        />
        <Button
          variant="destructive"
          type="button"
          disabled={busy || (required && !note.trim())}
          onClick={submit}
        >
          {busy ? t("actions.saving") : t(`transitions.${status}`)}
        </Button>
      </DialogFooter>
    </>
  );
}
