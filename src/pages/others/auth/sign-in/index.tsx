import { useTranslations } from "@/i18n";
import { Link } from "react-router";
import AuthHeader from "../auth-header";
import AuthShell from "../auth-shell";
import AuthDivider from "../divider";
import GoogleSignInButton from "../google-sign-in";
import { isGoogleAuthEnabled } from "../utils";
import SignInFormFields from "./form";

export default function SignIn() {
  const t = useTranslations("auth");

  return (
    <AuthShell>
      <AuthHeader
        title={t("signIn.title")}
        description={t("signIn.description")}
      />

      {isGoogleAuthEnabled && (
        <>
          <GoogleSignInButton text="signin_with" />
          <AuthDivider label={t("or")} />
        </>
      )}

      <SignInFormFields />

      <div className="mt-5">
        <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
          {t("signIn.noAccount")}{" "}
          <Link
            to="/signup"
            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            {t("signIn.signUpLink")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
