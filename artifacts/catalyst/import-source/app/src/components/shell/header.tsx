import { useState } from "react";
import {
  Check,
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
import { Link } from "react-router";
import { toast } from "sonner";
import { AboutDialog } from "@/components/shell/about-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dictionaryManifest } from "@/lib/dictionary";
import { useApp, type Theme } from "@/state/app";

function isMac(): boolean {
  return typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
}

const THEME_META: Record<Theme, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
};

export function Header() {
  const {
    theme,
    setTheme,
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

  const ThemeIcon = effectiveTheme === "dark" ? Moon : Sun;

  return (
    <header style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 max-xl:px-3">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="size-4" aria-hidden="true" />
      </Button>

      <Link to="/" className="mr-1 hidden rounded-md lg:block" aria-label="Catalyst home">
        <Logo />
      </Link>

      {/* Search / command palette trigger */}
      <Button
        variant="outline"
        onClick={() => setPaletteOpen(true)}
        aria-label="Open search and commands"
        className="h-9 w-64 justify-start gap-2 text-muted-foreground max-xl:w-48 max-md:w-auto max-md:px-2.5"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate max-md:sr-only">Search or jump to…</span>
        <span className="ms-auto flex items-center gap-0.5 max-md:sr-only">
          <kbd>{mod}</kbd>
          <kbd>K</kbd>
        </span>
      </Button>

      <div className="ms-auto flex items-center gap-1.5">
        {/* OTM release selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={`OTM release ${release}, change release`}>
              <span className="text-muted-foreground">OTM</span>
              <span className="font-mono text-[13px] font-medium">{release}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Dictionary release</DropdownMenuLabel>
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
          className="hidden rounded-full border border-border bg-muted px-2.5 py-1 text-caption font-medium text-muted-foreground xl:inline-flex"
          aria-label={`Selected release ${release}`}
        >
          <span className="font-mono">{release}</span>
        </span>

        {/* Processed in your browser */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 text-caption font-medium text-muted-foreground"
              role="note"
            >
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <span className="max-xl:sr-only">Processed in your browser</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64">
            Everything you paste or upload is processed on this device. Nothing is sent over the
            network.
          </TooltipContent>
        </Tooltip>

        {/* List Utility tray */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTrayOpen(true)}
              aria-label="Open List Utility tray"
              className="size-9"
            >
              <ListChecks className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">List tray</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Theme: ${THEME_META[theme].label}. Change theme`}
              className="size-9"
            >
              <ThemeIcon className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(THEME_META) as Theme[]).map((t) => {
              const Meta = THEME_META[t];
              return (
                <DropdownMenuItem key={t} onSelect={() => setTheme(t)}>
                  <Meta.icon className="size-4" aria-hidden="true" />
                  <span>{Meta.label}</span>
                  {theme === t && <Check className="ms-auto size-4" aria-hidden="true" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth */}
        {signedIn && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-1.5"
                aria-label={`Account menu for ${user.name}`}
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-accent text-caption font-semibold text-accent-foreground">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-md:sr-only">{user.name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
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
                <UserRound className="size-4" aria-hidden="true" />
                Profile (not in prototype)
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ThemeIcon className="size-4" aria-hidden="true" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                      {(Object.keys(THEME_META) as Theme[]).map((t) => (
                        <DropdownMenuRadioItem key={t} value={t}>
                          {THEME_META[t].label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  signOut();
                  toast.info("Signed out of the demo session.");
                }}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            aria-label="Sign in"
            onClick={() => {
              signIn();
              toast.info("Signed in to a simulated demo session — Catalyst has no server in this prototype.");
            }}
          >
            <LogIn className="size-4" aria-hidden="true" />
            <span className="max-md:hidden">Sign in</span>
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground"
              onClick={() => setAboutOpen(true)}
              aria-label="About Catalyst"
              data-testid="about-button"
            >
              <Info className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">About</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground"
              onClick={() => window.dispatchEvent(new CustomEvent("catalyst:shortcuts"))}
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Keyboard shortcuts <kbd>?</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  );
}
