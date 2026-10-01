import { useSyncExternalStore } from "react";

export type DisplayPreferences = {
  theme: "system" | "light" | "dark";
  palette: "blue" | "red" | "green" | "yellow";
  density: "compact" | "standard" | "relaxed";
};
const defaults: DisplayPreferences = { theme: "system", palette: "blue", density: "standard" };
let preferences = defaults;
const subscribers = new Set<() => void>();
export function setDisplay(patch: Partial<DisplayPreferences>) {
  preferences = { ...preferences, ...patch };
  const root = document.documentElement;
  root.dataset.palette = preferences.palette;
  root.dataset.density = preferences.density;
  if (preferences.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = preferences.theme;
  root.classList.toggle("dark", preferences.theme === "dark" || (preferences.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  subscribers.forEach((callback) => callback());
}
export function useDisplay() {
  return useSyncExternalStore(
    (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); },
    () => preferences,
    () => defaults,
  );
}