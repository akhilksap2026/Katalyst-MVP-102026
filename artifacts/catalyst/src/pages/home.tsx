import { useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import {
  BookOpen,
  Bot,
  GitCompareArrows,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Table2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readActivity, type ActivityItem, type ActivityKind } from "@/lib/activity";
import { detectPaste, type PasteDetection } from "@/lib/detect-paste";
import { listTables } from "@/lib/dictionary";
import { relativeTime } from "@/lib/format";
import { writeStorage } from "@/lib/storage";
import { PLANNED_FEATURES } from "@/data/planned";
import { useApp } from "@/state/app";
import { cn } from "@/lib/utils";

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  tool: Wrench,
  table: Table2,
  comparison: GitCompareArrows,
};

function SuggestionRow({
  icon: Icon,
  text,
  action,
  onRun,
}: {
  icon: LucideIcon;
  text: string;
  action: string;
  onRun: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-accent/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-40 flex-1 text-[13px] text-accent-foreground">{text}</p>
      <Button size="sm" onClick={onRun}>
        {action}
      </Button>
    </div>
  );
}

function suggestionFor(d: PasteDetection): { icon: LucideIcon; text: string; action: string } {
  switch (d.kind) {
    case "agent-extract":
      return {
        icon: GitCompareArrows,
        text: `${d.reason}. Review it as an agent extract.`,
        action: "Compare agents",
      };
    case "table":
      return {
        icon: BookOpen,
        text: `${d.reason}. Open it in the Data Dictionary.`,
        action: "Open in Data Dictionary",
      };
    case "list":
      return {
        icon: ListChecks,
        text: `${d.reason}. Clean it as a list.`,
        action: "Clean this list",
      };
    default:
      return {
        icon: Sparkles,
        text: "No structure detected. You can still treat it as a value list.",
        action: "Clean as a list",
      };
  }
}

function SmartPaste() {
  const { release } = useApp();
  const navigate = useNavigate();
  const [pasted, setPasted] = useState("");
  const tableNames = useMemo(() => listTables(release), [release]);
  const detection = useMemo(() => detectPaste(pasted, tableNames), [pasted, tableNames]);

  const runSuggestion = () => {
    if (detection.kind === "agent-extract") {
      // Consumed by the Agent Compare tool when it is built.
      writeStorage("agents.draft", pasted);
      navigate("/agents");
    } else if (detection.kind === "table" && detection.table) {
      navigate(`/dictionary/${release}/${detection.table}`);
    } else {
      // Consumed by the List Utility (tray and page) as its starting input.
      writeStorage("list.draft", pasted);
      navigate("/list");
    }
  };

  return (
    <section aria-labelledby="smart-paste-heading">
      <h2 id="smart-paste-heading" className="text-subheading font-semibold">
        Paste anything
      </h2>
      <div className="mt-2 rounded-xl border bg-card p-4">
        <Label htmlFor="smart-paste" className="sr-only">
          Paste anything
        </Label>
        <Textarea
          id="smart-paste"
          rows={5}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder={"IDs, GIDs, a CSV extract, a DB.XML file or a table name…"}
          className="resize-y font-mono text-[13px]"
          spellCheck={false}
        />
        {pasted.trim() !== "" && (
          <>
            <SuggestionRow {...suggestionFor(detection)} onRun={runSuggestion} />
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPasted("")}>
                <X className="size-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </>
        )}
      </div>
      <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
        Processed in your browser. Nothing you paste leaves this device.
      </p>
    </section>
  );
}

interface ToolCard {
  to: string;
  sampleTo: string;
  shortcutKey: string;
  icon: LucideIcon;
  title: string;
  value: string;
}

function ToolCardLink({ card }: { card: ToolCard }) {
  return (
    <Card className="h-full p-4">
      <div className="flex items-start justify-between gap-2">
        <card.icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <kbd aria-label={`Shortcut ${card.shortcutKey}`}>{card.shortcutKey}</kbd>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold">
        <Link to={card.to} className="hover:underline">
          {card.title}
        </Link>
      </h3>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{card.value}</p>
      <Link
        to={card.sampleTo}
        className="mt-3 inline-block text-caption font-medium text-primary hover:underline"
      >
        Try sample data
      </Link>
    </Card>
  );
}

function RecentActivity() {
  const [items] = useState<ActivityItem[]>(() => readActivity(5));

  return (
    <section aria-labelledby="recent-heading" className="mt-10">
      <h2 id="recent-heading" className="text-subheading font-semibold">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing yet. Open a tool or a dictionary table and it appears here.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y rounded-xl border bg-card" role="list">
          {items.map((item) => {
            const Icon = ACTIVITY_ICON[item.kind];
            return (
              <li key={`${item.kind}:${item.href}`}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {relativeTime(item.at)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PlannedStrip() {
  return (
    <section aria-labelledby="planned-heading" className="mt-10">
      <h2 id="planned-heading" className="text-subheading font-semibold">
        Planned next
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLANNED_FEATURES.map((feature) => (
          <Link
            key={feature.slug}
            to={`/planned/${feature.slug}`}
            className="group rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-2">
              <Bot className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{feature.title}</span>
              <Badge variant="secondary" className="shrink-0 px-1.5 text-caption">
                Planned
              </Badge>
            </div>
            <p
              className={cn(
                "mt-1.5 line-clamp-2 text-caption leading-4 text-muted-foreground",
                "max-sm:line-clamp-none",
              )}
            >
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { release } = useApp();

  const toolCards: ToolCard[] = [
    {
      to: "/list",
      sampleTo: "/list?sample=1",
      shortcutKey: "L",
      icon: ListChecks,
      title: "List Utility",
      value: "Clean value lists, remove duplicates and chunk them into SQL IN lists of 1,000.",
    },
    {
      to: "/dictionary",
      sampleTo: `/dictionary/${release}/SHIPMENT`,
      shortcutKey: "D",
      icon: BookOpen,
      title: "Data Dictionary",
      value: "Tables, columns, keys and flex fields for OTM 26A and 26C.",
    },
    {
      to: "/agents",
      sampleTo: "/agents?sample=1",
      shortcutKey: "A",
      icon: GitCompareArrows,
      title: "Agent Compare",
      value: "Diff automation agents between two DB.XML or CSV extracts.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-caption font-medium text-muted-foreground">
        Catalyst · self-serve utilities for Oracle Transportation Management
      </p>
      <h1 className="mt-1 text-[28px] font-semibold leading-9 tracking-tight">
        What are you working on?
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Paste anything below and Catalyst suggests the right tool, or open a tool directly.
        Everything runs in your browser — nothing you paste is sent anywhere.
      </p>

      <div className="mt-8">
        <SmartPaste />
      </div>

      <section aria-label="Tools" className="mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {toolCards.map((card) => (
            <ToolCardLink key={card.to} card={card} />
          ))}
        </div>
      </section>

      <RecentActivity />
      <PlannedStrip />

      <p className="mt-12 text-caption text-muted-foreground">
        Dictionary release <span className="font-mono">{release}</span>. Press <kbd>Ctrl</kbd>{" "}
        <kbd>K</kbd> to search.
      </p>
    </div>
  );
}
