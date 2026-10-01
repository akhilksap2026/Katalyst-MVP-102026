import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Building2, Globe, Lock, Plus, ShieldAlert, ShieldCheck, Unplug, User } from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { track } from "@/lib/analytics";
import { StatusBadge, type StatusBadgeStatus } from "@workspace/ksap-cloud-ui/components/patterns/status-badge";
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ksap-cloud-ui/components/ui/dialog";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ksap-cloud-ui/components/ui/select";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

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

const ENV_VARIANT: Record<string, StatusBadgeStatus> = {
  PROD: "danger",
  DEV: "success",
  TEST: "info",
};

function EnvTag({ environment }: { environment: string }) {
  return (
    <StatusBadge
      status={ENV_VARIANT[environment.toUpperCase()] ?? "warning"}
      className="font-mono"
      data-testid="env-tag"
    >
      {environment.toUpperCase()}
    </StatusBadge>
  );
}

let nextId = 1;

export function ConnectionMock() {
  const { t } = useTranslation();
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
      customer: customer.trim() || t("connectionMock.customerFallback"),
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
    <section aria-label={t("connectionMock.liveConnectionPreview")} className="grid gap-4">
      {/* Watermark */}
      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-primary/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="block -rotate-12 whitespace-nowrap rounded-lg border-2 border-primary/40 px-4 py-2 font-mono text-subheading font-semibold text-primary/40 select-none md:text-heading">
              {t("connectionMock.previewNotFunctional")}
            </span>
          </div>
        </div>

        <div className="relative grid gap-4 bg-card/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-body font-semibold">{t("connectionMock.v2ConnectionFlowMock")}</h3>
            <Badge variant="secondary" className="gap-2 text-caption">
              <ShieldCheck className="size-icon-sm text-primary" aria-hidden="true" />
              {t("connectionMock.sessionOnlyResetsOn")}
            </Badge>
            <div className="ms-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                data-testid="mock-add-connection"
              >
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t("connectionMock.addConnection")}
              </Button>
              {connections.length > 0 && (
                <Button size="sm" variant="ghost" onClick={disconnect} data-testid="mock-disconnect">
                  <Unplug className="size-icon-sm" aria-hidden="true" />
                  {t("connectionMock.disconnectAll")}
                </Button>
              )}
            </div>
          </div>

          {connections.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-3">
              <span className="text-caption text-muted-foreground">{t("connectionMock.environmentSwitcher")}</span>
              <div className="flex flex-wrap gap-2" role="listbox" aria-label={t("connectionMock.connectedEnvironments")}>
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
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-caption transition-colors",
                      c.id === activeId
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50",
                    )}
                  >
                    <Building2 className="size-icon-sm text-muted-foreground" aria-hidden="true" />
                    <span className="font-semibold">{c.customer}</span>
                    <EnvTag environment={c.environment} />
                  </button>
                ))}
              </div>
              {active && (
                <span className="ms-auto hidden items-center gap-2 font-mono text-caption text-muted-foreground md:flex">
                  <Globe className="size-icon-sm" aria-hidden="true" />
                  {active.baseUrl || "https://otm.example.com"} · {active.username}
                </span>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-background/60 px-4 py-6 text-center text-caption text-muted-foreground">
              {t("connectionMock.noConnectionsAddOne")}
            </p>
          )}

          {permissionError && active && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-danger bg-danger-subtle px-4 py-3"
              data-testid="mock-permission-error"
            >
              <ShieldAlert className="mt-1 size-icon-sm shrink-0 text-danger" aria-hidden="true" />
              <div className="text-body">
                <p className="font-semibold text-danger">
                  {t("connectionMock.yourOtmUserLacks")}
                </p>
                <p className="text-muted-foreground">
                  {t("connectionMock.askYourOtmAdministrator")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ms-auto shrink-0"
                onClick={() => setPermissionError(false)}
              >
                {t("connectionMock.dismiss")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add connection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="mock-connection-dialog">
          <DialogHeader>
            <DialogTitle>{t("connectionMock.addConnection")}</DialogTitle>
            <DialogDescription>
              {t("connectionMock.v2PreviewConnectingDoes")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="conn-customer">{t("connectionMock.customerName")}</Label>
              <Input
                id="conn-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={t("connectionMock.eGKsapLogistics")}
                autoComplete="organization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-environment">{t("connectionMock.environmentLabel")}</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger id="conn-environment" data-testid="mock-env-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEV">{t("connectionMock.dev")}</SelectItem>
                  <SelectItem value="TEST">{t("connectionMock.test")}</SelectItem>
                  <SelectItem value="PROD">{t("connectionMock.prod")}</SelectItem>
                  <SelectItem value="CUSTOM">{t("connectionMock.custom")}</SelectItem>
                </SelectContent>
              </Select>
              {environment === "CUSTOM" && (
                <Input
                  aria-label={t("connectionMock.customEnvironmentLabel")}
                  value={customEnv}
                  onChange={(e) => setCustomEnv(e.target.value)}
                  placeholder={t("connectionMock.eGUatTraining")}
                  className="mt-1"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-url">{t("connectionMock.otmBaseUrl")}</Label>
              <Input
                id="conn-url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("connectionMock.httpsOtmCustomerCom")}
                autoComplete="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-username">{t("connectionMock.username")}</Label>
              <div className="relative">
                <User className="absolute top-3 start-2.5 size-icon-sm text-muted-foreground" aria-hidden="true" />
                <Input
                  id="conn-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("connectionMock.otmUser")}
                  autoComplete="username"
                  className="ps-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-password">{t("connectionMock.password")}</Label>
              <div className="relative">
                <Lock className="absolute top-3 start-2.5 size-icon-sm text-muted-foreground" aria-hidden="true" />
                <Input
                  id="conn-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="ps-8"
                />
              </div>
            </div>
            <p className="flex items-start gap-2 text-caption text-muted-foreground">
              <ShieldCheck className="mt-1 size-icon-sm shrink-0 text-primary" aria-hidden="true" />
              {t("connectionMock.credentialsAreUsedFor")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("connectionMock.cancel")}
            </Button>
            <Button
              onClick={() => {
                connect();
                track("mock_connection_added");
                toast.info(t("connectionMock.previewOnlyNoConnection"), {
                  description: "The V2 flow will authenticate against OTM here.",
                });
              }}
              data-testid="mock-connect"
            >
              {t("connectionMock.connect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
