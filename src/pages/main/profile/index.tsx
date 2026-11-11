import { profileApi } from "@/api/profile";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { useEffect, useEffectEvent } from "react";
import DangerZone from "./danger-zone";
import PersonalInformation from "./personal-information";
import SecuritySection from "./security-section";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, updateUser } = useAuth();

  const onFetched = useEffectEvent(updateUser);

  // Refresh from the server so the page never shows stale session data.
  useEffect(() => {
    const controller = new AbortController();
    profileApi
      .get(controller.signal)
      .then(onFetched)
      .catch(() => {
        // Keep showing the session copy; API errors surface on actions.
      });
    return () => controller.abort();
  }, []);

  if (!user) return null;

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      <div className="space-y-6">
        <PersonalInformation user={user} />
        <SecuritySection />
        <DangerZone />
      </div>
    </>
  );
}
