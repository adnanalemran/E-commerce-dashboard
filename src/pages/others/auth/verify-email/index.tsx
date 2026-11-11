import { authApi } from "@/api/auth";
import { refreshSession } from "@/api/client";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts";
import { useTranslations } from "@/i18n";
import { useEffect, useEffectEvent, useState } from "react";
import { Link, useSearchParams } from "react-router";
import AuthHeader from "../auth-header";
import AuthShell from "../auth-shell";
import FormAlert from "../form-alert";
import { getAuthErrorMessage } from "../utils";
import ResendVerificationForm from "./resend-form";

// Verification tokens are single-use: share one request per token so React
// StrictMode's double-invoked effects don't burn the token twice.
const verifications = new Map<string, Promise<null>>();

function verifyOnce(token: string) {
  let request = verifications.get(token);
  if (!request) {
    request = authApi.verifyEmail(token);
    verifications.set(token, request);
  }
  return request;
}

type VerifyState =
  | { status: "verifying" }
  | { status: "success" }
  | { status: "error"; message: string };

const linkClass =
  "text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400";

export default function VerifyEmail() {
  const t = useTranslations("auth");
  const { status: authStatus, user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>(() =>
    token
      ? { status: "verifying" }
      : { status: "error", message: t("verifyEmail.missingToken") },
  );

  const onVerified = useEffectEvent(() => {
    setState({ status: "success" });
    // Pull the updated user (emailVerifiedAt) into the current session.
    if (authStatus !== "unauthenticated") void refreshSession();
  });

  const onFailed = useEffectEvent((error: unknown) =>
    setState({ status: "error", message: getAuthErrorMessage(error, t) }),
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    verifyOnce(token)
      .then(() => {
        if (!cancelled) onVerified();
      })
      .catch((error: unknown) => {
        if (!cancelled) onFailed(error);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isSignedIn = authStatus === "authenticated";

  return (
    <AuthShell
      back={
        isSignedIn
          ? { to: "/", label: t("backToDashboard") }
          : { to: "/signin", label: t("backToSignIn") }
      }
    >
      <AuthHeader title={t("verifyEmail.title")} />

      {state.status === "verifying" && (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Spinner className="size-5 text-brand-500" />
          {t("verifyEmail.verifying")}
        </div>
      )}

      {state.status === "success" && (
        <FormAlert variant="success" title={t("verifyEmail.successTitle")}>
          <p>{t("verifyEmail.successDescription")}</p>
          <Link to={isSignedIn ? "/" : "/signin"} className={linkClass}>
            {isSignedIn ? t("verifyEmail.continue") : t("goToSignIn")}
          </Link>
        </FormAlert>
      )}

      {state.status === "error" && (
        <div className="space-y-6">
          <FormAlert title={t("verifyEmail.errorTitle")}>
            {state.message}
          </FormAlert>
          <ResendVerificationForm defaultEmail={user?.email ?? ""} />
        </div>
      )}
    </AuthShell>
  );
}
