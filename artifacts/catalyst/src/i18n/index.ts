import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_UI_STRINGS } from "@workspace/ksap-cloud-ui/lib/ui-strings";
import { en } from "@/i18n/en";

export const NAMESPACE = "catalyst";

/** Only English resources ship; the browser locale still drives every Intl formatter. */
void i18n.use(initReactI18next).init({
  resources: { en: { [NAMESPACE]: { ...en, shared: DEFAULT_UI_STRINGS } } },
  lng: "en",
  fallbackLng: "en",
  defaultNS: NAMESPACE,
  ns: [NAMESPACE],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

/** BCP 47 locale for Intl formatting: the user's browser locale. */
export function userLocale(): string {
  if (typeof navigator === "undefined") return "en";
  return navigator.languages?.[0] ?? navigator.language ?? "en";
}

export default i18n;
