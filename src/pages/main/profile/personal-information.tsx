import { profileApi } from "@/api/profile";
import type { AuthUser } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts";
import { useLocale, useTranslations } from "@/i18n";
import { CameraIcon, InfoCircleIcon, PencilIcon } from "@/icons";
import { getInitials } from "@/utils";
import { getApiErrorMessage } from "@/utils/form-errors";
import { ROLE_NAMES } from "@/utils/roles";
import { useRef, useState, type ChangeEvent } from "react";
import EditProfileDialog from "./edit-profile-dialog";
import { InfoField, SectionCard } from "./section-card";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export default function PersonalInformation({ user }: { user: AuthUser }) {
  const t = useTranslations("profile");
  const tRoles = useTranslations("users.roles");
  const tStatus = useTranslations("users.statuses");
  const locale = useLocale();
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const memberSince = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(user.createdAt),
  );

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) return setAvatarError(t("avatar.type"));
    if (file.size > AVATAR_MAX_BYTES) return setAvatarError(t("avatar.size"));

    setAvatarError(null);
    setIsUploading(true);
    try {
      updateUser(await profileApi.uploadAvatar(file));
    } catch (error) {
      setAvatarError(
        getApiErrorMessage(error, {
          network: t("errors.network"),
          unexpected: t("errors.unexpected"),
        }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const verificationBadge = (verified: boolean) => (
    <Badge variant="light" color={verified ? "success" : "warning"} size="sm">
      {verified ? t("verified") : t("unverified")}
    </Badge>
  );

  return (
    <>
      <SectionCard
        title={t("personal.title")}
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 px-3.5"
            onClick={() => setIsEditOpen(true)}
          >
            <PencilIcon className="size-4" />
            {t("personal.edit")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative w-fit shrink-0">
            <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-2xl font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="size-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label={t("avatar.change")}
              className="absolute -inset-e-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow-theme-xs transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-80 dark:border-gray-900"
            >
              {isUploading ? (
                <Spinner className="size-4" />
              ) : (
                <CameraIcon className="size-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <h4 className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">
              {user.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {user.roles.map((role) => (
                <Badge key={role} variant="light" color="primary" size="sm">
                  {(ROLE_NAMES as readonly string[]).includes(role)
                    ? tRoles(role)
                    : role}
                </Badge>
              ))}
              <Badge
                variant="light"
                color={user.status === "ACTIVE" ? "success" : "warning"}
                size="sm"
              >
                {tStatus(user.status)}
              </Badge>
            </div>
            {avatarError && (
              <p role="alert" className="text-sm text-red-500 dark:text-red-400">
                {avatarError}
              </p>
            )}
          </div>
        </div>

        {pendingEmail && (
          <Alert variant="info" className="mt-5 p-4">
            <InfoCircleIcon className="size-5" />
            <AlertTitle className="text-sm">{t("emailChange.pendingTitle")}</AlertTitle>
            <AlertDescription>
              {t("emailChange.pendingDescription", { email: pendingEmail })}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField label={t("fields.name")}>{user.name}</InfoField>
          <InfoField label={t("fields.email")}>
            {user.email ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="break-all">{user.email}</span>
                {verificationBadge(Boolean(user.emailVerifiedAt))}
              </span>
            ) : (
              "—"
            )}
          </InfoField>
          <InfoField label={t("fields.phone")}>
            {user.phone ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>{user.phone}</span>
                {verificationBadge(Boolean(user.phoneVerifiedAt))}
              </span>
            ) : (
              "—"
            )}
          </InfoField>
          <InfoField label={t("fields.memberSince")}>{memberSince}</InfoField>
        </div>
      </SectionCard>

      <EditProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={user}
        onEmailChangeRequested={setPendingEmail}
      />
    </>
  );
}
