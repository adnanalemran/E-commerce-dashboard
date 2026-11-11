import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import ResetPassword from "./index";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <ResetPassword />
    </>
  );
}
