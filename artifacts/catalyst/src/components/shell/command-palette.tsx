import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useNavigate } from "@/lib/router";
import {
  BookOpen,
  Bot,
  Clock,
  GitCompareArrows,
  Home,
  Keyboard,
  ListChecks,
  Monitor,
  Search,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@workspace/ksap-cloud-ui/components/ui/command";
import { Kbd } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { listTables } from "@/lib/dictionary";
import { plannedFeatures } from "@/data/planned";
import { useApp } from "@/state/app";

type Group = "recent" | "tools" | "tables" | "actions" | "planned";

interface PaletteItem {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const { t } = useTranslation();
  const { paletteOpen, setPaletteOpen, release, recents, pushRecent, setTrayOpen, cycleTheme, setShortcutsOpen } =
    useApp();
  const navigate = useNavigate();

  const items = useMemo<PaletteItem[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
    };
    const list: PaletteItem[] = [
      { id: "nav-home", group: "tools", label: t("palette.home"), icon: Home, keywords: "home start", run: go("/") },
      { id: "nav-list", group: "tools", label: t("palette.list"), icon: ListChecks, keywords: "list utility gid in sql values", run: go("/list") },
      { id: "nav-dictionary", group: "tools", label: t("palette.dictionary"), icon: BookOpen, keywords: "data dictionary tables columns release", run: go("/dictionary") },
      { id: "nav-agents", group: "tools", label: t("palette.agents"), icon: GitCompareArrows, keywords: "agent compare dev prod diff automation", run: go("/agents") },
      ...listTables(release).map((table) => ({
        id: `table-${table}`,
        group: "tables" as const,
        label: table,
        hint: t("palette.dictionaryHint", { release }),
        icon: Table2,
        keywords: `${table} table ${release}`.toLowerCase(),
        run: go(`/dictionary/${release}/${table}`),
      })),
      { id: "act-tray", group: "actions", label: t("palette.tray"), icon: ListChecks, keywords: "tray list clipboard", run: () => setTrayOpen(true) },
      { id: "act-compare", group: "actions", label: t("palette.compare"), icon: GitCompareArrows, keywords: "compare agents diff", run: go("/agents") },
      { id: "act-theme", group: "actions", label: t("palette.theme"), icon: Monitor, keywords: "theme light dark system", run: cycleTheme },
      { id: "act-shortcuts", group: "actions", label: t("palette.shortcuts"), icon: Keyboard, keywords: "keyboard shortcuts help keys", run: () => setShortcutsOpen(true) },
      ...plannedFeatures(t).map((f) => ({
        id: `planned-${f.slug}`,
        group: "planned" as const,
        label: f.title,
        hint: t("palette.planned"),
        icon: Bot,
        keywords: `${f.title} planned`.toLowerCase(),
        run: go(`/planned/${f.slug}`),
      })),
    ];
    return list;
  }, [navigate, release, setTrayOpen, cycleTheme, setShortcutsOpen, t]);

  const recentItems = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return recents.map((id) => byId.get(id)).filter((i): i is PaletteItem => Boolean(i));
  }, [items, recents]);

  const runItem = (item: PaletteItem) => {
    pushRecent(item.id);
    setPaletteOpen(false);
    item.run();
  };


  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title={t("commandPalette.searchAndCommands")}
      description={t("commandPalette.description")}
    >
      <CommandInput placeholder={t("commandPalette.searchToolsTablesActions")} />
      <CommandList>
        <CommandEmpty>{t("commandPalette.noResultsTryA")}</CommandEmpty>

        {recentItems.length > 0 && (
          <CommandGroup heading={t("palette.recent")}>
            {recentItems.map((item) => (
              <CommandItem
                key={`recent-${item.id}`}
                value={`recent ${item.id} ${item.label} ${item.keywords}`}
                onSelect={() => runItem(item)}
                keywords={item.keywords.split(" ")}
              >
                <Clock className="size-icon-sm text-muted-foreground" aria-hidden="true" />
                <span>{item.label}</span>
                {item.hint && <span className="ms-auto text-caption text-muted-foreground">{item.hint}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={t("palette.tools")}>
          {items.filter((i) => i.group === "tools").map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords}`}
              onSelect={() => runItem(item)}
              keywords={item.keywords.split(" ")}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>{item.label}</span>
              {item.hint && <span className="ms-auto text-caption text-muted-foreground">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t("palette.tablesHeading", { release })}>
          {items.filter((i) => i.group === "tables").map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords}`}
              onSelect={() => runItem(item)}
              keywords={item.keywords.split(" ")}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-mono text-body">{item.label}</span>
              {item.hint && <span className="ms-auto text-caption text-muted-foreground">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("palette.actions")}>
          {items.filter((i) => i.group === "actions").map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords}`}
              onSelect={() => runItem(item)}
              keywords={item.keywords.split(" ")}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>{item.label}</span>
              {item.id === "act-theme" && (
                <CommandShortcut>
                  <Monitor className="size-icon-sm" aria-hidden="true" />{" "}{t("commandPalette.cyclesLightDarkSystem")}
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t("palette.planned")}>
          {items.filter((i) => i.group === "planned").map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords}`}
              onSelect={() => runItem(item)}
              keywords={item.keywords.split(" ")}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">{item.label}</span>
              {item.hint && (
                <span className="ms-auto rounded-sm border border-border px-2 py-1 text-caption text-muted-foreground">
                  {item.hint}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-3 border-t px-3 py-2 text-caption text-muted-foreground" aria-hidden="true">
        <Search className="size-icon-sm" />
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd>{" "}{t("commandPalette.navigate")}</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd>{" "}{t("commandPalette.open")}</span>
        <span className="flex items-center gap-1 ms-auto"><Kbd>{t("commandPalette.esc")}</Kbd>{" "}{t("commandPalette.close")}</span>
      </div>
    </CommandDialog>
  );
}
