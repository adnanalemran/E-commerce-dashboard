import { useTranslations } from "@/i18n";
import { Link } from "react-router";
import AuthHeader from "../auth-header";
import AuthShell from "../auth-shell";
import AuthDivider from "../divider";
import GoogleSignInButton from "../google-sign-in";
import { isGoogleAuthEnabled } from "../utils";
import SignUpFormFields from "./form";

export default function SignUp() {
  const t = useTranslations("auth");

  return (
    <AuthShell>
      <AuthHeader
        title={t("signUp.title")}
        description={t("signUp.description")}
      />

      {isGoogleAuthEnabled && (
        <>
          <GoogleSignInButton text="signup_with" />
          <AuthDivider label={t("or")} />
        </>
      )}

      <SignUpFormFields />

      <div className="mt-5">
        <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
          {t("signUp.haveAccount")}{" "}
          <Link
            to="/signin"
            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            {t("signUp.signInLink")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
