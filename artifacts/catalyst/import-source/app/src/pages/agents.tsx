import { AgentImportFlow } from "@/components/agents/import-flow";
import { useActivity } from "@/hooks/use-activity";

export default function AgentsPage() {
  useActivity("tool", "Agent Compare", "/agents");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight">Agent Compare</h1>
        <button type="button" onClick={() => window.dispatchEvent(new Event("catalyst:tour"))} className="text-caption text-primary hover:underline">
          Take a tour
        </button>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Compare automation agents between two extracts — for example DEV and PROD — and review every added,
        removed and changed event and action.
      </p>

      <div className="mt-8">
        <AgentImportFlow />
      </div>
    </div>
  );
}
