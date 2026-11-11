import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import ForgotPassword from "./index";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <ForgotPassword />
    </>
  );
}
