import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@workspace/ksap-cloud-ui/components/ui/alert";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGo } from "@/hooks/use-go";
import { Link } from "@/lib/router";
import { ArrowRight, CornerDownLeft, Link2, Pin, PinOff, Search, Table2, Wand2 } from "lucide-react";
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { ErrorState } from "@/components/state-block";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ksap-cloud-ui/components/ui/toggle-group";
import { useActivity } from "@/hooks/use-activity";
import {
  searchColumns,
  searchTables,
  tableHasFlex,
  tableHasFks,
  type ColumnHit,
  type TableHit,
} from "@/lib/dictionary";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";
import { announce } from "@/components/shell/announcer";
import { useApp } from "@/state/app";
import { useDictionary } from "@/state/dictionary";

const MAX_TABLE_HITS = 12;
const MAX_COLUMN_HITS = 15;

export default function DictionaryPage() {
  const { t } = useTranslation();
  useActivity("tool", t("nav.dataDictionary"), "/dictionary");
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
  const resultSummary = query.trim()
    ? t("dictionary.resultSummaryWithColumns", { tables: tableHits.length, columns: columnHits.length })
    : t("dictionary.resultSummary", { count: tableHits.length });
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
      <PageHeader
        className="mb-5"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t("dictionary.dataDictionary")}
            <Badge variant="secondary" className="font-mono">{release}</Badge>
          </span>
        }
        action={
          <Link
            to="/dictionary/joins"
            onClick={(e) => {
              e.preventDefault();
              go("/dictionary/joins", "nav-forward");
            }}
            className="inline-flex items-center gap-2 text-body text-primary-ink hover:underline"
          >
            <Link2 className="size-icon-sm" aria-hidden="true" />
            {t("dictionary.findJoins")}
            <ArrowRight className="size-icon-sm" aria-hidden="true" />
          </Link>
        }
      />

      <Alert variant="warning" className="mb-6">
        <AlertDescription>{t("dictionary.sampleDictionaryForRelease", { release })}</AlertDescription>
      </Alert>

      {loadError && (
        <div className="mb-6">
          <ErrorState
            title={t("dictionary.loadFailedTitle", { release })}
            body={t("dictionary.loadFailedBody", { error: loadError })}
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-split">
        <div className="min-w-0">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("dictionary.searchTablesColumnsAliases")}
              className="h-11 ps-9 text-subheading"
              aria-label={t("dictionary.searchTheDataDictionary")}
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
              aria-label={t("dictionary.filterTables")}
            >
              <ToggleGroupItem value="flex" aria-pressed={chips.includes("flex")} className="h-7 gap-2 px-3 text-caption">
                <Wand2 className="size-icon-sm" aria-hidden="true" />
                {t("dictionary.hasFlexFields")}
              </ToggleGroupItem>
              <ToggleGroupItem value="fk" aria-pressed={chips.includes("fk")} className="h-7 gap-2 px-3 text-caption">
                <Link2 className="size-icon-sm" aria-hidden="true" />
                {t("dictionary.hasForeignKeys")}
              </ToggleGroupItem>
            </ToggleGroup>
            <span className="ms-auto text-caption text-muted-foreground">
              {resultSummary}
            </span>
          </div>

          <div id="dict-results" role="listbox" aria-label={t("dictionary.searchResults")} className="mt-4 flex flex-col">
            {/* Tables group */}
            <div>
              <h2 className="mb-2 text-caption font-semibold text-muted-foreground">
                {t("dictionary.tables")}
              </h2>
              <ul className="divide-y rounded-lg border bg-card">
                {tableHits.map((hit, i) => {
                  const tbl = hit.table;
                  return (
                    <li key={tbl.name} id={`dict-result-${i}`} role="option" aria-selected={active === i}>
                      <div
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-3",
                          active === i && "bg-primary/5",
                        )}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => openResult(i)}
                      >
                        <Table2 className="size-icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <>
                              <span className="font-mono text-body font-semibold">{tbl.name}</span>
                            </>
                            <span className="font-mono text-caption text-muted-foreground">{tbl.alias}</span>
                            {tableHasFlex(tbl) && (
                              <Badge variant="secondary" className="px-2 text-caption">{t("dictionary.flex")}</Badge>
                            )}
                            {tbl.foreignKeys.length > 0 && (
                              <Badge variant="secondary" className="px-2 text-caption">
                                {t("dictionary.lengthFk", { length: tbl.foreignKeys.length })}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-caption text-muted-foreground">{tbl.description}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={isPinned(tbl.name) ? `Unpin ${tbl.name}` : `Pin ${tbl.name}`}
                          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(tbl.name);
                          }}
                        >
                          {isPinned(tbl.name) ? (
                            <PinOff className="size-icon-sm" aria-hidden="true" />
                          ) : (
                            <Pin className="size-icon-sm" aria-hidden="true" />
                          )}
                        </button>
                        {active === i && (
                          <span className="flex items-center gap-1 text-caption text-muted-foreground">
                            <CornerDownLeft className="size-icon-sm" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
                {tableHits.length === 0 && (
                  <li className="px-3 py-6 text-center text-caption text-muted-foreground">
                    {t("dictionary.noTablesMatch")}{chips.length > 0 ? " with these filters" : ""}.
                  </li>
                )}
              </ul>
            </div>

            {/* Columns group */}
            {columnHits.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-caption font-semibold text-muted-foreground">
                  {t("dictionary.columns")}
                </h2>
                <ul className="divide-y rounded-lg border bg-card">
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
                              <span className="font-mono text-body font-semibold">{hit.column.name}</span>
                              <span className="font-mono text-caption text-muted-foreground">
                                {hit.column.oracleDataType}
                              </span>
                            </div>
                            <p className="truncate text-caption text-muted-foreground">
                              {t("dictionary.in")}{" "}
                              <span className="font-mono text-primary">{hit.table.name}</span>{" "}
                              {hit.table.alias} — {hit.column.description}
                            </p>
                          </div>
                          {active === i && (
                            <span className="flex items-center gap-1 text-caption text-muted-foreground">
                              <CornerDownLeft className="size-icon-sm" aria-hidden="true" />
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
        <aside className="flex flex-col gap-6" aria-label={t("dictionary.pinnedAndRecent")}>
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-caption font-semibold text-muted-foreground">
              <Pin className="size-icon-sm" aria-hidden="true" />
              {t("dictionary.pinnedTables")}
            </h2>
            {pins.filter((p) => p.release === release).length === 0 ? (
              <p className="text-caption text-muted-foreground">{t("dictionary.pinTablesToKeep")}</p>
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
                        className="block truncate rounded-md border border-border bg-card px-3 py-2 font-mono text-caption hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {p.table}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-caption font-semibold text-muted-foreground">
              {t("dictionary.recentSearches")}
            </h2>
            {recents.length === 0 ? (
              <p className="text-caption text-muted-foreground">{t("dictionary.searchesYouRunAppear")}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {recents.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="w-full truncate rounded-md px-3 py-2 text-start text-caption text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
