// ksap-allow: documentation examples use source terminology, not product strings.
import { Package } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";

export default function EmptyStory() {
  return <div className="ksap-story">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><Package /></EmptyMedia>
        <EmptyTitle>No shipments yet</EmptyTitle>
        <EmptyDescription>Create a shipment to start tracking loads.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button>Create shipment</Button></EmptyContent>
    </Empty>
    <Empty>
      <EmptyHeader>
        <EmptyMedia><Package /></EmptyMedia>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>Clear the filter to see all shipments.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>;
}
