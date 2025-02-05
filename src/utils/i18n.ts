import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "../locales/en/landing.json";
import arTranslations from "../locales/ar/landing.json";
import frTranslations from "../locales/fr/landing.json";

// Get browser language and extract the base language code
const getBrowserLanguage = () => {
  const fullLang = navigator.language;
  const baseLang = fullLang.split("-")[0]; // This will turn 'en-US' into 'en'
  return ["en", "ar", "fr"].includes(baseLang) ? baseLang : "en";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        landing: enTranslations,
      },
      ar: {
        landing: arTranslations,
      },
      fr: {
        landing: frTranslations,
      },
    },
    fallbackLng: "en",
    ns: ["landing"],
    defaultNS: "landing",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["navigator"],
      lookupNavigator: true,
      caches: [],
    },
    lng: getBrowserLanguage(), // Set initial language
  });

// Set initial RTL
document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";

export default i18n;
