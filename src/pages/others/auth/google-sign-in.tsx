import { useAuth } from "@/contexts";
import { useLocale, useTranslations } from "@/i18n";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, getAuthErrorMessage } from "./utils";

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  rememberMe?: boolean;
}

/** Official Google button; exchanges the Google ID token at `POST /auth/google`. */
export default function GoogleSignInButton({
  text = "signin_with",
  rememberMe = false,
}: GoogleSignInButtonProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCredential = useEffectEvent(
    async (response: GoogleCredentialResponse) => {
      setError(null);
      try {
        await loginWithGoogle(response.credential, rememberMe);
      } catch (err) {
        setError(getAuthErrorMessage(err, t));
      }
    },
  );

  const handleLoadError = useEffectEvent(() =>
    setError(t("google.unavailable")),
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const container = containerRef.current;
        const gsi = window.google?.accounts.id;
        if (cancelled || !container || !gsi) return;

        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => void handleCredential(response),
          ux_mode: "popup",
        });
        container.replaceChildren();
        gsi.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          locale,
          width: Math.min(container.offsetWidth || 400, 400),
        });
      })
      .catch(() => {
        if (!cancelled) handleLoadError();
      });

    return () => {
      cancelled = true;
    };
  }, [text, locale]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex min-h-11 w-full justify-center" />
      {error && (
        <p className="text-center text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
