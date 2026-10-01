// ksap-allow: documentation examples use source terminology, not product strings.
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Button } from "../../components/ui/button";
import { Guidelines } from "../parts";

export default function TooltipStory() {
  return <div className="ksap-story">
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-4">
        <Tooltip><TooltipTrigger asChild><Button variant="outline">Hover or focus</Button></TooltipTrigger><TooltipContent>Search (Ctrl K)</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="outline" disabled>Disabled</Button></TooltipTrigger><TooltipContent>Unavailable</TooltipContent></Tooltip>
      </div>
    </TooltipProvider>
    <p className="text-caption text-muted-foreground">Opens on pointer hover or keyboard focus; Esc closes.</p>
    <Guidelines items={["Every shortcut is shown next to its action (menu, tooltip, palette)."]} />
  </div>;
}
