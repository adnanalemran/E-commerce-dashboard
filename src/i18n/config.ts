import i18n from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";

import en from "../messages/en.json";
import { routing } from "./routing";

document.documentElement.lang = routing.defaultLocale;
document.documentElement.dir = "ltr";

i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    lng: routing.defaultLocale,
    fallbackLng: routing.defaultLocale,
    supportedLngs: [...routing.locales],
    resources: {
      en: {
        translation: en,
      },
    },
    ns: ["translation"],
    defaultNS: "translation",
    keySeparator: ".",
    nsSeparator: false, // keys/values may contain ":"
    returnNull: false,
    returnObjects: false,
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  });

export default i18n;
