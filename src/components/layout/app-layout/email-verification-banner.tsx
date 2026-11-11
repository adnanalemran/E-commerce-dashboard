import { authApi } from "@/api/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { AlertIcon } from "@/icons";
import { useState } from "react";

type ResendState = "idle" | "sending" | "sent" | "error";

/** Nudges signed-in users whose email address is not verified yet. */
export default function EmailVerificationBanner() {
  const t = useTranslations("auth.emailBanner");
  const { user } = useAuth();
  const [resendState, setResendState] = useState<ResendState>("idle");

  if (!user?.email || user.emailVerifiedAt) return null;

  const email = user.email;

  const handleResend = async () => {
    setResendState("sending");
    try {
      await authApi.resendVerification(email);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <Alert variant="warning" className="mb-4 p-4 md:mb-6">
      <AlertIcon className="size-5" />
      <AlertTitle className="text-sm">{t("title")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {resendState === "sent"
            ? t("sent", { email })
            : resendState === "error"
              ? t("error")
              : t("description", { email })}
        </span>
        {resendState !== "sent" && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={resendState === "sending"}
            onClick={handleResend}
          >
            {resendState === "sending" ? t("resending") : t("resend")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
