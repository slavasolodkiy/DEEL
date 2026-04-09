import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };

export type SupportedLocale = "en" | "es" | "fr";

export const locales: Record<SupportedLocale, typeof en> = { en, es, fr };

export const supportedLocales: SupportedLocale[] = ["en", "es", "fr"];

export const defaultLocale: SupportedLocale = "en";

export function getTranslations(locale: SupportedLocale): typeof en {
  return locales[locale] ?? en;
}
