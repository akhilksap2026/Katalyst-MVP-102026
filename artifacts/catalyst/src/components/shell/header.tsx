import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  ChevronDown,
  Info,
  Keyboard,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { Link } from "@/lib/router";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { AboutDialog } from "@/components/shell/about-dialog";
import { Avatar, AvatarFallback } from "@workspace/ksap-cloud-ui/components/ui/avatar";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Kbd } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { Wordmark } from "@/components/shell/wordmark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ksap-cloud-ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ksap-cloud-ui/components/ui/tooltip";
import { dictionaryManifest } from "@/lib/dictionary";
import { useApp, type Density, type Palette, type Theme } from "@/state/app";

function isMac(): boolean {
  return typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
}

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const THEMES: Theme[] = ["system", "light", "dark"];
const PALETTES: Palette[] = ["blue", "red", "green", "yellow"];
const DENSITIES: Density[] = ["compact", "standard", "relaxed"];

export function Header() {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    palette,
    setPalette,
    density,
    setDensity,
    effectiveTheme,
    release,
    setRelease,
    signedIn,
    signIn,
    signOut,
    user,
    setPaletteOpen,
    setTrayOpen,
    setMobileNavOpen,
  } = useApp();
  const mod = isMac() ? "⌘" : "Ctrl";
  const [aboutOpen, setAboutOpen] = useState(false);

  const ThemeIcon = theme === "system" ? (effectiveTheme === "dark" ? Moon : Sun) : THEME_ICON[theme];

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-border bg-background px-4 pt-safe max-xl:px-3">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t("header.openNavigationMenu")}
      >
        <Menu className="size-icon-sm" aria-hidden="true" />
      </Button>

      <Link to="/" className="me-1 hidden rounded-md lg:block" aria-label={t("header.catalystHome")}>
        <Wordmark />
      </Link>

      {/* Search / command palette trigger */}
      <Button
        variant="outline"
        onClick={() => setPaletteOpen(true)}
        aria-label={t("header.openSearchAndCommands")}
        className="w-64 justify-start gap-2 text-muted-foreground max-xl:w-48 max-md:w-auto"
      >
        <Search className="size-icon-sm shrink-0" aria-hidden="true" />
        <span className="truncate max-md:sr-only">{t("header.searchOrJumpTo")}</span>
        <span className="ms-auto flex items-center gap-1 max-md:sr-only">
          <Kbd>{mod}</Kbd>
          <Kbd>{t("header.k")}</Kbd>
        </span>
      </Button>

      <div className="ms-auto flex items-center gap-2">
        {/* OTM release selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={t("header.releaseChange", { release })}>
              <span className="text-muted-foreground">{t("header.otm")}</span>
              <span className="font-mono text-body font-semibold">{release}</span>
              <ChevronDown className="size-icon-sm text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>{t("header.dictionaryRelease")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={release} onValueChange={setRelease}>
              {dictionaryManifest.releases.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id}>
                  <span className="font-mono">{r.id}</span>
                  <span className="ms-1 text-muted-foreground">{r.status}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span
          className="hidden rounded-full border border-border bg-muted px-3 py-1 text-caption font-semibold text-muted-foreground xl:inline-flex"
          aria-label={t("header.selectedRelease", { release })}
        >
          <span className="font-mono">{release}</span>
        </span>

        {/* Processed in your browser */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex h-control items-center gap-2 rounded-md border border-border bg-muted px-3 text-caption font-semibold text-muted-foreground"
              role="note"
            >
              <ShieldCheck className="size-icon-sm text-primary-ink" aria-hidden="true" />
              <span className="max-xl:sr-only">{t("header.processedInYourBrowser")}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64">
            {t("header.everythingYouPasteOr")}
          </TooltipContent>
        </Tooltip>

        {/* List Utility tray */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTrayOpen(true)}
              aria-label={t("header.openListUtilityTray")}
            >
              <ListChecks className="size-icon-sm" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("header.listTray")}</TooltipContent>
        </Tooltip>

        {/* Display settings: theme, palette, density */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("header.displaySettings")}
              data-testid="display-settings"
            >
              <ThemeIcon className="size-icon-md" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("header.theme")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              {THEMES.map((id) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  {t(`header.themes.${id}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("header.palette")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={palette} onValueChange={(v) => setPalette(v as Palette)}>
              {PALETTES.map((id) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  {t(`header.palettes.${id}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("header.density")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as Density)}>
              {DENSITIES.map((id) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  {t(`header.densities.${id}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth */}
        {signedIn && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2"
                aria-label={t("header.accountMenu", { name: user.name })}
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-accent text-caption font-semibold text-accent-foreground">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-md:sr-only">{user.name}</span>
                <ChevronDown className="size-icon-sm text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block">{user.name}</span>
                <span className="block truncate text-caption font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <UserRound className="size-icon-sm" aria-hidden="true" />
                {t("header.profileNotInPrototype")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  signOut();
                  toast.info(t("header.signedOutOfThe"));
                }}
              >
                <LogOut className="size-icon-sm" aria-hidden="true" />
                {t("header.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            aria-label={t("header.signInToDemo")}
            onClick={() => {
              signIn();
              toast.info(t("header.signedInToA"));
            }}
          >
            <LogIn className="size-icon-sm" aria-hidden="true" />
            <span className="max-md:hidden">{t("header.demoSignIn")}</span>
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => setAboutOpen(true)}
              aria-label={t("header.aboutCatalyst")}
              data-testid="about-button"
            >
              <Info className="size-icon-sm" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("header.about")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => window.dispatchEvent(new CustomEvent("catalyst:shortcuts"))}
              aria-label={t("header.showKeyboardShortcuts")}
            >
              <Keyboard className="size-icon-sm" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("header.keyboardShortcuts")}{" "}<Kbd>?</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  );
}
