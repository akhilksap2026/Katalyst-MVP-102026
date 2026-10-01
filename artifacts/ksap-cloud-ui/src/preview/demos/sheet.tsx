// ksap-allow: documentation examples use source terminology, not product strings.
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const sides = ["right", "left", "top", "bottom"] as const;

export default function SheetStory() {
  return <div className="ksap-story">
    <div className="flex flex-wrap items-center gap-4">
      {sides.map((side) => <Sheet key={side}>
        <SheetTrigger asChild><Button variant="outline">{side === "right" ? "Edit shipment (end edge)" : `Open ${side}`}</Button></SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader><SheetTitle>Edit shipment</SheetTitle><SheetDescription>Changes apply when you save.</SheetDescription></SheetHeader>
          <div className="grid gap-2"><Label htmlFor={`sheet-ref-${side}`}>Reference</Label><Input id={`sheet-ref-${side}`} defaultValue="SH-20418" /></div>
          <SheetFooter><SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose><SheetClose asChild><Button>Save changes</Button></SheetClose></SheetFooter>
        </SheetContent>
      </Sheet>)}
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: focus is trapped inside; Esc or the close button returns focus to the trigger. Docked edges have no corner.</p>
  </div>;
}
