import { clearSession } from "@/api/client";
import { profileApi } from "@/api/profile";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { TrashBinIcon } from "@/icons";
import { useState } from "react";
import ConfirmDialog from "./confirm-dialog";
import { SectionCard, SectionRow } from "./section-card";

export default function DangerZone() {
  const t = useTranslations("profile");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeactivate = async () => {
    await profileApi.deactivate();
    // The backend revoked every session; ProtectedRoute redirects to /signin.
    clearSession({ broadcast: true });
  };

  return (
    <>
      <SectionCard title={t("danger.title")}>
        <SectionRow
          title={t("danger.deactivateTitle")}
          description={t("danger.deactivateDescription")}
          action={
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(true)}
              className="border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <TrashBinIcon className="size-5" />
              {t("danger.deactivateAction")}
            </Button>
          }
        />
      </SectionCard>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t("danger.confirmTitle")}
        description={t("danger.confirmDescription")}
        confirmLabel={t("danger.deactivateAction")}
        destructive
        onConfirm={handleDeactivate}
      />
    </>
  );
}
