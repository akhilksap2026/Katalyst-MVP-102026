import { Kbd } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { fmtNumber } from "@workspace/ksap-cloud-ui/lib/format";
import { userLocale } from "@/i18n";
import { Trans, useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
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
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Card } from "@workspace/ksap-cloud-ui/components/patterns/panel";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import { Textarea } from "@workspace/ksap-cloud-ui/components/ui/textarea";
import { readActivity, type ActivityItem, type ActivityKind } from "@/lib/activity";
import { detectPaste, type PasteDetection } from "@/lib/detect-paste";
import { listTables } from "@/lib/dictionary";
import { relativeTime } from "@/lib/format";
import { writeStorage } from "@/lib/storage";
import { plannedFeatures } from "@/data/planned";
import { useApp } from "@/state/app";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

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
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-accent/60 px-3 py-3">
      <Icon className="size-icon-md shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-40 flex-1 text-body text-accent-foreground">{text}</p>
      <Button size="sm" onClick={onRun}>
        {action}
      </Button>
    </div>
  );
}

function suggestionFor(
  d: PasteDetection,
  t: TFunction,
): { icon: LucideIcon; text: string; action: string } {
  switch (d.kind) {
    case "agent-extract":
      return { icon: GitCompareArrows, text: t("home.suggest.agentText", { reason: d.reason }), action: t("home.suggest.agentAction") };
    case "table":
      return { icon: BookOpen, text: t("home.suggest.tableText", { reason: d.reason }), action: t("home.suggest.tableAction") };
    case "list":
      return { icon: ListChecks, text: t("home.suggest.listText", { reason: d.reason }), action: t("home.suggest.listAction") };
    default:
      return { icon: Sparkles, text: t("home.suggest.noneText"), action: t("home.suggest.noneAction") };
  }
}

function SmartPaste() {
  const { t } = useTranslation();
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
        {t("home.pasteAnything")}
      </h2>
      <div className="mt-2 rounded-lg border bg-card p-4">
        <Label htmlFor="smart-paste" className="sr-only">
          {t("home.pasteAnything")}
        </Label>
        <Textarea
          id="smart-paste"
          rows={5}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder={t("home.pastePlaceholder")}
          className="resize-y font-mono text-body"
          spellCheck={false}
        />
        {pasted.trim() !== "" && (
          <>
            <SuggestionRow {...suggestionFor(detection, t)} onRun={runSuggestion} />
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPasted("")}>
                <X className="size-icon-sm" aria-hidden="true" />
                {t("home.clear")}
              </Button>
            </div>
          </>
        )}
      </div>
      <p className="mt-2 inline-flex items-center gap-2 text-caption text-muted-foreground">
        <ShieldCheck className="size-icon-sm text-primary" aria-hidden="true" />
        {t("home.processedInYourBrowser")}
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
  const { t } = useTranslation();
  return (
    <Card className="h-full p-4">
      <div className="flex items-start justify-between gap-2">
        <card.icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <Kbd>{card.shortcutKey}</Kbd>
      </div>
      <h3 className="mt-2 text-subheading font-semibold">
        <Link to={card.to} className="hover:underline">
          {card.title}
        </Link>
      </h3>
      <p className="mt-1 text-body leading-5 text-muted-foreground">{card.value}</p>
      <Link
        to={card.sampleTo}
        className="mt-3 inline-block text-caption font-semibold text-primary-ink hover:underline"
      >
        {t("home.trySampleData")}
      </Link>
    </Card>
  );
}

function RecentActivity() {
  const { t } = useTranslation();
  const [items] = useState<ActivityItem[]>(() => readActivity(5));

  return (
    <section aria-labelledby="recent-heading" className="mt-10">
      <h2 id="recent-heading" className="text-subheading font-semibold">
        {t("home.recentActivity")}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-body text-muted-foreground">
          {t("home.nothingYetOpenA")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y rounded-lg border bg-card" role="list">
          {items.map((item) => {
            const Icon = ACTIVITY_ICON[item.kind];
            return (
              <li key={`${item.kind}:${item.href}`}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-body hover:bg-accent/50"
                >
                  <Icon className="size-icon-md shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {relativeTime(item.at, undefined, userLocale(), t("home.justNow"))}
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
  const { t } = useTranslation();
  return (
    <section aria-labelledby="planned-heading" className="mt-10">
      <h2 id="planned-heading" className="text-subheading font-semibold">
        {t("home.plannedNext")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plannedFeatures(t).map((feature) => (
          <Link
            key={feature.slug}
            to={`/planned/${feature.slug}`}
            className="group rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-2">
              <Bot className="size-icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-body font-semibold">{feature.title}</span>
              <Badge variant="secondary" className="shrink-0 px-2 text-caption">
                {t("home.planned")}
              </Badge>
            </div>
            <p
              className={cn(
                "mt-2 line-clamp-2 text-caption leading-4 text-muted-foreground",
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
  const { t } = useTranslation();
  const { release } = useApp();

  const toolCards: ToolCard[] = [
    {
      to: "/list",
      sampleTo: "/list?sample=1",
      shortcutKey: "L",
      icon: ListChecks,
      title: t("nav.listUtility"),
      value: t("home.cardList", { limit: fmtNumber(userLocale(), 1000) }),
    },
    {
      to: "/dictionary",
      sampleTo: `/dictionary/${release}/SHIPMENT`,
      shortcutKey: "D",
      icon: BookOpen,
      title: t("nav.dataDictionary"),
      value: t("home.cardDictionary"),
    },
    {
      to: "/agents",
      sampleTo: "/agents?sample=1",
      shortcutKey: "A",
      icon: GitCompareArrows,
      title: t("nav.agentCompare"),
      value: t("home.cardAgents"),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-caption font-semibold text-muted-foreground">
        {t("home.catalystSelfServeUtilities")}
      </p>
      <h1 className="mt-1 text-heading font-semibold leading-9">
        {t("home.whatAreYouWorking")}
      </h1>
      <p className="mt-2 max-w-2xl text-body leading-6 text-muted-foreground">
        {t("home.pasteAnythingBelowAnd")}
      </p>

      <div className="mt-8">
        <SmartPaste />
      </div>

      <section aria-label={t("home.tools")} className="mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {toolCards.map((card) => (
            <ToolCardLink key={card.to} card={card} />
          ))}
        </div>
      </section>

      <RecentActivity />
      <PlannedStrip />

      <p className="mt-12 text-caption text-muted-foreground">
        <Trans
          i18nKey="home.footer"
          values={{ release }}
          components={{ release: <span className="font-mono" />, ctrl: <Kbd />, k: <Kbd /> }}
        />
      </p>
    </div>
  );
}
