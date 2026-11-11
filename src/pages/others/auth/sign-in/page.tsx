import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import SignIn from "./index";

export default function SignInPage() {
  const t = useTranslations("auth.signIn");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <SignIn />
    </>
  );
}
