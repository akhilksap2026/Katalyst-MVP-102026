// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../components/ui/hover-card";
import { Button } from "../../components/ui/button";

export default function HoverCardStory() {
  const [open, setOpen] = useState(false);
  return <div className="ksap-story">
    <div className="flex flex-wrap items-center gap-4">
      <HoverCard><HoverCardTrigger asChild><Button variant="link">Northline Freight</Button></HoverCardTrigger>
        <HoverCardContent><p className="text-subheading">Northline Freight</p><p className="text-muted-foreground">Carrier summary opens on hover or focus.</p></HoverCardContent></HoverCard>
      <HoverCard open={open} onOpenChange={setOpen}><HoverCardTrigger asChild><Button variant="outline">Open state</Button></HoverCardTrigger>
        <HoverCardContent side="bottom"><p className="text-subheading">Open</p><p className="text-muted-foreground">Controlled with the open prop.</p></HoverCardContent></HoverCard>
    </div>
  </div>;
}
