import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import i18n from "@/i18n";
import { setDisplay } from "@workspace/ksap-cloud-ui/hooks/use-display";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type Theme = "light" | "dark" | "system";
export type Palette = "blue" | "red" | "green" | "yellow";
export type Density = "compact" | "standard" | "relaxed";
export type EffectiveTheme = "light" | "dark";

export interface DemoUser {
  name: string;
  email: string;
  initials: string;
}

const DEMO_USER: DemoUser = { name: i18n.t("app.demoUser"), email: "demo@ksap.example", initials: "DC" };

interface AppState {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  palette: Palette;
  setPalette: (p: Palette) => void;
  density: Density;
  setDensity: (d: Density) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  release: string;
  setRelease: (r: string) => void;
  signedIn: boolean;
  signIn: () => DemoUser;
  signOut: () => void;
  user: DemoUser | null;
  paletteOpen: boolean;
  setPaletteOpen: Dispatch<SetStateAction<boolean>>;
  shortcutsOpen: boolean;
  setShortcutsOpen: Dispatch<SetStateAction<boolean>>;
  trayOpen: boolean;
  setTrayOpen: Dispatch<SetStateAction<boolean>>;
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  recents: string[];
  pushRecent: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function systemTheme(): EffectiveTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const THEME_ORDER: Theme[] = ["light", "dark", "system"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "system");
  const [palette, setPalette] = useLocalStorage<Palette>("palette", "blue");
  const [density, setDensity] = useLocalStorage<Density>("density", "standard");
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>("sidebar.collapsed", false);
  const [release, setRelease] = useLocalStorage<string>("release", "26A");
  const [signedIn, setSignedIn] = useLocalStorage<boolean>("auth.signed-in", false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [recents, setRecents] = useLocalStorage<string[]>("palette.recents", []);
  const [system, setSystem] = useState<EffectiveTheme>(() => systemTheme());

  const effectiveTheme: EffectiveTheme = theme === "system" ? system : theme;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // Package helper writes data-theme/palette/density to <html>; the Toaster reads the same store.
    setDisplay({ theme, palette, density });
  }, [theme, palette, density, system]);

  const cycleTheme = useCallback(() => {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]);
  }, [theme, setTheme]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [setSidebarCollapsed]);

  // Simulated sign-in: the prototype is connectionless, so this only flips
  // local state to demonstrate the signed-in header. No credentials, no server.
  const signIn = useCallback(() => {
    setSignedIn(true);
    return DEMO_USER;
  }, [setSignedIn]);
  const signOut = useCallback(() => setSignedIn(false), [setSignedIn]);

  const pushRecent = useCallback(
    (id: string) => {
      setRecents((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, 8));
    },
    [setRecents],
  );

  const value = useMemo<AppState>(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      cycleTheme,
      palette,
      setPalette,
      density,
      setDensity,
      sidebarCollapsed,
      toggleSidebar,
      release,
      setRelease,
      signedIn,
      signIn,
      signOut,
      user: signedIn ? DEMO_USER : null,
      paletteOpen,
      setPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      trayOpen,
      setTrayOpen,
      mobileNavOpen,
      setMobileNavOpen,
      recents,
      pushRecent,
    }),
    [
      theme, effectiveTheme, setTheme, cycleTheme, palette, setPalette, density, setDensity, sidebarCollapsed, toggleSidebar,
      release, setRelease, signedIn, signIn, signOut, paletteOpen, shortcutsOpen, trayOpen,
      mobileNavOpen, recents, pushRecent,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
