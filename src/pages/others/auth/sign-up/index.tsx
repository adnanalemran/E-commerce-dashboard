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
        badge="Create Account"
      />

      {isGoogleAuthEnabled && (
        <div className="mb-4">
          <GoogleSignInButton text="signup_with" />
          <AuthDivider label={t("or")} />
        </div>
      )}

      <SignUpFormFields />

      <div className="mt-6 border-t border-gray-100 pt-4 text-center dark:border-gray-800/80">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("signUp.haveAccount")}{" "}
          <Link
            to="/signin"
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
          >
            {t("signUp.signInLink")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
