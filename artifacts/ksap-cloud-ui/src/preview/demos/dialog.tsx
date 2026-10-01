// ksap-allow: documentation examples use source terminology, not product strings.
import { useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

export default function DialogStory() {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  return <div className="ksap-story">
    <div className="flex flex-wrap items-center gap-4">
      <Dialog><DialogTrigger asChild><Button variant="outline">Open primitive</Button></DialogTrigger>
        <DialogContent ref={contentRef}>
          <DialogHeader><DialogTitle>Dialog primitive</DialogTitle><DialogDescription>A low-level demonstration of the overlay, focus trap and close behavior. It holds no product data.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Close demonstration</Button></DialogClose></DialogFooter>
        </DialogContent></Dialog>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open controlled</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Controlled primitive</DialogTitle><DialogDescription>Open state lives in the parent.</DialogDescription></DialogHeader>
          <DialogFooter><Button onClick={() => setOpen(false)}>Close demonstration</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <p className="text-caption text-muted-foreground">Dialog is a primitive, not a product modal. Product tasks use Sheet; Command assembles Dialog. Esc closes and focus returns to the trigger; the content forwards a ref.</p>
  </div>;
}
