import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ksap-cloud-ui/components/ui/dialog";
import { Kbd } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { useApp } from "@/state/app";

const SHORTCUTS: { keys: string[]; description: string; group?: string }[] = [
  { keys: ["Ctrl", "K"], description: "shortcuts.openSearchAndCommands", group: "shortcuts.group.everywhere" },
  { keys: ["?"], description: "shortcuts.showThisShortcutList", group: "shortcuts.group.everywhere" },
  { keys: ["Esc"], description: "shortcuts.closeTheTopDialog", group: "shortcuts.group.everywhere" },
  { keys: ["L"], description: "shortcuts.goToListUtility", group: "shortcuts.group.everywhere" },
  { keys: ["D"], description: "shortcuts.goToDataDictionary", group: "shortcuts.group.everywhere" },
  { keys: ["A"], description: "shortcuts.goToAgentCompare", group: "shortcuts.group.everywhere" },
  { keys: ["Ctrl", "Shift", "L"], description: "shortcuts.openTheListUtility", group: "shortcuts.group.everywhere" },
  { keys: ["Ctrl", "↵"], description: "shortcuts.copyListUtilityOutput", group: "shortcuts.group.listUtility" },
  { keys: ["↑", "↓"], description: "shortcuts.moveThroughDictionarySearch", group: "shortcuts.group.dataDictionary" },
  { keys: ["↵"], description: "shortcuts.openTheHighlightedDictionary", group: "shortcuts.group.dataDictionary" },
  { keys: ["J"], description: "shortcuts.nextChangeInThe", group: "shortcuts.group.agentCompare" },
  { keys: ["K"], description: "shortcuts.previousChangeInThe", group: "shortcuts.group.agentCompare" },
  { keys: ["Tab"], description: "shortcuts.moveThroughThePage", group: "shortcuts.group.keyboardBasics" },
  { keys: ["Shift", "Tab"], description: "shortcuts.moveBackwards", group: "shortcuts.group.keyboardBasics" },
  { keys: ["↵"], description: "shortcuts.activateTheFocusedButton", group: "shortcuts.group.keyboardBasics" },
  { keys: ["Space"], description: "shortcuts.toggleTheFocusedCheckbox", group: "shortcuts.group.keyboardBasics" },
];

function isMac(): boolean {
  return typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
}

export function ShortcutsDialog() {
  const { t } = useTranslation();
  const { shortcutsOpen, setShortcutsOpen } = useApp();
  const mod = isMac() ? "⌘" : "Ctrl";

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shortcutsDialog.keyboardShortcuts")}</DialogTitle>
          <DialogDescription>
            {t("shortcutsDialog.singleKeyShortcutsNever")}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y rounded-lg border" role="list">
          {SHORTCUTS.map((s, i) => (
            <li key={`${s.group}-${i}`}>
              {s.group && (i === 0 || SHORTCUTS[i - 1].group !== s.group) && (
                <p className="border-b bg-muted px-4 py-2 text-caption font-semibold text-muted-foreground">
                  {t(s.group)}
                </p>
              )}
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-body">{t(s.description)}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, j) => (
                    <Kbd key={j}>{k === "Ctrl" ? mod : k}</Kbd>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
