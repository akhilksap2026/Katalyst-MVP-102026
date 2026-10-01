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
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { listTables } from "@/lib/dictionary";
import { PLANNED_FEATURES } from "@/data/planned";
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
  const { paletteOpen, setPaletteOpen, release, recents, pushRecent, setTrayOpen, cycleTheme, setShortcutsOpen } =
    useApp();
  const navigate = useNavigate();

  const items = useMemo<PaletteItem[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
    };
    const list: PaletteItem[] = [
      { id: "nav-home", group: "tools", label: "Home", icon: Home, keywords: "home start", run: go("/") },
      { id: "nav-list", group: "tools", label: "List Utility", icon: ListChecks, keywords: "list utility gid in sql values", run: go("/list") },
      { id: "nav-dictionary", group: "tools", label: "Data Dictionary", icon: BookOpen, keywords: "data dictionary tables columns release", run: go("/dictionary") },
      { id: "nav-agents", group: "tools", label: "Agent Compare", icon: GitCompareArrows, keywords: "agent compare dev prod diff automation", run: go("/agents") },
      ...listTables(release).map((table) => ({
        id: `table-${table}`,
        group: "tables" as const,
        label: table,
        hint: `Dictionary · ${release}`,
        icon: Table2,
        keywords: `${table} table ${release}`.toLowerCase(),
        run: go(`/dictionary/${release}/${table}`),
      })),
      { id: "act-tray", group: "actions", label: "Open list tray", icon: ListChecks, keywords: "tray list clipboard", run: () => setTrayOpen(true) },
      { id: "act-compare", group: "actions", label: "Compare agents", icon: GitCompareArrows, keywords: "compare agents diff", run: go("/agents") },
      { id: "act-theme", group: "actions", label: "Switch theme", icon: Monitor, keywords: "theme light dark system", run: cycleTheme },
      { id: "act-shortcuts", group: "actions", label: "Show keyboard shortcuts", icon: Keyboard, keywords: "keyboard shortcuts help keys", run: () => setShortcutsOpen(true) },
      ...PLANNED_FEATURES.map((f) => ({
        id: `planned-${f.slug}`,
        group: "planned" as const,
        label: f.title,
        hint: "Planned",
        icon: Bot,
        keywords: `${f.title} planned`.toLowerCase(),
        run: go(`/planned/${f.slug}`),
      })),
    ];
    return list;
  }, [navigate, release, setTrayOpen, cycleTheme, setShortcutsOpen]);

  const recentItems = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return recents.map((id) => byId.get(id)).filter((i): i is PaletteItem => Boolean(i));
  }, [items, recents]);

  const runItem = (item: PaletteItem) => {
    pushRecent(item.id);
    setPaletteOpen(false);
    item.run();
  };

  const ThemeIcon = Monitor;

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen} title="Search and commands" description="Search tools, tables and actions">
      <CommandInput placeholder="Search tools, tables, actions…" />
      <CommandList>
        <CommandEmpty>No results. Try a table name, a tool, or an action.</CommandEmpty>

        {recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => (
              <CommandItem
                key={`recent-${item.id}`}
                value={`recent ${item.id} ${item.label} ${item.keywords}`}
                onSelect={() => runItem(item)}
                keywords={item.keywords.split(" ")}
              >
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>{item.label}</span>
                {item.hint && <span className="ms-auto text-caption text-muted-foreground">{item.hint}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Tools">
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

        <CommandGroup heading={`Tables · ${release}`}>
          {items.filter((i) => i.group === "tables").map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.id} ${item.label} ${item.keywords}`}
              onSelect={() => runItem(item)}
              keywords={item.keywords.split(" ")}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-mono text-[13px]">{item.label}</span>
              {item.hint && <span className="ms-auto text-caption text-muted-foreground">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
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
                  <ThemeIcon className="size-3.5" aria-hidden="true" /> cycles light, dark, system
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Planned">
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
                <span className="ms-auto rounded-sm border border-border px-1.5 py-0.5 text-caption text-muted-foreground">
                  {item.hint}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-3 border-t px-3 py-2 text-caption text-muted-foreground" aria-hidden="true">
        <Search className="size-3.5" />
        <span className="flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span className="flex items-center gap-1"><kbd>↵</kbd> open</span>
        <span className="flex items-center gap-1 ms-auto"><kbd>esc</kbd> close</span>
      </div>
    </CommandDialog>
  );
}
