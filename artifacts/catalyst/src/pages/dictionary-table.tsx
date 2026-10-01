import { useTranslation } from "react-i18next";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGo } from "@/hooks/use-go";
import { Link, useNavigate, useParams } from "@/lib/router";
import { ArrowLeft, Copy, KeyRound, Link2, ListPlus, Pin, PinOff, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Checkbox } from "@workspace/ksap-cloud-ui/components/ui/checkbox";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ksap-cloud-ui/components/ui/tabs";
import { useActivity } from "@/hooks/use-activity";
import {
  edgesOf,
  flexFamilyOf,
  getIndex,
  isFootprintColumn,
  selectSql,
  tableHasFks,
  type DictTable,
  type DictionaryIndex,
} from "@/lib/dictionary";
import { useApp } from "@/state/app";
import { useDictionary } from "@/state/dictionary";
import { useListTool } from "@/state/list-tool";
import { highlightSql } from "@/lib/dictionary";

export default function DictionaryTablePage() {
  const { t } = useTranslation();
  const { release: paramRelease, table: paramTable } = useParams();
  const { release, setRelease } = useApp();
  const navigate = useNavigate();
  const go = useGo();
  const mounted = useRef(false);
  useActivity("table", paramTable ?? "", `/dictionary/${paramRelease}/${paramTable}`);

  // Deep links adopt the URL release into the header selector (mount only).
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (paramRelease && paramRelease !== release) setRelease(paramRelease);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After that, the header selector drives the URL: switching release while
  // viewing a table moves to the same table in the new release. If the table
  // does not exist there, the URL stays and the view shows the notice.
  useEffect(() => {
    if (!mounted.current || release === paramRelease || !paramTable) return;
    const target = getIndex(release);
    if (target?.byTable.has(paramTable)) {
      navigate(`/dictionary/${release}/${paramTable}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [release]);

  const index = getIndex(release);
  const table = paramTable ? index?.byTable.get(paramTable) : undefined;

  if (!index) return null;

  if (!table) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <TriangleAlert className="mx-auto size-icon-lg text-warning" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-3 text-subheading font-semibold">
          {t("dictionaryTable.paramtableIsNotIn", { paramTable, release })}
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          {t("dictionaryTable.theTableMayExist")}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => go("/dictionary", "nav-back")}>
            {t("dictionaryTable.backToSearch")}
          </Button>
        </div>
      </div>
    );
  }

  return <TableView index={index} table={table} release={release} />;
}

/* ------------------------------------------------------------- table view */

function TableView({ index, table, release }: { index: DictionaryIndex; table: DictTable; release: string }) {
  const { t } = useTranslation();
  const { isPinned, togglePin } = useDictionary();
  const go = useGo();

  // If the header release switches to one without this table, show a notice.
  const existsHere = index.byTable.has(table.name);
  const otherRelease = release === "26A" ? "26C" : "26A";
  const existsOther = getIndex(otherRelease)?.byTable.has(table.name) ?? false;

  const copyName = () => {
    void navigator.clipboard.writeText(table.name).then(() => toast.success(t("dictionaryTable.copiedName", { name: table.name })));
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-5">
        <Link
          to="/dictionary"
          onClick={(e) => {
            e.preventDefault();
            go("/dictionary", "nav-back");
          }}
          className="mb-2 inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-icon-sm" aria-hidden="true" />{" "}{t("dictionaryTable.dataDictionary")}
        </Link>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              <span className="font-mono">{table.name}</span>
              <Badge variant="secondary" className="font-mono">{table.alias}</Badge>
              <Badge variant="outline" className="font-mono">{release}</Badge>
            </span>
          }
          description={table.description}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={togglePin.bind(null, table.name)}>
            {isPinned(table.name) ? (
              <>
                <PinOff className="size-icon-sm" aria-hidden="true" />
                {t("dictionaryTable.unpin")}
              </>
            ) : (
              <>
                <Pin className="size-icon-sm" aria-hidden="true" />
                {t("dictionaryTable.pin")}
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={copyName}>
            <Copy className="size-icon-sm" aria-hidden="true" />
            {t("dictionaryTable.copyName")}
          </Button>
        </div>
      </header>

      {existsHere && !existsOther && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-warning bg-warning-subtle px-3 py-2">
          <TriangleAlert className="mt-1 size-icon-sm shrink-0 text-warning" aria-hidden="true" />
          <p className="text-caption text-warning">
            {t("dictionaryTable.nameDoesNotExist", { name: table.name, otherRelease })}
          </p>
        </div>
      )}

      <Tabs defaultValue="columns">
        <TabsList>
          <TabsTrigger value="columns">
            {t("dictionaryTable.columns")}
            <Badge variant="secondary" className="ms-2 px-2 font-mono text-caption">
              {table.columns.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="relationships">
            {t("dictionaryTable.relationships")}
            {tableHasFks(table, index) && (
              <Badge variant="secondary" className="ms-2 px-2 font-mono text-caption">
                {edgesOf(table.name, index).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="flex">{t("dictionaryTable.flexFields")}</TabsTrigger>
          <TabsTrigger value="sql">{t("dictionaryTable.sql")}</TabsTrigger>
        </TabsList>

        <TabsContent value="columns" className="mt-4">
          <ColumnsTab table={table} />
        </TabsContent>
        <TabsContent value="relationships" className="mt-4">
          <RelationshipsTab index={index} table={table} release={release} />
        </TabsContent>
        <TabsContent value="flex" className="mt-4">
          <FlexTab table={table} />
        </TabsContent>
        <TabsContent value="sql" className="mt-4">
          <SqlTab table={table} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------- columns tab */

function ColumnsTab({ table }: { table: DictTable }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { openTrayWith } = useListTool();

  const pk = new Set(table.primaryKey);
  const fkCols = new Set(table.foreignKeys.flatMap((fk) => fk.columns));
  const filtered = table.columns.filter((c) => !filter || c.name.toUpperCase().includes(filter.toUpperCase()));

  const toggle = (name: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  const copySelected = () => {
    const names = filtered.filter((c) => selected.has(c.name)).map((c) => c.name);
    void navigator.clipboard.writeText(names.join("\n")).then(() => toast.success(t("dictionaryTable.copiedColumns", { count: names.length })));
  };

  const sendToTray = () => {
    const names = filtered.filter((c) => selected.has(c.name)).map((c) => c.name);
    openTrayWith(names.join("\n"));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("dictionaryTable.filterColumns")}
          className="h-8 w-56 text-caption"
          aria-label={t("dictionaryTable.filterColumns2")}
        />
        <span className="ms-auto text-caption text-muted-foreground">
          {t("dictionaryTable.sizeSelected", { size: selected.size })}
        </span>
        <Button size="sm" variant="outline" disabled={selected.size === 0} onClick={copySelected}>
          <Copy className="size-icon-sm" aria-hidden="true" />
          {t("dictionaryTable.copySelected")}
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0} onClick={sendToTray}>
          <ListPlus className="size-icon-sm" aria-hidden="true" />
          {t("dictionaryTable.sendToListTray")}
        </Button>
      </div>

      <ul className="divide-y rounded-lg border bg-card">
        {filtered.map((col) => (
          <li key={col.name} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              id={`col-${col.name}`}
              checked={selected.has(col.name)}
              onCheckedChange={(v) => toggle(col.name, v === true)}
              aria-label={`Select ${col.name}`}
            />
            <label htmlFor={`col-${col.name}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
              <span className="font-mono text-body font-semibold">{col.name}</span>
              {pk.has(col.name) && (
                <Badge className="gap-1 bg-primary px-2 text-caption text-primary-foreground">
                  <KeyRound className="size-icon-sm" aria-hidden="true" />
                  {t("dictionaryTable.pk")}
                </Badge>
              )}
              {fkCols.has(col.name) && <Badge variant="secondary" className="px-2 text-caption">{t("dictionaryTable.fk")}</Badge>}
              {isFootprintColumn(col.name) && (
                <Badge variant="outline" className="px-2 text-caption text-muted-foreground">{t("dictionaryTable.footprint")}</Badge>
              )}
            </label>
            <span className="hidden font-mono text-caption text-muted-foreground sm:block">{col.oracleDataType}</span>
            <span
              className={`w-14 text-end text-caption ${col.nullable ? "text-muted-foreground" : "font-semibold"}`}
            >
              {col.nullable ? t("dictionaryTable.nullable") : t("dictionaryTable.notNull")}
            </span>
            <span className="hidden w-72 truncate text-caption text-muted-foreground lg:block">{col.description}</span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-caption text-muted-foreground">{t("dictionaryTable.noColumnsMatchFilter", { filter })}</li>
        )}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------- relationships tab */

function RelationshipsTab({ index, table, release }: { index: DictionaryIndex; table: DictTable; release: string }) {
  const { t } = useTranslation();
  const edges = edgesOf(table.name, index);
  const outgoing = edges.filter((e) => e.to !== table.name && table.foreignKeys.some((fk) => fk.references.table === e.to));
  const incoming = edges.filter((e) => !table.foreignKeys.some((fk) => fk.references.table === e.to));
  const neighbours = Array.from(new Set(edges.map((e) => e.to)));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-2 text-caption font-semibold text-muted-foreground">
            {t("dictionaryTable.outgoingThisTableParent")}
          </h3>
          {outgoing.length === 0 ? (
            <p className="text-caption text-muted-foreground">{t("dictionaryTable.noOutgoingForeignKeys")}</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {outgoing.map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 px-3 py-3">
                  <Link2 className="size-icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                  <Link
                    to={`/dictionary/${release}/${e.to}`}
                    className="font-mono text-body text-primary-ink hover:underline"
                  >
                    {e.to}
                  </Link>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-caption text-muted-foreground">
                    {e.fk.columns.join(", ")} → {e.fk.references.columns.join(", ")}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="mb-2 text-caption font-semibold text-muted-foreground">
            {t("dictionaryTable.incomingChildThisTable")}
          </h3>
          {incoming.length === 0 ? (
            <p className="text-caption text-muted-foreground">{t("dictionaryTable.noIncomingForeignKeys")}</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {incoming.map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 px-3 py-3">
                  <Link2 className="size-icon-sm shrink-0 rotate-180 text-muted-foreground" aria-hidden="true" />
                  <Link
                    to={`/dictionary/${release}/${e.to}`}
                    className="font-mono text-body text-primary-ink hover:underline"
                  >
                    {e.to}
                  </Link>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-caption text-muted-foreground">
                    {e.fk.columns.join(", ")} → {table.name}.{e.fk.references.columns.join(", ")}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-label={t("dictionaryTable.neighbourMap")}>
        <h3 className="mb-2 text-caption font-semibold text-muted-foreground">
          {t("dictionaryTable.directNeighbours")}
        </h3>
        <MiniMap index={index} table={table} neighbours={neighbours} release={release} />
      </section>
    </div>
  );
}

function MiniMap({
  index,
  table,
  neighbours,
  release,
}: {
  index: DictionaryIndex;
  table: DictTable;
  neighbours: string[];
  release: string;
}) {
  const go = useGo();
  const W = 320;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2;
  const R = 108;
  const pos = new Map<string, { x: number; y: number }>([[table.name, { x: cx, y: cy }]]);
  neighbours.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(neighbours.length, 1) - Math.PI / 2;
    pos.set(n, { x: cx + R * Math.cos(angle), y: cy + R * 0.82 * Math.sin(angle) });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border bg-card" role="img" aria-label={`Foreign key map around ${table.name}`}>
      {neighbours.map((n) => {
        const p = pos.get(n)!;
        return (
          <line key={`l-${n}`} x1={cx} y1={cy} x2={p.x} y2={p.y} className="stroke-border" strokeWidth="1.5" />
        );
      })}
      {neighbours.map((n) => {
        const p = pos.get(n)!;
        const alias = index.byTable.get(n)?.alias ?? "";
        return (
          <g
            key={`n-${n}`}
            className="cursor-pointer"
            onClick={() => go(`/dictionary/${release}/${n}`, "nav-forward")}
          >
            <rect x={p.x - 52} y={p.y - 15} width="104" height="30" rx="7" className="fill-muted stroke-border" />
            <text x={p.x} y={p.y + 1} textAnchor="middle" className="fill-foreground font-mono" fontSize="10" fontWeight="600">
              {n.length > 14 ? `${n.slice(0, 13)}…` : n}
            </text>
            <text x={p.x} y={p.y + 11} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="8">
              {alias}
            </text>
          </g>
        );
      })}
      <g>
        <rect x={cx - 56} y={cy - 17} width="112" height="34" rx="8" className="fill-primary stroke-primary" />
        <text x={cx} y={cy + 1} textAnchor="middle" className="fill-primary-foreground font-mono" fontSize="10" fontWeight="700">
          {table.name.length > 14 ? `${table.name.slice(0, 13)}…` : table.name}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-primary-foreground/70 font-mono" fontSize="8">
          {table.alias}
        </text>
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------- flex tab */

function FlexTab({ table }: { table: DictTable }) {
  const { t } = useTranslation();
  const groups = [
    { family: "attribute" as const, label: "ATTRIBUTE", note: t("dictionaryTable.flexText") },
    { family: "attribute_number" as const, label: "ATTRIBUTE_NUMBER", note: t("dictionaryTable.flexNumber") },
    { family: "attribute_date" as const, label: "ATTRIBUTE_DATE", note: t("dictionaryTable.flexDate") },
  ];
  const anyFlex = table.columns.some((c) => flexFamilyOf(c.name));

  if (!anyFlex) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-8 text-center text-caption text-muted-foreground">
        {t("dictionaryTable.nameHasNoFlex", { name: table.name })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const cols = table.columns.filter((c) => flexFamilyOf(c.name) === g.family);
        if (cols.length === 0) return null;
        return (
          <section key={g.family}>
            <h3 className="mb-2 flex flex-wrap items-baseline gap-2 text-caption font-semibold text-muted-foreground">
              {g.label}
              <Badge variant="secondary" className="font-mono text-caption">{cols.length}</Badge>
              <span className="normal-case tracking-normal">{g.note}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {cols.map((c) => (
                <code key={c.name} className="rounded border border-border bg-card px-2 py-1 font-mono text-caption">
                  {c.name}
                </code>
              ))}
            </div>
          </section>
        );
      })}
      <p className="flex items-start gap-2 text-caption text-muted-foreground">
        <Wand2 className="mt-1 size-icon-sm shrink-0 text-primary" aria-hidden="true" />
        {t("dictionaryTable.showsAvailableFlexFields")}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- sql tab */

function SqlTab({ table }: { table: DictTable }) {
  const { t } = useTranslation();
  const [includeFootprint, setIncludeFootprint] = useState(false);
  const sql = useMemo(() => selectSql(table, includeFootprint), [table, includeFootprint]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(sql).then(() => toast.success(t("dictionaryTable.copiedSelect")));
          }}
        >
          <Copy className="size-icon-sm" aria-hidden="true" />
          {t("dictionaryTable.copySql")}
        </Button>
        <label className="flex items-center gap-2 text-caption text-muted-foreground">
          <Checkbox checked={includeFootprint} onCheckedChange={(v) => setIncludeFootprint(v === true)} />
          {t("dictionaryTable.includeFootprintColumns")}
        </label>
      </div>
      <pre
        className="overflow-x-auto rounded-lg border bg-card p-4 font-mono text-caption leading-5"
        aria-label={t("dictionaryTable.generatedSelectStatement")}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightSql(sql) }} />
      </pre>
      <p className="text-caption text-muted-foreground">
        {t("dictionaryTable.footprintColumnsInsertUser")}
      </p>
    </div>
  );
}
