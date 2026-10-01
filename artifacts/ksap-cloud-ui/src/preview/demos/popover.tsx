// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function PopoverStory() {
  const [open, setOpen] = useState(false);
  return <div className="ksap-story">
    <div className="flex flex-wrap items-center gap-4">
      <Popover><PopoverTrigger asChild><Button variant="outline">Edit reference</Button></PopoverTrigger>
        <PopoverContent><div className="grid gap-2"><Label htmlFor="pop-ref">Reference</Label><Input id="pop-ref" defaultValue="SH-20418" /></div></PopoverContent></Popover>
      <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline">Open state</Button></PopoverTrigger>
        <PopoverContent side="bottom"><p className="text-body">Controlled with the open prop.</p></PopoverContent></Popover>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Enter or Space opens; focus moves inside; Esc closes and returns focus.</p>
  </div>;
}
