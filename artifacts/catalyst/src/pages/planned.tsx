import { Link, useParams } from "@/lib/router";
import { Check, ChevronRight, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FeatureFeedback } from "@/components/planned/feature-feedback";
import { ConnectionMock } from "@/components/planned/connection-mock";
import { getPlannedFeature } from "@/data/planned";
import { useActivity } from "@/hooks/use-activity";

export default function PlannedPage() {
  const { feature = "" } = useParams();
  const current = getPlannedFeature(feature);
  useActivity("tool", current ? `Planned: ${current.title}` : "Planned feature", `/planned/${feature}`);

  if (!current) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[22px] font-semibold tracking-tight">Unknown feature</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono">{feature}</span> is not on the planned list.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Planned</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex flex-col gap-6 rounded-xl border bg-card p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted">
            <Construction className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{current.title}</h1>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">{current.description}</p>
          </div>
        </div>

        <section aria-label="Intended capabilities">
          <h2 className="text-subheading font-semibold">Intended capabilities</h2>
          <ul className="mt-2 grid gap-1.5">
            {current.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {cap}
              </li>
            ))}
          </ul>
        </section>

        {current.slug === "live-otm-connection" && <ConnectionMock />}

        <FeatureFeedback title={current.title} />
      </div>
    </div>
  );
}
