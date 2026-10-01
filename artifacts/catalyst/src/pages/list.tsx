import { useTranslation } from "react-i18next";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { useEffect } from "react";
import { useSearchParams } from "@/lib/router";
import { ListTool } from "@/components/list/list-tool";
import { useActivity } from "@/hooks/use-activity";
import { useListTool } from "@/state/list-tool";

export default function ListPage() {
  const { t } = useTranslation();
  useActivity("tool", t("nav.listUtility"), "/list");
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
      <PageHeader
        className="mb-6"
        title={t("list.listUtility")}
        description={t("list.cleanPastedValueLists")}
      />
      <ListTool variant="page" />
    </div>
  );
}
