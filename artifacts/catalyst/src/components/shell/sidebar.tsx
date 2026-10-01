import { useTranslation } from "react-i18next";
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
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ksap-cloud-ui/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ksap-cloud-ui/components/ui/tooltip";
import { plannedFeatures } from "@/data/planned";
import { Wordmark } from "@/components/shell/wordmark";
import { useApp } from "@/state/app";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

const HOME_ITEM: NavItem = { to: "/", labelKey: "nav.home", icon: Home, end: true };

const TOOL_ITEMS: NavItem[] = [
  { to: "/list", labelKey: "nav.listUtility", icon: ListChecks },
  { to: "/dictionary", labelKey: "nav.dataDictionary", icon: BookOpen },
  { to: "/agents", labelKey: "nav.agentCompare", icon: GitCompareArrows },
];

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.labelKey);
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex h-9 min-w-9 items-center gap-3 rounded-md px-3 text-body outline-none transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-hairline"
            : "text-sidebar-foreground",
        )
      }
    >
      <Icon className="size-icon-md shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
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
        <p className="px-3 pb-2 text-caption font-semibold text-sidebar-foreground/80">{label}</p>
      )}
      <ul className="flex flex-col gap-1" role="list">
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
  const { t } = useTranslation();
  return (
    <nav className="flex flex-col gap-4 py-4" aria-label={t("sidebar.main")}>
      <NavSection label={t("sidebar.home")} items={[HOME_ITEM]} collapsed={collapsed} />
      <NavSection label={t("sidebar.tools")} items={TOOL_ITEMS} collapsed={collapsed} />

      <div className="px-3 pb-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-caption font-semibold text-sidebar-foreground/80">{t("sidebar.planned")}</p>
        )}
        <ul className="flex flex-col gap-1" role="list">
          {plannedFeatures(t).map((feature) => {
            const link = (
              <NavLink
                to={`/planned/${feature.slug}`}
                className="flex h-9 min-w-9 items-center gap-2 rounded-md px-3 text-body text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <span className="min-w-0 flex-1 truncate ps-1">{feature.title}</span>
                {!collapsed && (
                  <Badge variant="secondary" className="shrink-0 px-2 text-caption">
                    {t("sidebar.planned")}
                  </Badge>
                )}
              </NavLink>
            );
            return (
              <li key={feature.slug}>
                {collapsed ? (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{t("sidebar.titlePlanned", { title: feature.title })}</TooltipContent>
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
  const { t } = useTranslation();
  const { sidebarCollapsed: collapsed, toggleSidebar } = useApp();

  return (
    <aside
      aria-label={t("sidebar.primary")}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex",
        collapsed ? "w-16" : "w-72",
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <NavLink to="/" className="rounded-md" aria-label={t("sidebar.catalystHome")}>
          <Wordmark collapsed={collapsed} />
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
          aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          className="w-full justify-start px-3"
        >
          {collapsed ? (
            <ChevronRight className="size-icon-sm" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="size-icon-sm" aria-hidden="true" />
              <span>{t("sidebar.collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

/** Drawer navigation for screens below the desktop breakpoint. */
export function MobileNavSheet() {
  const { t } = useTranslation();
  const { mobileNavOpen, setMobileNavOpen } = useApp();
  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-sidebar-border p-3 text-start">
          <SheetTitle className="sr-only">{t("sidebar.catalystNavigation")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("sidebar.mainNavigationForCatalyst")}
          </SheetDescription>
          <NavLink to="/" onClick={() => setMobileNavOpen(false)} aria-label={t("sidebar.catalystHome")}>
            <Wordmark />
          </NavLink>
        </SheetHeader>
        <div className="overflow-y-auto" onClick={() => setMobileNavOpen(false)}>
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
