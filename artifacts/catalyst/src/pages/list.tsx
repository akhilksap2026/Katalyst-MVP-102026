import { useEffect } from "react";
import { useSearchParams } from "@/lib/router";
import { ListTool } from "@/components/list/list-tool";
import { useActivity } from "@/hooks/use-activity";
import { useListTool } from "@/state/list-tool";

export default function ListPage() {
  useActivity("tool", "List Utility", "/list");
  const { consumeDraft, loadSampleIfEmpty } = useListTool();
  const [searchParams] = useSearchParams();

  // A draft handed over by another page wins; otherwise ?sample=1 loads the
  // bundled sample list when the input is empty.
  useEffect(() => {
    if (consumeDraft()) return;
    if (searchParams.get("sample") === "1") loadSampleIfEmpty();
  }, [searchParams, consumeDraft, loadSampleIfEmpty]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight">List Utility</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Clean pasted value lists, remove duplicates, chunk them for SQL IN lists and copy the result. Options
          are remembered; content never leaves this browser.
        </p>
      </header>
      <ListTool variant="page" />
    </div>
  );
}
