/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#FFFFFF",
      "foreground": "#010D43",
      "card": "#FFFFFF",
      "cardForeground": "#010D43",
      "popover": "#FFFFFF",
      "popoverForeground": "#010D43",
      "primary": "#1258B5",
      "primaryForeground": "#FFFFFF",
      "secondary": "#EBF2FF",
      "secondaryForeground": "#010D43",
      "muted": "#EBF2FF",
      "mutedForeground": "#43576C",
      "accent": "#EFF6FF",
      "accentForeground": "#06459A",
      "destructive": "#B3261E",
      "destructiveForeground": "#FFFFFF",
      "border": "#E7EBF3",
      "input": "#8693A5",
      "ring": "#1258B5",
      "chart1": "#1258B5",
      "chart2": "#BFDBFE",
      "chart3": "#93C5FD",
      "chart4": "#4C9AE8",
      "chart5": "#DBEAFE",
      "sidebar": "#1258B5",
      "sidebarForeground": "#FFFFFF",
      "sidebarBorder": "#06459A",
      "sidebarPrimary": "#FFFFFF",
      "sidebarPrimaryForeground": "#1258B5",
      "sidebarAccent": "#06459A",
      "sidebarAccentForeground": "#FFFFFF",
      "sidebarRing": "#FFFFFF"
    },
    "dark": {
      "background": "#0A172B",
      "foreground": "#E7E8EA",
      "card": "#1A3254",
      "cardForeground": "#E8EBEE",
      "popover": "#1A3254",
      "popoverForeground": "#E8EBEE",
      "primary": "#4C9AE8",
      "primaryForeground": "#0A172B",
      "secondary": "#0F2038",
      "secondaryForeground": "#E7E8EA",
      "muted": "#0F2038",
      "mutedForeground": "#A7ABB3",
      "accent": "#132941",
      "accentForeground": "#93C5FD",
      "destructive": "#F1706A",
      "destructiveForeground": "#0A172B",
      "border": "#233044",
      "input": "#5D6673",
      "ring": "#6DAEEC",
      "chart1": "#6DAEEC",
      "chart2": "#10284A",
      "chart3": "#152A49",
      "chart4": "#082F67",
      "chart5": "#1A3254",
      "sidebar": "#082F67",
      "sidebarForeground": "#E7E8EA",
      "sidebarBorder": "#233044",
      "sidebarPrimary": "#93C5FD",
      "sidebarPrimaryForeground": "#082F67",
      "sidebarAccent": "#152A49",
      "sidebarAccentForeground": "#FFFFFF",
      "sidebarRing": "#93C5FD"
    }
  },
  "fontFamily": {
    "sans": [
      "Montserrat",
      "Noto Sans Arabic",
      "Segoe UI",
      "system-ui",
      "sans-serif"
    ],
    "serif": [
      "Montserrat",
      "sans-serif"
    ],
    "mono": [
      "IBM Plex Mono",
      "monospace"
    ]
  },
  "radius": "0.75rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
