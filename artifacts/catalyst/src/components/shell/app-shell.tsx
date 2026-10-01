import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@/lib/router";
import { PageTransition } from "@/components/shell/page-transition";
import { Toaster } from "@/components/ui/sonner";
import { Announcer } from "@/components/shell/announcer";
import { Sidebar, MobileNavSheet } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { CommandPalette } from "@/components/shell/command-palette";
import { ShortcutsDialog } from "@/components/shell/shortcuts-dialog";
import { Assistant } from "@/components/shell/assistant";
import { ListTray } from "@/components/shell/list-tray";
import { useApp } from "@/state/app";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

const KEY_NAV: Record<string, string> = {
  l: "/list",
  d: "/dictionary",
  a: "/agents",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { setPaletteOpen, setShortcutsOpen, setTrayOpen } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      // Ctrl/Cmd+Shift+L opens the List Utility tray from anywhere.
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setTrayOpen(true);
        return;
      }
      if (isEditableTarget(e.target)) return;
      // Single-key shortcuts pause while any dialog or sheet is open.
      if (document.querySelector('[role="dialog"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dest = KEY_NAV[e.key.toLowerCase()];
      if (dest) {
        e.preventDefault();
        navigate(dest);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    const onShortcutsEvent = () => setShortcutsOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("catalyst:shortcuts", onShortcutsEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("catalyst:shortcuts", onShortcutsEvent);
    };
  }, [navigate, setPaletteOpen, setShortcutsOpen, setTrayOpen]);

  return (
    <div className="flex min-h-dvh">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
          <CommandPalette />
          <ShortcutsDialog />
          <ListTray />
          <Assistant />
          <MobileNavSheet />
          <Toaster position="bottom-right" richColors closeButton />
          <Announcer />
    </div>
  );
}
