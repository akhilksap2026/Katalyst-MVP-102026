import { useTranslation } from "react-i18next";
import { Link, useParams } from "@/lib/router";
import { Check, Construction } from "lucide-react";
import { PageHeader } from "@workspace/ksap-cloud-ui/components/patterns/page-header";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@workspace/ksap-cloud-ui/components/patterns/panel";
import { StatusBadge } from "@workspace/ksap-cloud-ui/components/patterns/status-badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@workspace/ksap-cloud-ui/components/ui/breadcrumb";
import { FeatureFeedback } from "@/components/planned/feature-feedback";
import { ConnectionMock } from "@/components/planned/connection-mock";
import { getPlannedFeature } from "@/data/planned";
import { useActivity } from "@/hooks/use-activity";

export default function PlannedPage() {
  const { t } = useTranslation();
  const { feature = "" } = useParams();
  const current = getPlannedFeature(t, feature);
  useActivity("tool", current ? t("planned.activityLabel", { title: current.title }) : t("planned.unknownFeature"), `/planned/${feature}`);

  if (!current) {
    return (
      <div className="mx-auto max-w-page p-4">
        <PageHeader
          title={t("planned.unknownFeature")}
          description={
            <>
              <span className="font-mono">{feature}</span> {t("planned.isNotOnThe")}
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">{t("planned.home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("planned.planned")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Construction className="size-icon-lg text-muted-foreground" aria-hidden="true" />
            {current.title}
            <StatusBadge status="info">{t("planned.planned")}</StatusBadge>
          </span>
        }
        description={current.description}
      />

      <Panel>
        <PanelHeader>
          <PanelTitle>{t("planned.intendedCapabilities")}</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <ul className="flex flex-col gap-2">
            {current.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-body">
                <Check className="size-icon-sm shrink-0 text-primary-ink" aria-hidden="true" />
                {cap}
              </li>
            ))}
          </ul>
        </PanelContent>
      </Panel>

      {current.slug === "live-otm-connection" && <ConnectionMock />}

      <FeatureFeedback title={current.title} />
    </div>
  );
}
