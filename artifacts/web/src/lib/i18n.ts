import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@workspace/i18n/locales/en.json";
import es from "@workspace/i18n/locales/es.json";
import fr from "@workspace/i18n/locales/fr.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: localStorage.getItem("globalhr-locale") ?? "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
