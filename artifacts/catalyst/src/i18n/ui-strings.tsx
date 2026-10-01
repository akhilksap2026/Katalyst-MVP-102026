import { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { UIStringsProvider, type UITranslate } from "@workspace/ksap-cloud-ui/lib/ui-strings";

/** Connects the design-system primitive strings to the shared i18next namespace. */
export function CatalystUIStrings({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const translate = useCallback<UITranslate>((key) => t(`shared.${key}`), [t]);
  return <UIStringsProvider translate={translate}>{children}</UIStringsProvider>;
}
