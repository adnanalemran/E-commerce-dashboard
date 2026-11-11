import { profileApi } from "@/api/profile";
import { queryKeys } from "@/api/query-client";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import DangerZone from "./danger-zone";
import PersonalInformation from "./personal-information";
import SecuritySection from "./security-section";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, updateUser } = useAuth();

  // Refresh from the server so the page never shows stale session data.
  const { data: freshUser } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => profileApi.get(signal),
    staleTime: 0,
  });
  useEffect(() => {
    if (freshUser) updateUser(freshUser);
  }, [freshUser, updateUser]);

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
