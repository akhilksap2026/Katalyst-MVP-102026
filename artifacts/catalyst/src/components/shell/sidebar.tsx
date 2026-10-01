import { NavLink } from "@/lib/router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  Home,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/logo";
import { PLANNED_FEATURES } from "@/data/planned";
import { useApp } from "@/state/app";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const HOME_ITEM: NavItem = { to: "/", label: "Home", icon: Home, end: true };

const TOOL_ITEMS: NavItem[] = [
  { to: "/list", label: "List Utility", icon: ListChecks },
  { to: "/dictionary", label: "Data Dictionary", icon: BookOpen },
  { to: "/agents", label: "Agent Compare", icon: GitCompareArrows },
];

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex h-9 min-w-9 items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_hsl(var(--sidebar-primary))]"
            : "text-sidebar-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function NavSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div className="px-3 pb-1">
      {!collapsed && (
        <p className="px-2.5 pb-1.5 text-caption font-medium text-muted-foreground">{label}</p>
      )}
      <ul className="flex flex-col gap-0.5" role="list">
        {items.map((item) => (
          <li key={item.to}>
            <SidebarLink item={item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The full navigation tree, shared by the desktop rail and the mobile sheet. */
export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <nav className="flex flex-col gap-4 py-4" aria-label="Main">
      <NavSection label="Home" items={[HOME_ITEM]} collapsed={collapsed} />
      <NavSection label="Tools" items={TOOL_ITEMS} collapsed={collapsed} />

      <div className="px-3 pb-1">
        {!collapsed && (
          <p className="px-2.5 pb-1.5 text-caption font-medium text-muted-foreground">Planned</p>
        )}
        <ul className="flex flex-col gap-0.5" role="list">
          {PLANNED_FEATURES.map((feature) => {
            const link = (
              <NavLink
                to={`/planned/${feature.slug}`}
                className="flex h-9 min-w-9 items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <span className="min-w-0 flex-1 truncate ps-1">{feature.title}</span>
                {!collapsed && (
                  <Badge variant="secondary" className="shrink-0 px-1.5 text-caption">
                    Planned
                  </Badge>
                )}
              </NavLink>
            );
            return (
              <li key={feature.slug}>
                {collapsed ? (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{feature.title} (Planned)</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useApp();

  return (
    <aside
      style={{ viewTransitionName: "site-sidebar" }}
      aria-label="Primary"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background lg:flex",
        "transition-[width] duration-200",
        collapsed ? "w-16" : "w-72",
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <NavLink to="/" className="rounded-md" aria-label="Catalyst home">
          <Logo collapsed={collapsed} />
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full justify-start px-2.5"
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

/** Drawer navigation for screens below the desktop breakpoint. */
export function MobileNavSheet() {
  const { mobileNavOpen, setMobileNavOpen } = useApp();
  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-sidebar-border p-3 text-start">
          <SheetTitle className="sr-only">Catalyst navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation for Catalyst tools and planned features.
          </SheetDescription>
          <NavLink to="/" onClick={() => setMobileNavOpen(false)} aria-label="Catalyst home">
            <Logo />
          </NavLink>
        </SheetHeader>
        <div className="overflow-y-auto" onClick={() => setMobileNavOpen(false)}>
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
