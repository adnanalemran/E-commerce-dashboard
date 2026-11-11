import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import SignUp from "./index";

export default function SignUpPage() {
  const t = useTranslations("auth.signUp");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <SignUp />
    </>
  );
}
