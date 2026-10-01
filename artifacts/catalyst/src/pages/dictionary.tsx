import { useEffect, useMemo, useRef, useState } from "react";
import { ContentTransition as ViewTransition } from "@/components/content-transition";
import { useGo } from "@/hooks/use-go";
import { Link } from "@/lib/router";
import { ArrowRight, CornerDownLeft, Link2, Pin, PinOff, Search, Table2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state-block";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActivity } from "@/hooks/use-activity";
import {
  searchColumns,
  searchTables,
  tableHasFlex,
  tableHasFks,
  type ColumnHit,
  type TableHit,
} from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { announce } from "@/components/shell/announcer";
import { useApp } from "@/state/app";
import { useDictionary } from "@/state/dictionary";

const MAX_TABLE_HITS = 12;
const MAX_COLUMN_HITS = 15;

export default function DictionaryPage() {
  useActivity("tool", "Data Dictionary", "/dictionary");
  const go = useGo();
  const { release } = useApp();
  const { index, pins, isPinned, togglePin, recents, pushRecentSearch, loadError } = useDictionary();

  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tableHits = useMemo(() => {
    if (!index) return [];
    let hits: TableHit[] = query.trim() ? searchTables(index, query) : index.tables.map((t) => ({ table: t, score: 0, matched: "name" as const }));
    if (chips.includes("flex")) hits = hits.filter((h) => tableHasFlex(h.table));
    if (chips.includes("fk")) hits = hits.filter((h) => tableHasFks(h.table, index));
    return hits.slice(0, MAX_TABLE_HITS);
  }, [index, query, chips]);

  const columnHits = useMemo(() => {
    if (!index || !query.trim()) return [] as ColumnHit[];
    return searchColumns(index, query).slice(0, MAX_COLUMN_HITS);
  }, [index, query]);

  // Announce result counts to screen readers once the query settles (debounced,
  // and only for actual searches — not on first mount listing every table).
  const resultSummary = `${tableHits.length} ${tableHits.length === 1 ? "table" : "tables"}${
    query.trim() ? `, ${columnHits.length} ${columnHits.length === 1 ? "column" : "columns"}` : ""
  }`;
  useEffect(() => {
    if (!index || (!query.trim() && chips.length === 0)) return;
    const t = setTimeout(() => announce(resultSummary), 600);
    return () => clearTimeout(t);
  }, [resultSummary, query, chips, index]);

  // Flattened result list for keyboard navigation: tables first, then columns.
  const flat = useMemo(
    () => [
      ...tableHits.map((h) => ({ kind: "table" as const, name: h.table.name })),
      ...columnHits.map((h) => ({ kind: "column" as const, name: h.table.name })),
    ],
    [tableHits, columnHits],
  );

  const openResult = (i: number) => {
    const item = flat[i];
    if (!item || !index) return;
    pushRecentSearch(query);
    go(`/dictionary/${release}/${item.name}`, "nav-forward");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      openResult(active);
    } else if (e.key === "Escape") {
      setQuery("");
      setActive(0);
    }
  };

  if (!index) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight">Data Dictionary</h1>
          <Badge variant="secondary" className="font-mono">{release}</Badge>
          <Link
            to="/dictionary/joins"
            onClick={(e) => {
              e.preventDefault();
              go("/dictionary/joins", "nav-forward");
            }}
            className="ms-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Link2 className="size-4" aria-hidden="true" />
            Find joins
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
        <Wand2 className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="text-caption text-amber-700 dark:text-amber-300">
          Sample dictionary for {release}. Replace with the KSAP dictionary before release.
        </p>
      </div>

      {loadError && (
        <div className="mb-6">
          <ErrorState
            title={`The ${release} dictionary could not be loaded`}
            body={`${loadError} If the problem persists after a refresh, pick another release from the header.`}
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search tables, columns, aliases… e.g. “ship stop”"
              className="h-11 ps-9 text-[15px]"
              aria-label="Search the data dictionary"
              role="combobox"
              aria-expanded="true"
              aria-controls="dict-results"
              aria-activedescendant={flat[active] ? `dict-result-${active}` : undefined}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="multiple"
              value={chips}
              onValueChange={setChips}
              aria-label="Filter tables"
            >
              <ToggleGroupItem value="flex" aria-pressed={chips.includes("flex")} className="h-7 gap-1.5 px-2.5 text-xs">
                <Wand2 className="size-3.5" aria-hidden="true" />
                Has flex fields
              </ToggleGroupItem>
              <ToggleGroupItem value="fk" aria-pressed={chips.includes("fk")} className="h-7 gap-1.5 px-2.5 text-xs">
                <Link2 className="size-3.5" aria-hidden="true" />
                Has foreign keys
              </ToggleGroupItem>
            </ToggleGroup>
            <span className="ms-auto text-caption text-muted-foreground">
              {tableHits.length} {tableHits.length === 1 ? "table" : "tables"}
              {query.trim() ? ` · ${columnHits.length} ${columnHits.length === 1 ? "column" : "columns"}` : ""}
            </span>
          </div>

          <div id="dict-results" role="listbox" aria-label="Search results" className="mt-4 flex flex-col">
            {/* Tables group */}
            <div>
              <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                Tables
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {tableHits.map((hit, i) => {
                  const t = hit.table;
                  return (
                    <li key={t.name} id={`dict-result-${i}`} role="option" aria-selected={active === i}>
                      <div
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-2.5",
                          active === i && "bg-primary/5",
                        )}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => openResult(i)}
                      >
                        <Table2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <ViewTransition name={`table-${t.name}`} share="text-morph" default="none">
                              <span className="font-mono text-[13px] font-medium">{t.name}</span>
                            </ViewTransition>
                            <span className="font-mono text-caption text-muted-foreground">{t.alias}</span>
                            {tableHasFlex(t) && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">flex</Badge>
                            )}
                            {t.foreignKeys.length > 0 && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                {t.foreignKeys.length} fk
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-caption text-muted-foreground">{t.description}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={isPinned(t.name) ? `Unpin ${t.name}` : `Pin ${t.name}`}
                          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(t.name);
                          }}
                        >
                          {isPinned(t.name) ? (
                            <PinOff className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Pin className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                        {active === i && (
                          <span className="flex items-center gap-1 text-caption text-muted-foreground">
                            <CornerDownLeft className="size-3" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
                {tableHits.length === 0 && (
                  <li className="px-3 py-6 text-center text-caption text-muted-foreground">
                    No tables match{chips.length > 0 ? " with these filters" : ""}.
                  </li>
                )}
              </ul>
            </div>

            {/* Columns group */}
            {columnHits.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  Columns
                </h2>
                <ul className="divide-y rounded-xl border bg-card">
                  {columnHits.map((hit, j) => {
                    const i = tableHits.length + j;
                    return (
                      <li key={`${hit.table.name}.${hit.column.name}`} id={`dict-result-${i}`} role="option" aria-selected={active === i}>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-2",
                            active === i && "bg-primary/5",
                          )}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => openResult(i)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="font-mono text-[13px] font-medium">{hit.column.name}</span>
                              <span className="font-mono text-caption text-muted-foreground">
                                {hit.column.oracleDataType}
                              </span>
                            </div>
                            <p className="truncate text-caption text-muted-foreground">
                              in{" "}
                              <span className="font-mono text-primary">{hit.table.name}</span>{" "}
                              {hit.table.alias} — {hit.column.description}
                            </p>
                          </div>
                          {active === i && (
                            <span className="flex items-center gap-1 text-caption text-muted-foreground">
                              <CornerDownLeft className="size-3" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Left column */}
        <aside className="flex flex-col gap-6" aria-label="Pinned and recent">
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-muted-foreground">
              <Pin className="size-3" aria-hidden="true" />
              Pinned tables
            </h2>
            {pins.filter((p) => p.release === release).length === 0 ? (
              <p className="text-caption text-muted-foreground">Pin tables to keep them here.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {pins
                  .filter((p) => p.release === release)
                  .map((p) => (
                    <li key={p.table}>
                      <Link
                        to={`/dictionary/${release}/${p.table}`}
                        onClick={(e) => {
                          e.preventDefault();
                          go(`/dictionary/${release}/${p.table}`, "nav-forward");
                        }}
                        className="block truncate rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {p.table}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Recent searches
            </h2>
            {recents.length === 0 ? (
              <p className="text-caption text-muted-foreground">Searches you run appear here.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {recents.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="w-full truncate rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        setQuery(r);
                        setActive(0);
                        inputRef.current?.focus();
                      }}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
