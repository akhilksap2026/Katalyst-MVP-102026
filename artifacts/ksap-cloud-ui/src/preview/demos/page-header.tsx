// ksap-allow: documentation examples use source terminology, not product strings.
import { PageHeader } from "../../components/patterns/page-header";
import { Button } from "../../components/ui/button";

export default function PageHeaderStory() {
  return <div className="ksap-story">
    <PageHeader
      breadcrumbs={[{ label: "Operations", href: "#" }, { label: "Shipments", href: "#" }, { label: "SHP-1042" }]}
      title="Shipment SHP-1042"
      description="Chicago to Dallas, tendered to carrier."
      action={<Button>Tender to carrier</Button>}
    />
    <PageHeader title="Shipments" />
  </div>;
}
