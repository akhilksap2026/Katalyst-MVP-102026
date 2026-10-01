import { useState } from "react";
import { Building2, Globe, Lock, Plus, ShieldAlert, ShieldCheck, Unplug, User } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Mock of the V2 live-connection flow. Clickable so stakeholders can walk the
 * intended UX, but it never talks to OTM: "Connect" simulates a session and
 * everything resets on refresh. Watermarked accordingly.
 */

interface Connection {
  id: string;
  customer: string;
  environment: string;
  baseUrl: string;
  username: string;
}

const ENV_COLORS: Record<string, string> = {
  PROD: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  DEV: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  TEST: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

function EnvTag({ environment }: { environment: string }) {
  const cls =
    ENV_COLORS[environment.toUpperCase()] ??
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase", cls)} data-testid="env-tag">
      {environment.toUpperCase()}
    </Badge>
  );
}

let nextId = 1;

export function ConnectionMock() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Form state — session only, never persisted.
  const [customer, setCustomer] = useState("");
  const [environment, setEnvironment] = useState("DEV");
  const [customEnv, setCustomEnv] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const active = connections.find((c) => c.id === activeId) ?? null;

  const connect = () => {
    const env = environment === "CUSTOM" ? customEnv.trim() || "CUSTOM" : environment;
    const conn: Connection = {
      id: `conn-${nextId++}`,
      customer: customer.trim() || "Customer",
      environment: env,
      baseUrl: baseUrl.trim(),
      username: username.trim(),
    };
    setConnections((prev) => [...prev, conn]);
    setActiveId(conn.id);
    setPermissionError(true);
    setDialogOpen(false);
    // Reset the form so nothing lingers in memory beyond the session list.
    setCustomer("");
    setEnvironment("DEV");
    setCustomEnv("");
    setBaseUrl("");
    setUsername("");
    setPassword("");
  };

  const disconnect = () => {
    setConnections([]);
    setActiveId(null);
    setPermissionError(false);
  };

  return (
    <section aria-label="Live connection preview" className="grid gap-4">
      {/* Watermark */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="block rotate-[-14deg] whitespace-nowrap rounded-lg border-2 border-primary/40 px-4 py-1.5 font-mono text-lg font-bold tracking-[0.25em] text-primary/40 uppercase select-none md:text-xl">
              Preview — not functional
            </span>
          </div>
        </div>

        <div className="relative grid gap-4 bg-card/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold">V2 connection flow (mock)</h3>
            <Badge variant="secondary" className="gap-1.5 text-caption">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Session only — resets on refresh
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                data-testid="mock-add-connection"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add connection
              </Button>
              {connections.length > 0 && (
                <Button size="sm" variant="ghost" onClick={disconnect} data-testid="mock-disconnect">
                  <Unplug className="size-3.5" aria-hidden="true" />
                  Disconnect all
                </Button>
              )}
            </div>
          </div>

          {connections.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-3">
              <span className="text-caption text-muted-foreground">Environment switcher</span>
              <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Connected environments">
                {connections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={c.id === activeId}
                    onClick={() => {
                      setActiveId(c.id);
                      setPermissionError(true);
                    }}
                    data-testid={`mock-env-${c.customer}-${c.environment}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                      c.id === activeId
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50",
                    )}
                  >
                    <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{c.customer}</span>
                    <EnvTag environment={c.environment} />
                  </button>
                ))}
              </div>
              {active && (
                <span className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground md:flex">
                  <Globe className="size-3.5" aria-hidden="true" />
                  {active.baseUrl || "https://otm.example.com"} · {active.username}
                </span>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-background/60 px-4 py-6 text-center text-caption text-muted-foreground">
              No connections. Add one to preview how the header environment switcher will work.
            </p>
          )}

          {permissionError && active && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3"
              data-testid="mock-permission-error"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-medium text-red-700 dark:text-red-400">
                  Your OTM user lacks the REST view permission for Agent.
                </p>
                <p className="text-muted-foreground">
                  Ask your OTM administrator to grant it, then reconnect.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto shrink-0"
                onClick={() => setPermissionError(false)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add connection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="mock-connection-dialog">
          <DialogHeader>
            <DialogTitle>Add connection</DialogTitle>
            <DialogDescription>
              V2 preview — connecting does nothing but simulate a session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="conn-customer">Customer name</Label>
              <Input
                id="conn-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. KSAP Logistics"
                autoComplete="organization"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="conn-environment">Environment label</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger id="conn-environment" data-testid="mock-env-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEV">DEV</SelectItem>
                  <SelectItem value="TEST">TEST</SelectItem>
                  <SelectItem value="PROD">PROD</SelectItem>
                  <SelectItem value="CUSTOM">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {environment === "CUSTOM" && (
                <Input
                  aria-label="Custom environment label"
                  value={customEnv}
                  onChange={(e) => setCustomEnv(e.target.value)}
                  placeholder="e.g. UAT, TRAINING"
                  className="mt-1"
                />
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="conn-url">OTM base URL</Label>
              <Input
                id="conn-url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://otm.customer.com"
                autoComplete="url"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="conn-username">Username</Label>
              <div className="relative">
                <User className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="conn-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="OTM user"
                  autoComplete="username"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="conn-password">Password</Label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="conn-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-8"
                />
              </div>
            </div>
            <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              Credentials are used for this session only. They are never saved or logged.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                connect();
                track("mock_connection_added");
                toast.info("Preview only — no connection was made", {
                  description: "The V2 flow will authenticate against OTM here.",
                });
              }}
              data-testid="mock-connect"
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
