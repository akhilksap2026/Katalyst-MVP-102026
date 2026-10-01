import { useTranslation } from "react-i18next";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { AgentImportFlow } from "@/components/agents/import-flow";
import { useActivity } from "@/hooks/use-activity";

export default function AgentsPage() {
  const { t } = useTranslation();
  useActivity("tool", t("nav.agentCompare"), "/agents");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title={t("agents.agentCompare")}
        description={t("agents.compareAutomationAgentsBetween")}
        action={
          <Button variant="outline" onClick={() => window.dispatchEvent(new Event("catalyst:tour"))}>
            {t("agents.takeATour")}
          </Button>
        }
      />

      <div className="mt-8">
        <AgentImportFlow />
      </div>
    </div>
  );
}
