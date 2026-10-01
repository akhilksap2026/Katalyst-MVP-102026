import { useTranslation } from "react-i18next";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Database,
  ListPlus,
  Route,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Checkbox } from "@workspace/ksap-cloud-ui/components/ui/checkbox";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ksap-cloud-ui/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ksap-cloud-ui/components/ui/command";
import { useActivity } from "@/hooks/use-activity";
import {
  findJoinPaths,
  highlightSql,
  isFootprintColumn,
  type DictionaryIndex,
  type JoinPath,
} from "@/lib/dictionary";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";
import { useApp } from "@/state/app";
import { useDictionary } from "@/state/dictionary";
import { useListTool } from "@/state/list-tool";

/* --------------------------------------------------------- table combobox */

function TableCombobox({
  id,
  label,
  value,
  onChange,
  tables,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  tables: string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={`${id}-trigger`} className="text-caption text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`${id}-trigger`}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full justify-between font-mono text-caption"
          >
            {value || "Choose a table…"}
            <ChevronDown className="ms-2 size-icon-sm shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={t("dictionaryJoins.searchTables")} />
            <CommandList>
              <CommandEmpty>{t("dictionaryJoins.noTableFound")}</CommandEmpty>
              <CommandGroup>
                {tables.map((t) => (
                  <CommandItem
                    key={t}
                    value={t}
                    className="font-mono text-caption"
                    onSelect={() => {
                      onChange(t);
                      setOpen(false);
                    }}
                  >
                    {t}
                    {value === t && <Check className="ms-auto size-icon-sm" aria-hidden="true" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------- path chain */

function PathChain({
  path,
  index,
  selected,
  onSelect,
}: {
  path: JoinPath;
  index: DictionaryIndex;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-lg border bg-card px-3 py-3 text-start transition-colors",
        selected ? "border-primary/60 ring-1 ring-primary/30" : "hover:border-primary/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-y-2">
        {path.tables.map((t, i) => {
          const alias = index.byTable.get(t)?.alias ?? "";
          return (
            <span key={`${t}-${i}`} className="flex items-center">
              {i > 0 && (
                <span className="group relative mx-1 inline-flex items-center" aria-label={path.edges[i - 1].condition}>
                  <span className="rounded border border-border bg-muted px-1 font-mono text-caption text-muted-foreground">
                    {path.edges[i - 1].condition}
                  </span>
                  <ArrowRight className="mx-1 size-icon-sm shrink-0 text-primary" aria-hidden="true" />
                </span>
              )}
              <span
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-caption font-semibold",
                  i === 0 || i === path.tables.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {t}
                <span className="ms-1 opacity-60">{alias}</span>
              </span>
            </span>
          );
        })}
        <span className="ms-auto ps-2 text-caption text-muted-foreground">
          {t("dictionaryJoins.hops", { count: path.hops })}
        </span>
      </div>
    </button>
  );
}

/* --------------------------------------------------------- query builder */

interface BuilderState {
  /** selected columns per table */
  selected: Record<string, Set<string>>;
  where: string;
}

function QueryBuilder({ path, index }: { path: JoinPath; index: DictionaryIndex }) {
  const { t } = useTranslation();
  const { openTrayWith } = useListTool();
  const [showFootprint, setShowFootprint] = useState(false);
  const [builder, setBuilder] = useState<BuilderState | null>(null);
  const whereRef = useRef<HTMLInputElement>(null);

  // Default selection: primary key columns of every table in the path.
  const initial = useMemo<BuilderState>(() => {
    const selected: Record<string, Set<string>> = {};
    for (const t of path.tables) {
      const table = index.byTable.get(t);
      selected[t] = new Set(table?.primaryKey ?? []);
    }
    return { selected, where: "" };
  }, [path, index]);

  const state = builder ?? initial;

  const toggleCol = (table: string, col: string, on: boolean) => {
    setBuilder((prev) => {
      const base = prev ?? initial;
      const next: BuilderState = {
        ...base,
        selected: { ...base.selected, [table]: new Set(base.selected[table]) },
      };
      if (on) next.selected[table].add(col);
      else next.selected[table].delete(col);
      return next;
    });
  };

  const setWhere = (where: string) => {
    setBuilder((prev) => ({ ...(prev ?? initial), where }));
  };

  // "Insert list": open the tray; the next copy there lands in the WHERE line.
  const pendingInsert = useRef(false);
  useEffect(() => {
    const onCopied = (e: Event) => {
      if (!pendingInsert.current) return;
      pendingInsert.current = false;
      const text = (e as CustomEvent<string>).detail;
      const el = whereRef.current;
      const at = el?.selectionStart ?? state.where.length;
      const next = state.where.slice(0, at) + text + state.where.slice(at);
      setWhere(next);
      toast.success(t("dictionaryJoins.insertedListIntoWhere"));
    };
    window.addEventListener("catalyst:list-copied", onCopied);
    return () => window.removeEventListener("catalyst:list-copied", onCopied);
  }, [state.where]);

  const insertList = () => {
    pendingInsert.current = true;
    openTrayWith("");
  };

  const sql = useMemo(() => buildQuerySql(path, index, state, showFootprint), [path, index, state, showFootprint]);

  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-2">
      {/* Column pickers */}
      <div className="flex flex-col gap-4">
        {path.tables.map((t) => {
          const table = index.byTable.get(t)!;
          const cols = table.columns.filter((c) => showFootprint || !isFootprintColumn(c.name));
          return (
            <section key={t}>
              <h4 className="mb-2 font-mono text-caption font-semibold">
                {t} <span className="font-normal text-muted-foreground">{table.alias}</span>
              </h4>
              <div className="grid max-h-44 grid-cols-2 gap-x-3 overflow-y-auto rounded-lg border bg-card p-3 sm:grid-cols-3">
                {cols.map((c) => (
                  <label
                    key={c.name}
                    className="flex cursor-pointer items-center gap-2 truncate py-1 text-caption hover:bg-muted/60"
                    title={c.description}
                  >
                    <Checkbox
                      checked={state.selected[t]?.has(c.name) ?? false}
                      onCheckedChange={(v) => toggleCol(t, c.name, v === true)}
                      aria-label={`${t}.${c.name}`}
                      className="size-4"
                    />
                    <span className="truncate font-mono">{c.name}</span>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
        <label className="flex items-center gap-2 text-caption text-muted-foreground">
          <Checkbox checked={showFootprint} onCheckedChange={(v) => setShowFootprint(v === true)} />
          {t("dictionaryJoins.showFootprintColumns")}
        </label>

        <div className="flex flex-col gap-2">
          <Label htmlFor="qb-where" className="text-caption text-muted-foreground">
            {t("dictionaryJoins.where")}{" "}<span className="normal-case">{t("dictionaryJoins.optional")}</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="qb-where"
              ref={whereRef}
              value={state.where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder={t("dictionaryJoins.eGShShipment")}
              className="h-8 font-mono text-caption"
              spellCheck={false}
            />
            <Button size="sm" variant="outline" onClick={insertList} title={t("dictionaryJoins.formatAListIn")}>
              <ListPlus className="size-icon-sm" aria-hidden="true" />
              {t("dictionaryJoins.insertList")}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-caption font-semibold text-muted-foreground">{t("dictionaryJoins.sqlPreview")}</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(sql).then(() => toast.success(t("dictionaryJoins.copiedSql")));
            }}
          >
            <Copy className="size-icon-sm" aria-hidden="true" />
            {t("dictionaryJoins.copySql")}
          </Button>
        </div>
        <pre className="max-h-table flex-1 overflow-auto rounded-lg border bg-card p-4 font-mono text-caption leading-5">
          <code dangerouslySetInnerHTML={{ __html: highlightSql(sql) }} />
        </pre>
        <p className="flex items-start gap-2 text-caption text-muted-foreground">
          <ShieldAlert className="mt-1 size-icon-sm shrink-0 text-warning" aria-hidden="true" />
          {t("dictionaryJoins.generatedFromTheDictionary")}
        </p>
      </div>
    </div>
  );
}

function buildQuerySql(
  path: JoinPath,
  index: DictionaryIndex,
  state: BuilderState,
  showFootprint: boolean,
): string {
  const sel: string[] = [];
  for (const t of path.tables) {
    const table = index.byTable.get(t)!;
    for (const c of table.columns) {
      if (!state.selected[t]?.has(c.name)) continue;
      if (!showFootprint && isFootprintColumn(c.name)) continue;
      sel.push(`  ${table.alias}.${c.name},`);
    }
  }
  if (sel.length > 0) sel[sel.length - 1] = sel[sel.length - 1].replace(/,$/, "");
  const from: string[] = [];
  path.tables.forEach((t, i) => {
    const table = index.byTable.get(t)!;
    if (i === 0) {
      from.push(`FROM ${t} ${table.alias}`);
    } else {
      from.push(`JOIN ${t} ${table.alias} ON ${path.edges[i - 1].condition}`);
    }
  });
  const lines = ["SELECT", ...(sel.length ? sel : ["  1 /* no columns selected */"]), ...from];
  if (state.where.trim()) lines.push(`WHERE ${state.where.trim()}`);
  return lines.join("\n");
}

/* ------------------------------------------------------------------ page */

export default function DictionaryJoinsPage() {
  const { t } = useTranslation();
  useActivity("tool", t("dictionaryJoins.findJoins"), "/dictionary/joins");
  const { release } = useApp();
  const { index } = useDictionary();

  const tableNames = useMemo(() => index?.tables.map((t) => t.name) ?? [], [index]);

  const [from, setFrom] = useState("SHIPMENT");
  const [to, setTo] = useState("LOCATION");
  const [via, setVia] = useState("");
  const [ran, setRan] = useState(false);
  const [paths, setPaths] = useState<JoinPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);

  const run = () => {
    if (!index || !from || !to) return;
    setPaths(findJoinPaths(index, from, to, via || undefined));
    setSelectedPath(null);
    setRan(true);
  };

  if (!index) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t("dictionaryJoins.findJoins")}
            <Badge variant="secondary" className="font-mono">{release}</Badge>
          </span>
        }
        description={t("dictionaryJoins.foreignKeysAreFollowed")}
        action={
          <Link to="/dictionary" className="text-body text-primary-ink hover:underline">
            {t("dictionaryJoins.backToDictionary")}
          </Link>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <TableCombobox id="join-from" label={t("dictionaryJoins.fromTable")} value={from} onChange={setFrom} tables={tableNames} />
        </div>
        <div className="w-56">
          <TableCombobox id="join-to" label={t("dictionaryJoins.toTable")} value={to} onChange={setTo} tables={tableNames} />
        </div>
        <div className="w-56">
          <TableCombobox id="join-via" label={t("dictionaryJoins.viaTableOptional")} value={via} onChange={setVia} tables={tableNames} />
        </div>
        <Button size="sm" onClick={run} disabled={!from || !to}>
          <Waypoints className="size-icon-sm" aria-hidden="true" />
          {t("dictionaryJoins.findPaths")}
        </Button>
      </div>

      {ran && (
        <div className="mt-6">
          {paths.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
              <Route className="size-icon-lg text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-body text-muted-foreground">
                {t("dictionaryJoins.noJoinPathWithin")}{via ? ` via ${via}` : ""}{t("dictionaryJoins.checkTheTableNames")}
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-caption font-semibold text-muted-foreground">
                {paths.length} {paths.length === 1 ? "path" : "paths"}{" "}{t("dictionaryJoins.fromToTo", { from, to })}
              </h2>
              <div className="flex flex-col gap-2">
                {paths.map((p, i) => (
                  <PathChain
                    key={p.tables.join(">")}
                    path={p}
                    index={index}
                    selected={selectedPath === i}
                    onSelect={() => setSelectedPath(selectedPath === i ? null : i)}
                  />
                ))}
              </div>
              {selectedPath !== null && paths[selectedPath] && (
                <QueryBuilder path={paths[selectedPath]} index={index} />
              )}
            </>
          )}
        </div>
      )}

      {!ran && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <Database className="size-icon-lg text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <p className="max-w-md text-caption text-muted-foreground">
            {t("dictionaryJoins.pickAFromAnd")}
          </p>
        </div>
      )}
    </div>
  );
}
