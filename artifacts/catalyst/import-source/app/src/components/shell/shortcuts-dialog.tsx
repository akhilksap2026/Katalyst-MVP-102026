import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/state/app";

const SHORTCUTS: { keys: string[]; description: string; group?: string }[] = [
  { keys: ["Ctrl", "K"], description: "Open search and commands", group: "Everywhere" },
  { keys: ["?"], description: "Show this shortcut list", group: "Everywhere" },
  { keys: ["Esc"], description: "Close the top dialog, tray or menu", group: "Everywhere" },
  { keys: ["L"], description: "Go to List Utility", group: "Everywhere" },
  { keys: ["D"], description: "Go to Data Dictionary", group: "Everywhere" },
  { keys: ["A"], description: "Go to Agent Compare", group: "Everywhere" },
  { keys: ["Ctrl", "Shift", "L"], description: "Open the List Utility tray", group: "Everywhere" },
  { keys: ["Ctrl", "↵"], description: "Copy List Utility output", group: "List Utility" },
  { keys: ["↑", "↓"], description: "Move through dictionary search results", group: "Data Dictionary" },
  { keys: ["↵"], description: "Open the highlighted dictionary result", group: "Data Dictionary" },
  { keys: ["J"], description: "Next change in the comparison detail", group: "Agent Compare" },
  { keys: ["K"], description: "Previous change in the comparison detail", group: "Agent Compare" },
  { keys: ["Tab"], description: "Move through the page in logical order", group: "Keyboard basics" },
  { keys: ["Shift", "Tab"], description: "Move backwards", group: "Keyboard basics" },
  { keys: ["↵"], description: "Activate the focused button or link", group: "Keyboard basics" },
  { keys: ["Space"], description: "Toggle the focused checkbox or switch", group: "Keyboard basics" },
];

function isMac(): boolean {
  return typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
}

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useApp();
  const mod = isMac() ? "⌘" : "Ctrl";

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Single-key shortcuts never fire while you are typing in a field.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y rounded-lg border" role="list">
          {SHORTCUTS.map((s, i) => (
            <li key={s.description}>
              {s.group && (i === 0 || SHORTCUTS[i - 1].group !== s.group) && (
                <p className="border-b bg-muted/50 px-4 py-1.5 text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                  {s.group}
                </p>
              )}
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="text-sm">{s.description}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, j) => (
                    <kbd key={j}>{k === "Ctrl" ? mod : k}</kbd>
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
