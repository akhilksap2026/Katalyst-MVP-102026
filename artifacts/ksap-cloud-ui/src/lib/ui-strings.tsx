import * as React from "react"

export const DEFAULT_UI_STRINGS = { close: "Close", breadcrumb: "Breadcrumb", more: "More", commandTitle: "Command palette", commandDescription: "Search for a command or record, then press Enter." } as const
export type UIStringKey = keyof typeof DEFAULT_UI_STRINGS
export type UITranslate = (key: UIStringKey) => string

const defaultTranslate: UITranslate = (key) => DEFAULT_UI_STRINGS[key]
const UIStringsContext = React.createContext<UITranslate>(defaultTranslate)

export function UIStringsProvider({ translate, children }: { translate: UITranslate; children: React.ReactNode }) {
  return <UIStringsContext.Provider value={translate}>{children}</UIStringsContext.Provider>
}

export function useUIString(key: UIStringKey): string {
  return React.useContext(UIStringsContext)(key)
}
