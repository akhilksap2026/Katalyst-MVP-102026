import { useTranslation } from "react-i18next";
import { userLocale } from "@/i18n";
import { fmtNumber } from "@workspace/ksap-cloud-ui/lib/format";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@/lib/router";
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  Info,
  ListChecks,
  ShieldCheck,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import { Kbd, KbdGroup } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { Switch } from "@workspace/ksap-cloud-ui/components/ui/switch";
import { Textarea } from "@workspace/ksap-cloud-ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ksap-cloud-ui/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@workspace/ksap-cloud-ui/components/ui/separator";
import { useListTool } from "@/state/list-tool";
import { useApp } from "@/state/app";
import { detectDelimiters, ORACLE_IN_LIMIT, type Delimiter, type DomainAction, type OutputPreset, type SortMode } from "@/lib/list";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

/* ----------------------------------------------------------- small pieces */

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label className="text-caption text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const SPLIT_DELIMITERS: Delimiter[] = ["auto", "newline", "tab", "comma", "semicolon", "pipe", "space"];

function SplitSelect({ id }: { id: string }) {
  const { t } = useTranslation();
  const { input, options, setOptions } = useListTool();
  const detected = options.delimiter === "auto" ? detectDelimiters(input) : [];
  return (
    <Field
      label={
        detected.length > 0
          ? t("listTool.splitOnDetected", { detected: detected.map((d) => t(`listTool.delimiters.${d}`).toLowerCase()).join(", ") })
          : t("listTool.splitOn")
      }
    >
      <Select value={options.delimiter} onValueChange={(v) => setOptions({ delimiter: v as Delimiter })}>
        <SelectTrigger id={id} className="h-8 w-full text-caption">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPLIT_DELIMITERS.map((d) => (
            <SelectItem key={d} value={d} className="text-caption">
              {t(`listTool.delimiters.${d}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const PRESETS: OutputPreset[] = ["lines", "comma", "quoted-comma", "sql", "json", "otm-oids"];

function PresetSelect({ id }: { id: string }) {
  const { t } = useTranslation();
  const { options, setOptions } = useListTool();
  return (
    <Field label={t("listTool.output")}>
      <Select value={options.preset} onValueChange={(v) => setOptions({ preset: v as OutputPreset })}>
        <SelectTrigger id={id} className="h-8 w-full text-caption">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p} value={p} className="text-caption">
              {t(`listTool.presets.${p}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const DOMAIN_ACTIONS: DomainAction[] = ["keep", "remove", "add", "replace"];

function DomainControl() {
  const { t } = useTranslation();
  const { options, setOptions } = useListTool();
  return (
    <div className="flex flex-col gap-2">
      <Field label={t("listTool.domain")}>
        <Select value={options.domain} onValueChange={(v) => setOptions({ domain: v as DomainAction })}>
          <SelectTrigger id="list-domain-action" className="h-8 w-full text-caption">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOMAIN_ACTIONS.map((d) => (
              <SelectItem key={d} value={d} className="text-caption">
                {t(`listTool.domains.${d}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {options.domain === "add" && (
        <Field label={t("listTool.domainToAdd")}>
          <Input
            value={options.domainAdd}
            onChange={(e) => setOptions({ domainAdd: e.target.value })}
            placeholder={t("listTool.ksap")}
            className="h-8 font-mono text-caption"
            spellCheck={false}
          />
        </Field>
      )}
      {options.domain === "replace" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("listTool.from")}>
            <Input
              value={options.domainReplaceFrom}
              onChange={(e) => setOptions({ domainReplaceFrom: e.target.value })}
              placeholder={t("listTool.ksapEu")}
              className="h-8 font-mono text-caption"
              spellCheck={false}
            />
          </Field>
          <Field label={t("listTool.to")}>
            <Input
              value={options.domainReplaceTo}
              onChange={(e) => setOptions({ domainReplaceTo: e.target.value })}
              placeholder={t("listTool.test")}
              className="h-8 font-mono text-caption"
              spellCheck={false}
            />
          </Field>
        </div>
      )}
      <p className="text-caption text-muted-foreground">
        {t("listTool.gidsSplitOnThe")}
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label htmlFor={id} className="text-caption">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  );
}

/* -------------------------------------------------------------- stats bar */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-mono text-caption font-semibold tabular-nums">{value}</span>
      <span className="text-caption text-muted-foreground">{label}</span>
    </span>
  );
}

function StatsBar() {
  const { t } = useTranslation();
  const { stats } = useListTool();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <Stat value={stats.valuesIn} label={t("listTool.valuesInLabel", { count: stats.valuesIn })} />
      <Stat value={stats.valuesOut} label={t("listTool.valuesOutLabel", { count: stats.valuesOut })} />
      {stats.duplicatesRemoved > 0 && <Stat value={stats.duplicatesRemoved} label={t("listTool.duplicatesRemoved")} />}
      {stats.blanksRemoved > 0 && <Stat value={stats.blanksRemoved} label={t("listTool.blanksRemoved")} />}
      <span className="text-caption text-muted-foreground">
        <span className="font-mono text-caption font-semibold tabular-nums text-foreground">{stats.withDomain}</span>{" "}
        {t("listTool.withDomain")}{" "}
        <span className="font-mono text-caption font-semibold tabular-nums text-foreground">{stats.withoutDomain}</span>{" "}
        {t("listTool.without")}
      </span>
    </div>
  );
}

/* ------------------------------------------------------- validation hints */

function ValidationHints({ onReveal }: { onReveal: (value: string) => void }) {
  const { t } = useTranslation();
  const { stats, flaggedValues } = useListTool();
  const [open, setOpen] = useState(false);
  if (stats.flagged === 0) return null;
  const shown = flaggedValues.slice(0, 12);
  return (
    <div className="rounded-lg border border-warning bg-warning-subtle px-3 py-2">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-icon-sm shrink-0 text-warning" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-caption text-warning">
          {t("listTool.flagged", { count: stats.flagged })}
        </p>
        <Button variant="link" size="sm" className="h-auto px-0 py-0 text-caption" onClick={() => setOpen((o) => !o)}>
          {open ? t("listTool.hide") : t("listTool.show")}
        </Button>
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1">
          {shown.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onReveal(v)}
              className="rounded border border-warning bg-background px-2 py-1 font-mono text-caption text-warning hover:bg-warning-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning "
              title={t("listTool.selectInInput")}
            >
              {v}
            </button>
          ))}
          {flaggedValues.length > shown.length && (
            <span className="px-1 py-1 text-caption text-muted-foreground">
              {t("listTool.v1More", { v1: flaggedValues.length - shown.length })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ options box */

function OptionsPanel() {
  const { t } = useTranslation();
  const { options, setOptions } = useListTool();
  const isQuotedComma = options.preset === "quoted-comma";
  const isSqlLike = options.preset === "sql" || options.preset === "otm-oids";
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-caption font-semibold text-muted-foreground">{t("listTool.clean")}</p>
          <ToggleRow id="opt-trim" label={t("listTool.trimWhitespace")} checked={options.trim} onChange={(v) => setOptions({ trim: v })} />
          <ToggleRow id="opt-blanks" label={t("listTool.removeBlanks")} checked={options.removeBlanks} onChange={(v) => setOptions({ removeBlanks: v })} />
          <ToggleRow id="opt-dupes" label={t("listTool.removeDuplicates")} checked={options.removeDuplicates} onChange={(v) => setOptions({ removeDuplicates: v })} />
          <ToggleRow
            id="opt-dupes-ci"
            label={t("listTool.caseInsensitiveDuplicates")}
            checked={options.caseInsensitiveDuplicates}
            onChange={(v) => setOptions({ caseInsensitiveDuplicates: v })}
          />
          <Field label={t("listTool.sort")} className="mt-1">
            <Select value={options.sort} onValueChange={(v) => setOptions({ sort: v as SortMode })}>
              <SelectTrigger className="h-8 w-full text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-caption">{t("listTool.none")}</SelectItem>
                <SelectItem value="az" className="text-caption">{t("listTool.aZ")}</SelectItem>
                <SelectItem value="za" className="text-caption">{t("listTool.zA")}</SelectItem>
                <SelectItem value="natural" className="text-caption">{t("listTool.naturalOrl2Before")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DomainControl />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("listTool.addPrefixToXid")}>
            <Input value={options.addPrefix} onChange={(e) => setOptions({ addPrefix: e.target.value })} placeholder={t("listTool.eGOrl")} className="h-8 font-mono text-caption" spellCheck={false} />
          </Field>
          <Field label={t("listTool.stripPrefix")}>
            <Input value={options.stripPrefix} onChange={(e) => setOptions({ stripPrefix: e.target.value })} placeholder={t("listTool.eGOrl")} className="h-8 font-mono text-caption" spellCheck={false} />
          </Field>
          <Field label={t("listTool.addSuffixToXid")}>
            <Input value={options.addSuffix} onChange={(e) => setOptions({ addSuffix: e.target.value })} placeholder={t("listTool.eGV2")} className="h-8 font-mono text-caption" spellCheck={false} />
          </Field>
          <Field label={t("listTool.stripSuffix")}>
            <Input value={options.stripSuffix} onChange={(e) => setOptions({ stripSuffix: e.target.value })} placeholder={t("listTool.eGV2")} className="h-8 font-mono text-caption" spellCheck={false} />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <Field label={t("listTool.case")}>
            <Select value={options.case} onValueChange={(v) => setOptions({ case: v as "keep" | "upper" })}>
              <SelectTrigger className="h-8 w-full text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep" className="text-caption">{t("listTool.keepAsPasted")}</SelectItem>
                <SelectItem value="upper" className="text-caption">{t("listTool.uppercase")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={isQuotedComma ? t("listTool.quoteStyle") : t("listTool.quoteStyleQuoted")}>
            <Select
              value={options.quoteStyle}
              onValueChange={(v) => setOptions({ quoteStyle: v as "single" | "double" | "none" })}
              disabled={!isQuotedComma}
            >
              <SelectTrigger className="h-8 w-full text-caption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double" className="text-caption">{t("listTool.double")}</SelectItem>
                <SelectItem value="single" className="text-caption">{t("listTool.single")}</SelectItem>
                <SelectItem value="none" className="text-caption">{t("listTool.none")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {isSqlLike && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label={options.preset === "sql" ? t("listTool.sqlColumn") : t("listTool.objectIdColumn")}>
                <Input
                  value={options.sqlColumn}
                  onChange={(e) => setOptions({ sqlColumn: e.target.value })}
                  placeholder={t("listTool.shipmentGid")}
                  className="h-8 font-mono text-caption"
                  spellCheck={false}
                />
              </Field>
              {options.preset === "sql" && (
                <div className="flex items-end justify-between gap-3 pb-1">
                  <Label htmlFor="opt-chunk" className="text-caption">
                    {t("listTool.chunkInListsAt", { v1: fmtNumber(userLocale(), ORACLE_IN_LIMIT) })}
                  </Label>
                  <Switch id="opt-chunk" checked={options.chunkInLists} onCheckedChange={(v) => setOptions({ chunkInLists: v })} className="scale-90" />
                </div>
              )}
            </div>
            {options.preset === "sql" && options.chunkInLists && (
              <p className="inline-flex items-start gap-2 text-caption text-muted-foreground">
                <Info className="mt-1 size-icon-sm shrink-0 text-primary" aria-hidden="true" />
                {t("listTool.oracleRejectsInLists", { v1: fmtNumber(userLocale(), ORACLE_IN_LIMIT) })}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- main tool */

function OracleBanner({ count }: { count: number }) {
  const { t } = useTranslation();
  const groups = Math.ceil(count / ORACLE_IN_LIMIT);
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <Info className="mt-1 size-icon-sm shrink-0 text-primary" aria-hidden="true" />
      <p className="text-caption text-muted-foreground">
        {t("listTool.oracleRejectsInLists2", { v1: fmtNumber(userLocale(), ORACLE_IN_LIMIT) })}{" "}
        <span className="font-mono font-semibold tabular-nums text-foreground">{groups}</span>{" "}
        {t("listTool.groupCount", { count: groups })}{" "}{t("listTool.joinedWithOrPaste")}
      </p>
    </div>
  );
}

function TrayMoreLink() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTrayOpen } = useApp();
  return (
    <button
      type="button"
      className="inline-flex w-fit items-center gap-1 text-caption text-primary-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => {
        setTrayOpen(false);
        navigate("/list");
      }}
    >
      {t("listTool.moreOptions")}
      <ArrowRight className="size-icon-sm" aria-hidden="true" />
    </button>
  );
}

export function ListTool({ variant }: { variant: "page" | "tray" }) {
  const { t } = useTranslation();
  const tool = useListTool();
  const { input, setInput, options, setOptions, outputText, stats, copy, download, clear, swap, loadSample } = tool;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const pasteFromClipboard = () => {
    navigator.clipboard
      .readText()
      .then((text) => setInput(text))
      .catch(() => toast.error(t("listTool.clipboardUnavailablePasteWith")));
  };

  const reveal = (value: string) => {
    const el = inputRef.current;
    if (!el) return;
    const idx = input.indexOf(value);
    if (idx < 0) return;
    el.focus();
    el.setSelectionRange(idx, idx + value.length);
    el.scrollTop = Math.max(0, (input.slice(0, idx).split("\n").length - 8) * 18);
  };

  // Ctrl/Cmd+↵ copies the output from anywhere on the page (window-level so it
  // still fires when focus sits outside the tool, e.g. after the empty state).
  useEffect(() => {
    if (variant !== "page") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, copy]);

  const hasInput = input.trim().length > 0;
  const paneHeight = variant === "page" ? "h-80" : "h-36";
  const controlId = (name: string) => `list-${variant}-${name}`;

  if (!hasInput) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card text-center",
          variant === "page" ? "px-6 py-14" : "px-4 py-8",
        )}
      >
        <ListChecks className="size-icon-lg text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="text-body font-semibold">{t("listTool.noValuesYet")}</p>
          <p className="mt-1 max-w-sm text-caption text-muted-foreground">
            {t("listTool.pasteAListBelow")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" onClick={loadSample}>
            <Wand2 className="size-icon-sm" aria-hidden="true" />
            {t("listTool.trySampleData")}
          </Button>
          <Button size="sm" variant="outline" onClick={pasteFromClipboard}>
            <ClipboardPaste className="size-icon-sm" aria-hidden="true" />
            {t("listTool.pasteFromClipboard")}
          </Button>
        </div>
        <p className="inline-flex items-center gap-2 text-caption text-muted-foreground">
          <ShieldCheck className="size-icon-sm text-primary" aria-hidden="true" />
          {t("listTool.pastedContentIsProcessed")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", variant === "page" && "outline-none")}>
      {/* Panes */}
      <div className={cn("grid gap-3", variant === "page" && "lg:grid-cols-2")}>
        <section aria-label={t("listTool.inputValues")} className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-caption font-semibold text-muted-foreground">{t("listTool.input")}</h2>
            <span className="font-mono text-caption tabular-nums text-muted-foreground">
              {t("listTool.valueCount", { count: stats.valuesIn })}
            </span>
          </div>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={t("listTool.inputPlaceholder")}
            className={cn(paneHeight, "resize-none overflow-auto font-mono text-body leading-5")}
            aria-label={t("listTool.inputValues")}
          />
        </section>
        <section aria-label={t("listTool.outputValues")} className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-caption font-semibold text-muted-foreground">{t("listTool.output")}</h2>
            <span className="font-mono text-caption tabular-nums text-muted-foreground">
              {t("listTool.valueCount", { count: stats.valuesOut })}
            </span>
          </div>
          <Textarea
            readOnly
            value={outputText}
            spellCheck={false}
            className={cn(
              paneHeight,
              "resize-none overflow-auto font-mono text-body leading-5",
              "border-primary/30 bg-muted/30",
            )}
            aria-label={t("listTool.outputValues")}
          />
        </section>
      </div>

      {/* Stats + validation */}
      <StatsBar />
      <ValidationHints onReveal={reveal} />

      {options.preset === "sql" && options.chunkInLists && stats.valuesOut > 0 && (
        <OracleBanner count={stats.valuesOut} />
      )}

      {/* Most-used controls */}
      <div className="flex flex-wrap items-end gap-2">
        <SplitSelect id={controlId("split")} />
        <PresetSelect id={controlId("preset")} />
        {variant === "tray" && (
          <>
            <Field label={t("listTool.duplicates")}>
              <div className="flex h-8 items-center">
                <Switch
                  id={controlId("dupes")}
                  checked={options.removeDuplicates}
                  onCheckedChange={(v) => setOptions({ removeDuplicates: v })}
                  className="scale-90"
                />
              </div>
            </Field>
            <Field label={t("listTool.domain")}>
              <Select
                value={options.domain}
                onValueChange={(v) => setOptions({ domain: v as DomainAction })}
              >
                <SelectTrigger id={controlId("domain")} className="h-8 w-40 text-caption">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_ACTIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-caption">
                      {t(`listTool.domains.${d}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
      </div>

      {/* Options */}
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-fit gap-2 px-2 text-caption">
            <ChevronDown className={cn("size-icon-sm transition-transform", optionsOpen && "rotate-180")} aria-hidden="true" />
            {t("listTool.options")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 data-[state=closed]:animate-none">
          {variant === "page" ? <OptionsPanel /> : <p className="text-caption text-muted-foreground">{t("listTool.allOptionsAreAvailable")}</p>}
        </CollapsibleContent>
      </Collapsible>
      {variant === "tray" && <TrayMoreLink />}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={copy}>
          <Copy className="size-icon-sm" aria-hidden="true" />
          {t("listTool.copyOutput")}
          <KbdGroup aria-hidden="true">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>
        </Button>
        <Button size="sm" variant="outline" onClick={download} disabled={stats.valuesOut === 0}>
          <Download className="size-icon-sm" aria-hidden="true" />
          {t("listTool.downloadTxt")}
        </Button>
        <Button size="sm" variant="outline" onClick={swap} disabled={stats.valuesOut === 0}>
          <ArrowDownUp className="size-icon-sm" aria-hidden="true" />
          {t("listTool.swapToInput")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
        >
          <X className="size-icon-sm" aria-hidden="true" />
          {t("listTool.clear")}
        </Button>
      </div>
    </div>
  );
}
