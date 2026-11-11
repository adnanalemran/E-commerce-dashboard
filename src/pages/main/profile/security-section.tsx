import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { KeyIcon, LogOutIcon } from "@/icons";
import { useState } from "react";
import ChangePasswordDialog from "./change-password-dialog";
import ConfirmDialog from "./confirm-dialog";
import { SectionCard, SectionRow } from "./section-card";
import { useAuth } from "@/contexts";

export default function SecuritySection() {
  const t = useTranslations("profile");
  const { logout } = useAuth();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSignOutAllOpen, setIsSignOutAllOpen] = useState(false);

  return (
    <>
      <SectionCard title={t("security.title")}>
        <SectionRow
          title={t("security.passwordTitle")}
          description={t("security.passwordDescription")}
          action={
            <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
              <KeyIcon className="size-5" />
              {t("security.passwordAction")}
            </Button>
          }
        />
        <SectionRow
          title={t("security.signOutAllTitle")}
          description={t("security.signOutAllDescription")}
          action={
            <Button variant="outline" onClick={() => setIsSignOutAllOpen(true)}>
              <LogOutIcon className="size-5 rtl:rotate-180" />
              {t("security.signOutAllAction")}
            </Button>
          }
        />
      </SectionCard>

      <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} />

      <ConfirmDialog
        open={isSignOutAllOpen}
        onOpenChange={setIsSignOutAllOpen}
        title={t("security.signOutAllConfirmTitle")}
        description={t("security.signOutAllConfirmDescription")}
        confirmLabel={t("security.signOutAllAction")}
        onConfirm={() => logout({ allDevices: true })}
      />
    </>
  );
}
