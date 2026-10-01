// ksap-allow: documentation examples use source terminology, not product strings.
import { Package } from "lucide-react";
import { EmptyStateContent } from "../../components/patterns/empty-state-content";

export default function EmptyStateContentStory() {
  return <div className="ksap-story">
    <EmptyStateContent icon={<Package />} title="No shipments yet" description="Shipments you create appear here so you can track each load." actionLabel="Create shipment" />
    <EmptyStateContent title="No results" description="Nothing matches this filter." />
  </div>;
}
