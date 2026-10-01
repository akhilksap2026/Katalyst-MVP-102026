import { useSyncExternalStore } from "react";

export type DisplayPreferences = {
  theme: "system" | "light" | "dark";
  palette: "blue" | "red" | "green" | "yellow";
  density: "compact" | "standard" | "relaxed";
};
const defaults: DisplayPreferences = { theme: "system", palette: "blue", density: "standard" };
let preferences = defaults;
const subscribers = new Set<() => void>();
const query = "(prefers-color-scheme: dark)";
let media: MediaQueryList | null = null;
function apply() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.palette = preferences.palette;
  root.dataset.density = preferences.density;
  if (preferences.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = preferences.theme;
  const osDark = typeof matchMedia === "function" && matchMedia(query).matches;
  root.classList.toggle("dark", preferences.theme === "dark" || (preferences.theme === "system" && osDark));
}
function onOsChange() {
  // Explicit light or dark ignores OS changes.
  if (preferences.theme !== "system") return;
  apply();
  subscribers.forEach((callback) => callback());
}
function ensureOsListener() {
  if (media || typeof matchMedia !== "function") return;
  media = matchMedia(query);
  if (media.addEventListener) media.addEventListener("change", onOsChange);
  else (media as MediaQueryList).addListener?.(onOsChange);
}
export function setDisplay(patch: Partial<DisplayPreferences>) {
  preferences = { ...preferences, ...patch };
  ensureOsListener();
  apply();
  subscribers.forEach((callback) => callback());
}
export function useDisplay() {
  return useSyncExternalStore(
    (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    () => preferences,
    () => defaults,
  );
}