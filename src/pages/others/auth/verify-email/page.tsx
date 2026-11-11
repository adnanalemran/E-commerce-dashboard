import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import VerifyEmail from "./index";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("title")} />
      <VerifyEmail />
    </>
  );
}
